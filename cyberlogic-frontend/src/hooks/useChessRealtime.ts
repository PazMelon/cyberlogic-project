import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { type ChessGame } from '../utils/chessApi';

export interface ChessChatMessage {
  id?: number;
  sender: {
    id: number;
    name: string;
    avatar: string;
  };
  text: string;
  created_at: string;
}

export function useChessRealtime(gameId?: number) {
  const { subscribe, sendMessage, isConnected, updateMyStatus } = useWebSocket();

  const [lobbyMessages, setLobbyMessages] = useState<ChessChatMessage[]>([]);
  const [gameMessages, setGameMessages] = useState<ChessChatMessage[]>([]);
  const [latestGameUpdate, setLatestGameUpdate] = useState<ChessGame | null>(null);
  const [latestMove, setLatestMove] = useState<{
    fen: string;
    pgn?: string;
    move?: string;
    current_turn: 'white' | 'black';
    white_time_left_ms?: number;
    black_time_left_ms?: number;
    player_id: number;
  } | null>(null);
  const [gameOverEvent, setGameOverEvent] = useState<{
    game: ChessGame;
    winner_id: number | null;
    is_draw: boolean;
    win_reason: string;
    white_elo_change?: number;
    black_elo_change?: number;
  } | null>(null);
  const [drawOfferState, setDrawOfferState] = useState<{
    offeredBy: number;
    action: 'offer' | 'decline';
  } | null>(null);
  const [roomUsers, setRoomUsers] = useState<{ id: number; name: string; avatar: string; role?: string }[]>([]);

  // Subscribe to chess_lobby channel
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeLobby = subscribe('chess_lobby', (payload: any, type: string) => {
      if (type === 'chess_lobby_history' && Array.isArray(payload)) {
        setLobbyMessages(payload);
      } else if (type === 'chess_lobby_chat') {
        setLobbyMessages((prev) => {
          const exists = prev.some(
            (m) =>
              m.text === payload.text &&
              m.sender?.id === payload.sender?.id &&
              Math.abs(new Date(m.created_at || 0).getTime() - new Date(payload.created_at || 0).getTime()) < 2000
          );
          if (exists) return prev;
          return [...prev.slice(-100), payload];
        });
      } else if (type === 'chess_game_created' || type === 'chess_game_updated') {
        if (payload?.game) {
          setLatestGameUpdate(payload.game);
        }
      }
    });

    return () => {
      unsubscribeLobby();
    };
  }, [isConnected, subscribe]);

  // Subscribe to specific game room channel if gameId is provided
  useEffect(() => {
    if (!isConnected || !gameId) return;

    // Set presence status to playing
    updateMyStatus('online'); // Or trigger status_update with playing

    const channelName = `chess_game_${gameId}`;
    const unsubscribeGame = subscribe(channelName, (payload: any, type: string) => {
      if (type === 'chess_game_chat') {
        setGameMessages((prev) => [...prev.slice(-100), payload]);
      } else if (type === 'chess_move') {
        setLatestMove(payload);
      } else if (type === 'chess_game_started') {
        if (payload?.game) {
          setLatestGameUpdate(payload.game);
        }
      } else if (type === 'chess_game_over') {
        setGameOverEvent(payload);
        if (payload?.game) {
          setLatestGameUpdate(payload.game);
        }
      } else if (type === 'chess_draw_offer') {
        if (payload?.sender) {
          setDrawOfferState({ offeredBy: payload.sender.id, action: 'offer' });
        }
      } else if (type === 'chess_draw_response') {
        if (payload?.action === 'decline') {
          setDrawOfferState(null);
        }
      } else if (type === 'chess_room_presence') {
        if (Array.isArray(payload)) {
          setRoomUsers(payload);
        }
      }
    });

    return () => {
      unsubscribeGame();
    };
  }, [isConnected, gameId, subscribe, updateMyStatus]);

  const sendLobbyChat = useCallback((text: string) => {
    if (!text.trim()) return;
    sendMessage('chess_lobby_chat', 'chess_lobby', { text: text.trim() });
  }, [sendMessage]);

  const sendGameChat = useCallback((text: string) => {
    if (!gameId || !text.trim()) return;
    sendMessage('chess_game_chat', `chess_game_${gameId}`, { text: text.trim() });
  }, [gameId, sendMessage]);

  const sendDrawOffer = useCallback((action: 'offer' | 'accept' | 'decline') => {
    if (!gameId) return;
    sendMessage(action === 'offer' ? 'chess_draw_offer' : 'chess_draw_response', `chess_game_${gameId}`, { action });
  }, [gameId, sendMessage]);

  return {
    lobbyMessages,
    gameMessages,
    latestGameUpdate,
    latestMove,
    gameOverEvent,
    drawOfferState,
    roomUsers,
    sendLobbyChat,
    sendGameChat,
    sendDrawOffer,
  };
}
