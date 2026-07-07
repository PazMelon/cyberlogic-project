import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth, apiRequest } from './AuthContext';
import { wsClient } from '../utils/websocket';

interface OnlineUser {
  id: number;
  name: string;
  avatar: string;
  role: string;
  status: 'online' | 'away' | 'offline';
}

interface WebSocketContextType {
  status: 'connecting' | 'connected' | 'disconnected';
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  subscribe: (channel: string, callback: (payload: any, type: string) => void) => () => void;
  sendMessage: (type: string, channel: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // 1. Setup Ticket Fetcher on mount AND manage connection lifecycle based on auth state
  useEffect(() => {
    // Register the ticket fetcher BEFORE connecting
    wsClient.setTicketFetcher(async () => {
      try {
        const res = await apiRequest('/api/chat/ticket', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          return data.ticket;
        }
        console.warn('[WebSocketContext] Ticket request failed:', res.status);
      } catch (err) {
        console.error('[WebSocketContext] Failed to fetch auth ticket:', err);
      }
      return null;
    });

    if (isAuthenticated) {
      wsClient.connect();
    } else {
      wsClient.disconnect();
    }

    return () => {
      wsClient.disconnect();
    };
  }, [isAuthenticated]);

  // 2. Track connection status
  useEffect(() => {
    const unsubscribeStatus = wsClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus !== 'connected') {
        setOnlineUsers([]);
      }
    });

    return () => {
      unsubscribeStatus();
    };
  }, []);

  // 3. Listen to global presence channel for online users list on mount
  useEffect(() => {
    const unsubscribePresence = wsClient.subscribe('presence', (presenceList: any) => {
      if (Array.isArray(presenceList)) {
        setOnlineUsers(presenceList);
      }
    });

    return () => {
      unsubscribePresence();
    };
  }, []);

  // Stable function references to prevent unnecessary re-renders
  const subscribe = useCallback((channel: string, callback: (payload: any, type: string) => void) => {
    return wsClient.subscribe(channel, callback);
  }, []);

  const sendMessage = useCallback((type: string, channel: string, payload: any) => {
    wsClient.send(type, channel, payload);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        status,
        isConnected: status === 'connected',
        onlineUsers,
        subscribe,
        sendMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
