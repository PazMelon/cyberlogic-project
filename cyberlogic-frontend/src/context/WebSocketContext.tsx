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
  myStatus: 'online' | 'away';
  unreadNotifCount: number;
  resetUnreadNotifCount: () => void;
  incrementUnreadNotifCount: () => void;
  updateMyStatus: (status: 'online' | 'away') => void;
  subscribe: (channel: string, callback: (payload: any, type: string) => void) => () => void;
  sendMessage: (type: string, channel: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [myStatus, setMyStatus] = useState<'online' | 'away'>(() => {
    return (localStorage.getItem('cl_user_status') as 'online' | 'away') || 'online';
  });

  // Fetch initial unread count
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/notifications/unread-count', { credentials: 'same-origin' })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not ok');
        })
        .then(data => {
          setUnreadNotifCount(data.count);
        })
        .catch(err => console.error('[WS Context] Failed to fetch unread count:', err));
    } else {
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated]);

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

  // Subscribe to notifications channel when connected
  useEffect(() => {
    if (status === 'connected') {
      const unsubscribeNotifications = wsClient.subscribe('notifications', (_, type: string) => {
        if (type === 'new_notification') {
          setUnreadNotifCount(prev => prev + 1);
        }
      });

      return () => {
        unsubscribeNotifications();
      };
    }
  }, [status]);

  // 4. Send current status when connected
  useEffect(() => {
    if (status === 'connected') {
      wsClient.send('status_update', 'presence', { status: myStatus });
    }
  }, [status, myStatus]);

  const updateMyStatus = useCallback((newStatus: 'online' | 'away') => {
    setMyStatus(newStatus);
    localStorage.setItem('cl_user_status', newStatus);
    if (status === 'connected') {
      wsClient.send('status_update', 'presence', { status: newStatus });
    }
  }, [status]);

  const resetUnreadNotifCount = useCallback(() => {
    setUnreadNotifCount(0);
  }, []);

  const incrementUnreadNotifCount = useCallback(() => {
    setUnreadNotifCount(prev => prev + 1);
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
        myStatus,
        unreadNotifCount,
        resetUnreadNotifCount,
        incrementUnreadNotifCount,
        updateMyStatus,
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
