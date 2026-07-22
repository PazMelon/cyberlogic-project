import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { CyberboardCard } from "../utils/api";
import type { RemoteCursor, RemoteDraggingCard } from "../components/cyberboard/LiveCursorsOverlay";

export interface BoardPresenceUser {
  id: number;
  name: string;
  avatar?: string | null;
  status: string;
  lastSeen: number;
}

interface UseCyberboardRealtimeOptions {
  numericBoardId: number | null;
  userId?: number;
  onWsBoardEvent?: (payload: any, type: string) => void;
}

export function useCyberboardRealtime({
  numericBoardId,
  userId,
  onWsBoardEvent,
}: UseCyberboardRealtimeOptions) {
  const { subscribe, isConnected, sendMessage } = useWebSocket();

  const [remoteCursors, setRemoteCursors] = useState<Record<number, RemoteCursor>>({});
  const [remoteDraggingCards, setRemoteDraggingCards] = useState<Record<number, RemoteDraggingCard>>({});
  const [boardPresenceUsers, setBoardPresenceUsers] = useState<Record<number, BoardPresenceUser>>({});

  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMoveSentRef = useRef<number>(0);
  const lastSentPosRef = useRef<{ x: number; y: number } | null>(null);
  const activeDragCardRef = useRef<CyberboardCard | null>(null);

  // WebSocket message dispatcher
  const handleWsEvent = useCallback(
    (payload: any, type: string) => {
      if (!payload) return;

      if (type === "board_presence" || type === "cursor_move" || type === "card_drag") {
        const { user_id, user_name, user_avatar, status } = payload;
        if (user_id && user_id !== userId) {
          setBoardPresenceUsers((prev) => ({
            ...prev,
            [user_id]: {
              id: user_id,
              name: user_name,
              avatar: user_avatar,
              status: type === "card_drag" ? `Dragging "${payload.title}"` : status || "Viewing board",
              lastSeen: Date.now(),
            },
          }));
        }
      }

      if (type === "cursor_move") {
        const { user_id, user_name, user_avatar, x, y } = payload;
        if (user_id !== userId) {
          setRemoteCursors((prev) => ({
            ...prev,
            [user_id]: { x, y, name: user_name, avatar: user_avatar, updatedAt: Date.now() },
          }));
        }
      } else if (type === "card_drag") {
        const { user_id, user_name, user_avatar, cardId, title, x, y } = payload;
        if (user_id !== userId) {
          setRemoteDraggingCards((prev) => ({
            ...prev,
            [user_id]: { cardId, title, x, y, name: user_name, avatar: user_avatar },
          }));
        }
      } else if (type === "card_drag_end") {
        const { user_id } = payload;
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
      } else if (type === "cursor_leave") {
        const { user_id } = payload;
        setRemoteCursors((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
      } else if (type === "page_leave") {
        const { user_id } = payload;
        setRemoteCursors((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
        setBoardPresenceUsers((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
      } else if (type === "card:moved") {
        const card_id = payload.card_id;
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((uidStr) => {
            const uid = Number(uidStr);
            if (next[uid]?.cardId === card_id) {
              delete next[uid];
            }
          });
          return next;
        });
        if (onWsBoardEvent) onWsBoardEvent(payload, type);
      } else {
        if (onWsBoardEvent) onWsBoardEvent(payload, type);
      }
    },
    [userId, onWsBoardEvent]
  );

  // Subscribe to WebSocket board channel
  useEffect(() => {
    if (!numericBoardId) return;
    const unsubscribe = subscribe(`cyberboard:${numericBoardId}`, handleWsEvent);
    return () => {
      unsubscribe();
    };
  }, [numericBoardId, subscribe, handleWsEvent]);

  // Periodic heartbeat ping to announce board presence
  useEffect(() => {
    if (!numericBoardId) return;

    // Initial presence announce
    sendMessage("board_presence", `cyberboard:${numericBoardId}`, { status: "Viewing board" });

    const pingInterval = setInterval(() => {
      sendMessage("board_presence", `cyberboard:${numericBoardId}`, { status: "Viewing board" });
    }, 10000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [numericBoardId, sendMessage]);

  // Pointer move handler with deadzone radius & throttle
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!numericBoardId || !boardContainerRef.current) return;
    const now = Date.now();
    if (now - lastMoveSentRef.current < 40) return;

    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Deadzone distance threshold check
    if (lastSentPosRef.current) {
      const dx = x - lastSentPosRef.current.x;
      const dy = y - lastSentPosRef.current.y;
      if (dx * dx + dy * dy < 2000) return;
    }

    lastMoveSentRef.current = now;
    lastSentPosRef.current = { x, y };

    if (activeDragCardRef.current) {
      sendMessage("card_drag", `cyberboard:${numericBoardId}`, {
        cardId: activeDragCardRef.current.id,
        title: activeDragCardRef.current.title,
        x,
        y,
      });
    } else {
      sendMessage("cursor_move", `cyberboard:${numericBoardId}`, { x, y });
    }
  };

  const handlePointerLeave = () => {
    lastSentPosRef.current = null;
    if (numericBoardId) {
      sendMessage("cursor_leave", `cyberboard:${numericBoardId}`, {});
    }
  };

  const handleBoardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!numericBoardId || !boardContainerRef.current) return;
    const now = Date.now();
    if (now - lastMoveSentRef.current < 40) return;

    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (lastSentPosRef.current) {
      const dx = x - lastSentPosRef.current.x;
      const dy = y - lastSentPosRef.current.y;
      if (dx * dx + dy * dy < 2000) return;
    }

    lastMoveSentRef.current = now;
    lastSentPosRef.current = { x, y };

    if (activeDragCardRef.current) {
      sendMessage("card_drag", `cyberboard:${numericBoardId}`, {
        cardId: activeDragCardRef.current.id,
        title: activeDragCardRef.current.title,
        x,
        y,
      });
    }
  };

  const handleCardDragStart = (_e: React.DragEvent, card: CyberboardCard) => {
    activeDragCardRef.current = card;
  };

  const handleCardDragEnd = (_e: React.DragEvent, card: CyberboardCard) => {
    activeDragCardRef.current = null;
    if (numericBoardId) {
      sendMessage("card_drag_end", `cyberboard:${numericBoardId}`, { cardId: card.id });
    }
  };

  const clearLocalDragState = (cardId: number) => {
    activeDragCardRef.current = null;
    if (numericBoardId) {
      sendMessage("card_drag_end", `cyberboard:${numericBoardId}`, { cardId });
    }
  };

  // Tab blur and window visibility listener
  useEffect(() => {
    if (!numericBoardId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendMessage("page_leave", `cyberboard:${numericBoardId}`, {});
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleVisibilityChange);
      sendMessage("page_leave", `cyberboard:${numericBoardId}`, {});
    };
  }, [numericBoardId, sendMessage]);

  // Interval cleanup for stale cursors and inactive presence
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Prune canvas SVG cursor arrow if mouse still for > 3s
      setRemoteCursors((prev) => {
        let changed = false;
        const next: typeof prev = {};
        Object.entries(prev).forEach(([uidStr, cursor]) => {
          if (now - cursor.updatedAt < 3000) {
            next[Number(uidStr)] = cursor;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      // Prune board presence users ONLY if no ping or activity for > 30s
      setBoardPresenceUsers((prev) => {
        let changed = false;
        const next: typeof prev = {};
        Object.entries(prev).forEach(([uidStr, presenceUser]) => {
          if (now - presenceUser.lastSeen < 30000) {
            next[Number(uidStr)] = presenceUser;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    boardContainerRef,
    isConnected,
    remoteCursors,
    remoteDraggingCards,
    boardPresenceUsers,
    activeDragCard: activeDragCardRef.current,
    handlePointerMove,
    handlePointerLeave,
    handleBoardDragOver,
    handleCardDragStart,
    handleCardDragEnd,
    clearLocalDragState,
  };
}
