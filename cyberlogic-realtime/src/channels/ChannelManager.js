const pool = require('../db');

class ChannelManager {
  constructor() {
    // Maps channelName -> Set of WebSocket clients
    this.channels = new Map();
    // Maps client -> Set of channelNames subscribed
    this.clientSubscriptions = new Map();
    // Maps userId -> Set of WebSocket clients (handles multi-tab connections)
    this.onlineUsers = new Map();
    // Maps client -> user object
    this.clientUsers = new Map();
  }

  /**
   * Register a connection and update presence.
   */
  registerClient(client, user) {
    this.clientUsers.set(client, user);
    this.clientSubscriptions.set(client, new Set());

    if (!this.onlineUsers.has(user.id)) {
      this.onlineUsers.set(user.id, {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        clients: new Set(),
      });
      // Broadcast updated presence
      this.broadcastPresence();
    }
    this.onlineUsers.get(user.id).clients.add(client);
  }

  /**
   * Clean up connection subscriptions and presence.
   */
  unregisterClient(client) {
    const user = this.clientUsers.get(client);
    const subs = this.clientSubscriptions.get(client);

    if (subs) {
      for (const channelName of subs) {
        this.unsubscribe(client, channelName);
      }
    }

    this.clientSubscriptions.delete(client);
    this.clientUsers.delete(client);

    if (user && this.onlineUsers.has(user.id)) {
      const userPresence = this.onlineUsers.get(user.id);
      userPresence.clients.delete(client);

      if (userPresence.clients.size === 0) {
        this.onlineUsers.delete(user.id);
        // Broadcast updated presence
        this.broadcastPresence();
      }
    }
  }

  /**
   * Subscribe client to a channel.
   */
  subscribe(client, channelName) {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new Set());
    }
    this.channels.get(channelName).add(client);
    this.clientSubscriptions.get(client).add(channelName);
    console.log(`[WS] Client subscribed to channel: ${channelName}`);
  }

  /**
   * Unsubscribe client from a channel.
   */
  unsubscribe(client, channelName) {
    if (this.channels.has(channelName)) {
      const clients = this.channels.get(channelName);
      clients.delete(client);
      if (clients.size === 0) {
        this.channels.delete(channelName);
      }
    }
    if (this.clientSubscriptions.has(client)) {
      this.clientSubscriptions.get(client).delete(channelName);
    }
    console.log(`[WS] Client unsubscribed from channel: ${channelName}`);
  }

  /**
   * Broadcast a payload to all subscribers of a channel.
   */
  broadcast(channelName, type, payload) {
    if (!this.channels.has(channelName)) return;

    const message = JSON.stringify({
      type,
      channel: channelName,
      payload,
    });

    const clients = this.channels.get(channelName);
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  /**
   * Send a message to a single client.
   */
  sendToClient(client, channel, type, payload) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type,
        channel,
        payload,
      }));
    }
  }

  /**
   * Broadcast presence update to all connected clients.
   */
  broadcastPresence() {
    const presenceList = Array.from(this.onlineUsers.values()).map(p => ({
      ...p.user,
      status: 'online', // for frontend mapping compatibility
    }));

    const message = JSON.stringify({
      type: 'presence',
      channel: 'presence',
      payload: presenceList,
    });

    for (const client of this.clientUsers.keys()) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  }

  /**
   * Handle incoming message from client.
   */
  async handleMessage(client, data) {
    const user = this.clientUsers.get(client);
    if (!user) return;

    try {
      const parsed = JSON.parse(data);
      const { type, channel, payload } = parsed;

      console.log(`[WS] Received: ${type} on ${channel}`);

      if (type === 'subscribe') {
        // Enforce allowed_roles authorization for chat channels
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          const [channels] = await pool.query('SELECT allowed_roles FROM chat_channels WHERE slug = ? LIMIT 1', [channelSlug]);
          if (channels.length > 0) {
            const allowed = channels[0].allowed_roles;
            let allowedRoles = typeof allowed === 'string' ? JSON.parse(allowed) : allowed;
            if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
              console.log(`[WS] Subscription rejected: User ${user.name} (${user.role}) not allowed in ${channel}`);
              this.sendToClient(client, channel, 'subscription_error', { message: 'Not allowed to view this channel.' });
              return;
            }
          }
        }

        this.subscribe(client, channel);
        if (channel === 'presence') {
          const presenceList = Array.from(this.onlineUsers.values()).map(p => ({
            ...p.user,
            status: 'online',
          }));
          this.sendToClient(client, 'presence', 'presence', presenceList);
        }
        // If subscribing to chat, send success ack or do setup
        if (channel.startsWith('chat:')) {
          this.sendToClient(client, channel, 'subscribe_success', { channel });
        }
      } else if (type === 'unsubscribe') {
        this.unsubscribe(client, channel);
      } else if (type === 'message') {
        // Handle chat channel messages
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          await this.handleChatMessage(client, user, channelSlug, payload);
        }
      } else if (type === 'typing') {
        // Handle user typing state
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          await this.handleChatTyping(client, user, channelSlug, payload);
        }
      }
    } catch (err) {
      console.error('[WS] Error handling message:', err.message);
      this.sendToClient(client, 'error', 'error', { message: 'Invalid payload or server error.' });
    }
  }

  /**
   * Save and broadcast chat message.
   */
  async handleChatMessage(client, user, channelSlug, payload) {
    const { content } = payload;
    if (!content || !content.trim()) return;

    try {
      // 1. Get channel ID and write_roles from DB
      const [channels] = await pool.query('SELECT id, write_roles FROM chat_channels WHERE slug = ? LIMIT 1', [channelSlug]);
      if (channels.length === 0) {
        throw new Error(`Channel ${channelSlug} not found in database`);
      }
      const channelId = channels[0].id;
      const write = channels[0].write_roles;
      let writeRoles = typeof write === 'string' ? JSON.parse(write) : write;

      // Check write permissions
      if (writeRoles && Array.isArray(writeRoles) && !writeRoles.includes(user.role)) {
        console.log(`[WS] Message rejected: User ${user.name} (${user.role}) cannot write to ${channelSlug}`);
        this.sendToClient(client, `chat:${channelSlug}`, 'write_error', { message: 'You do not have permission to write in this channel.' });
        return;
      }

      // 2. Persist message to DB
      const [result] = await pool.query(
        'INSERT INTO chat_messages (channel_id, user_id, content, type, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [channelId, user.id, content, 'text']
      );

      // 3. Format message payload to send
      const formattedMsg = {
        id: result.insertId,
        channelId: channelSlug,
        author: user.name,
        authorAvatar: user.avatar,
        authorId: user.id,
        content: content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: false,
      };

      // 4. Broadcast message to the channel subscribers
      this.broadcast(`chat:${channelSlug}`, 'message', formattedMsg);
    } catch (err) {
      console.error('[WS] Error saving/broadcasting chat message:', err.message);
      this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'Failed to send message.' });
    }
  }

  /**
   * Broadcast typing status to other subscribers in the chat channel.
   */
  async handleChatTyping(client, user, channelSlug, payload) {
    const { isTyping } = payload;
    const channelName = `chat:${channelSlug}`;

    if (!this.channels.has(channelName)) return;

    try {
      const [channels] = await pool.query('SELECT write_roles FROM chat_channels WHERE slug = ? LIMIT 1', [channelSlug]);
      if (channels.length > 0) {
        const write = channels[0].write_roles;
        let writeRoles = typeof write === 'string' ? JSON.parse(write) : write;
        if (writeRoles && Array.isArray(writeRoles) && !writeRoles.includes(user.role)) {
          return; // Silently drop typing updates from unauthorized users
        }
      }
    } catch (err) {
      console.error('[WS] Error checking typing write_roles:', err.message);
      return;
    }

    const message = JSON.stringify({
      type: 'typing',
      channel: channelName,
      payload: {
        userId: user.id,
        firstName: user.first_name || user.name.split(' ')[0],
        name: user.name,
        avatar: user.avatar,
        isTyping: !!isTyping,
      },
    });

    const clients = this.channels.get(channelName);
    for (const otherClient of clients) {
      // Send to all subscribers EXCEPT the one who is typing
      if (otherClient !== client && otherClient.readyState === 1) {
        otherClient.send(message);
      }
    }
  }
}

module.exports = ChannelManager;
