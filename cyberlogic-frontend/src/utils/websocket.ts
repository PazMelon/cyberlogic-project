type SocketMessage = {
  type: string;
  channel: string;
  payload: any;
};

type MessageCallback = (payload: any, type: string) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private reconnectTimer: any = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private onStatusChangeCallbacks: Set<(status: 'connecting' | 'connected' | 'disconnected') => void> = new Set();
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private getTicketFn: (() => Promise<string | null>) | null = null;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Using relative WS URL to leverage Vite proxy in development & Nginx in production
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  /**
   * Register a callback to fetch authentication tickets.
   */
  public setTicketFetcher(fetcher: () => Promise<string | null>): void {
    this.getTicketFn = fetcher;
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus('connecting');

    let connectionUrl = this.url;
    if (this.getTicketFn) {
      try {
        const ticket = await this.getTicketFn();
        if (ticket) {
          connectionUrl = `${this.url}?ticket=${encodeURIComponent(ticket)}`;
        }
      } catch (err) {
        console.error('[WS] Failed to fetch connection ticket:', err);
      }
    }

    console.log(`[WS] Connecting to ${connectionUrl}...`);

    try {
      this.ws = new WebSocket(connectionUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected successfully.');
        this.updateStatus('connected');
        this.reconnectDelay = 1000; // Reset backoff

        // Resubscribe to existing channels if this is a reconnect
        for (const channel of this.listeners.keys()) {
          this.send('subscribe', channel, {});
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: SocketMessage = JSON.parse(event.data);
          this.triggerListeners(msg.channel, msg.payload, msg.type);
        } catch (err) {
          console.error('[WS] Error parsing incoming message:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WS] Connection closed (code: ${event.code}). Reconnecting...`);
        this.updateStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Socket error occurred:', error);
        this.ws?.close();
      };
    } catch (err) {
      console.error('[WS] Connection attempt failed:', err);
      this.updateStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      // Remove event listeners first to prevent auto-reconnect triggers on close
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
    console.log('[WS] Disconnected manually.');
  }

  public subscribe(channel: string, callback: MessageCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
      // Tell server we are subscribing to this channel
      if (this.isConnected()) {
        this.send('subscribe', channel, {});
      }
    }

    this.listeners.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelCallbacks = this.listeners.get(channel);
      if (channelCallbacks) {
        channelCallbacks.delete(callback);
        if (channelCallbacks.size === 0) {
          this.listeners.delete(channel);
          if (this.isConnected()) {
            this.send('unsubscribe', channel, {});
          }
        }
      }
    };
  }

  public send(type: string, channel: string, payload: any): void {
    if (!this.isConnected()) {
      console.warn(`[WS] Cannot send message: Connection not open. Queueing or ignoring.`, { type, channel });
      return;
    }

    const message: SocketMessage = { type, channel, payload };
    this.ws!.send(JSON.stringify(message));
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getStatus(): 'connecting' | 'connected' | 'disconnected' {
    return this.connectionStatus;
  }

  public onStatusChange(callback: (status: 'connecting' | 'connected' | 'disconnected') => void): () => void {
    this.onStatusChangeCallbacks.add(callback);
    callback(this.connectionStatus); // Initial callback
    return () => {
      this.onStatusChangeCallbacks.delete(callback);
    };
  }

  private updateStatus(status: 'connecting' | 'connected' | 'disconnected'): void {
    this.connectionStatus = status;
    this.onStatusChangeCallbacks.forEach((cb) => cb(status));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    console.log(`[WS] Scheduling reconnect in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  private triggerListeners(channel: string, payload: any, type: string): void {
    // 1. General channel listeners
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach((callback) => callback(payload, type));
    }

    // 2. Global listener for presence mapping
    if (channel === 'presence' || type === 'presence') {
      const globalPresenceListeners = this.listeners.get('presence');
      if (globalPresenceListeners) {
        globalPresenceListeners.forEach((callback) => callback(payload, type));
      }
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
