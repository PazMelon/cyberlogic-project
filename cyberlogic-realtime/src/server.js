const http = require('http');
const { WebSocketServer } = require('ws');
const { verifySession } = require('./auth');
const ChannelManager = require('./channels/ChannelManager');
require('dotenv').config();

const PORT = process.env.WS_PORT || 3001;
const REALTIME_WS_SECRET = process.env.REALTIME_WS_SECRET || 'cyberlogic_secret_token_123';

const channelManager = new ChannelManager();
channelManager.activityTracker.start();

// Create HTTP server for internal broadcast API and health checks
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Realtime-Secret');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // Internal Broadcast API for Laravel events
  if (req.url === '/internal/broadcast' && req.method === 'POST') {
    const secretHeader = req.headers['x-realtime-secret'];
    if (secretHeader !== REALTIME_WS_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { channel, payload, type, user_id } = data;

        if (!channel || !payload) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing channel or payload' }));
          return;
        }

        if (user_id) {
          console.log(`[HTTP Internal] Sending to User ${user_id} on ${channel} (type: ${type || 'broadcast'})`);
          channelManager.sendToUser(user_id, channel, type || 'broadcast', payload);
        } else {
          console.log(`[HTTP Internal] Broadcasting to ${channel} (type: ${type || 'broadcast'})`);
          channelManager.broadcast(channel, type || 'broadcast', payload);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

// Bind WebSocket Server to the same HTTP server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade manually to perform Laravel session auth
server.on('upgrade', async (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }

  console.log('[WS] Upgrade request received. Authenticating session...');
  
  const user = await verifySession(req);
  if (!user) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, user);
  });
});

// WebSocket Server Connection Handler
wss.on('connection', (ws, req, user) => {
  console.log(`[WS] Client connected: ${user.name} (ID: ${user.id})`);
  
  ws.isAlive = true;
  channelManager.registerClient(ws, user);

  // Connection heartbeat check
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Client messages
  ws.on('message', (message) => {
    channelManager.handleMessage(ws, message);
  });

  // Disconnection cleanup
  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${user.name} (ID: ${user.id})`);
    channelManager.unregisterClient(ws);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Connection error for user ${user.name}:`, error.message);
    channelManager.unregisterClient(ws);
  });
});

// Setup Ping interval to keep-alive and prune stale connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('[WS] Connection timed out. Terminating...');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
  channelManager.activityTracker.stop();
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Realtime Service] Server listening on http://0.0.0.0:${PORT}`);
  console.log(`[Realtime Service] Health check: http://localhost:${PORT}/health`);
  console.log(`[Realtime Service] WS Server path: ws://localhost:${PORT}/ws`);
});
