import { apiRequest } from '../context/AuthContext';

export interface ChessUserSummary {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  avatar?: string;
  role?: string;
  name?: string;
}

export interface ChessPlayerStat {
  id: number;
  user_id: number;
  elo_rating: number;
  peak_elo: number;
  ranked_wins: number;
  ranked_losses: number;
  ranked_draws: number;
  casual_wins: number;
  casual_losses: number;
  casual_draws: number;
  chess_reputation_points: number;
  user?: ChessUserSummary;
}

export interface ChessGame {
  id: number;
  game_code: string;
  host_player_id: number;
  white_player_id: number | null;
  black_player_id: number | null;
  type: 'ranked' | 'casual';
  time_control: number | null;
  white_time_left_ms: number | null;
  black_time_left_ms: number | null;
  allow_spectators: boolean;
  status: 'waiting' | 'in_progress' | 'completed' | 'aborted' | 'draw_offered';
  fen: string;
  pgn: string | null;
  current_turn: 'white' | 'black';
  last_move_at: string | null;
  winner_id: number | null;
  win_reason: string | null;
  is_draw: boolean;
  white_elo_change: number | null;
  black_elo_change: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  host?: ChessUserSummary;
  white_player?: ChessUserSummary;
  black_player?: ChessUserSummary;
  winner?: ChessUserSummary;
}

export async function fetchChessGames(): Promise<ChessGame[]> {
  const res = await apiRequest('/api/chess/games');
  if (!res.ok) throw new Error('Failed to fetch games');
  const data = await res.json();
  return data.games;
}

export async function createChessGame(data: {
  type?: 'ranked' | 'casual';
  time_control?: number | null;
  allow_spectators?: boolean;
  color_preference?: 'white' | 'black' | 'random';
  invitee_id?: number | null;
}): Promise<ChessGame> {
  const res = await apiRequest('/api/chess/games', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create game');
  const result = await res.json();
  return result.game;
}

export async function fetchChessGame(code: string): Promise<{
  game: ChessGame;
  is_player: boolean;
  spectators_allowed: boolean;
}> {
  const res = await apiRequest(`/api/chess/games/${code}`);
  if (!res.ok) {
    if (res.status === 403) {
      const err = await res.json();
      throw new Error(err.error || 'Spectators are disabled');
    }
    throw new Error('Failed to fetch game details');
  }
  return res.json();
}

export async function joinChessGame(code: string): Promise<ChessGame> {
  const res = await apiRequest(`/api/chess/games/${code}/join`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to join game');
  const data = await res.json();
  return data.game;
}

export async function makeChessMove(
  code: string,
  payload: {
    fen: string;
    pgn?: string;
    move?: string;
    white_time_left_ms?: number;
    black_time_left_ms?: number;
    game_over_reason?: string;
    winner_id?: number;
    is_draw?: boolean;
  }
): Promise<ChessGame> {
  const res = await apiRequest(`/api/chess/games/${code}/move`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit move');
  const data = await res.json();
  return data.game;
}

export async function resignChessGame(code: string): Promise<ChessGame> {
  const res = await apiRequest(`/api/chess/games/${code}/resign`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to resign game');
  const data = await res.json();
  return data.game;
}

export async function offerChessDraw(code: string, action: 'offer' | 'accept' | 'decline'): Promise<any> {
  const res = await apiRequest(`/api/chess/games/${code}/offer-draw`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to handle draw offer');
  return res.json();
}

export async function deleteChessGame(gameCode: string): Promise<void> {
  const res = await apiRequest(`/api/chess/games/${gameCode}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete game room');
}

export async function fetchChessLeaderboard(sort: 'elo' | 'reputation' = 'elo'): Promise<ChessPlayerStat[]> {
  const res = await apiRequest(`/api/chess/leaderboard?sort=${sort}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const data = await res.json();
  return data.leaderboard;
}

export async function fetchUserChessStats(userId?: number): Promise<ChessPlayerStat> {
  const url = userId ? `/api/chess/user-stats/${userId}` : '/api/chess/user-stats';
  const res = await apiRequest(url);
  if (!res.ok) throw new Error('Failed to fetch user chess stats');
  const data = await res.json();
  return data.stat;
}

export interface ChessLobbyChatMessage {
  id: number;
  text: string;
  created_at: string;
  sender: ChessUserSummary;
}

export async function fetchLobbyMessages(beforeId?: number): Promise<{
  messages: ChessLobbyChatMessage[];
  has_more: boolean;
}> {
  const url = beforeId ? `/api/chess/lobby-messages?before_id=${beforeId}` : '/api/chess/lobby-messages';
  const res = await apiRequest(url);
  if (!res.ok) throw new Error('Failed to fetch lobby messages');
  return res.json();
}

export async function sendLobbyMessage(text: string): Promise<ChessLobbyChatMessage> {
  const res = await apiRequest('/api/chess/lobby-messages', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to send lobby message');
  const data = await res.json();
  return data.message;
}
