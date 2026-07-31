<?php

namespace App\Services;

use App\Models\ChessGame;
use App\Models\ChessLobbyMessage;
use App\Models\ChessPlayerStat;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChessService
{
    /**
     * Get or create player statistics for a given user.
     */
    public function getOrCreatePlayerStat(int $userId): ChessPlayerStat
    {
        return ChessPlayerStat::firstOrCreate(
            ['user_id' => $userId],
            [
                'elo_rating' => 1200,
                'peak_elo' => 1200,
                'ranked_wins' => 0,
                'ranked_losses' => 0,
                'ranked_draws' => 0,
                'casual_wins' => 0,
                'casual_losses' => 0,
                'casual_draws' => 0,
                'chess_reputation_points' => 0,
            ]
        );
    }

    /**
     * Create a new game room.
     */
    public function createGame(User $host, array $data): ChessGame
    {
        $code = Str::upper(Str::random(8));
        $color = $data['color_preference'] ?? 'random';
        if ($color === 'random') {
            $color = rand(0, 1) === 0 ? 'white' : 'black';
        }

        $timeControl = isset($data['time_control']) && is_numeric($data['time_control']) && $data['time_control'] > 0
            ? (int) $data['time_control']
            : null;

        $timeMs = $timeControl ? $timeControl * 60 * 1000 : null;

        $game = ChessGame::create([
            'game_code' => $code,
            'host_player_id' => $host->id,
            'white_player_id' => $color === 'white' ? $host->id : null,
            'black_player_id' => $color === 'black' ? $host->id : null,
            'type' => $data['type'] ?? 'ranked',
            'time_control' => $timeControl,
            'white_time_left_ms' => $timeMs,
            'black_time_left_ms' => $timeMs,
            'allow_spectators' => filter_var($data['allow_spectators'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'status' => 'waiting',
            'fen' => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'pgn' => '',
            'current_turn' => 'white',
        ]);

        $game->load(['host', 'whitePlayer', 'blackPlayer']);

        // Broadcast new game created to lobby
        $this->broadcastToRealtime('chess_lobby', 'chess_game_created', [
            'game' => $game,
        ]);

        // If specific target user was invited, send direct notification broadcast
        if (!empty($data['invitee_id'])) {
            $inviteeId = (int) $data['invitee_id'];
            $this->broadcastToRealtime('notifications', 'new_notification', [
                'type' => 'chess_invite',
                'title' => 'Chess Challenge!',
                'message' => "{$host->name} challenged you to a {$game->type} chess match!",
                'game_code' => $game->game_code,
                'sender' => [
                    'id' => $host->id,
                    'name' => $host->name,
                    'avatar' => $host->avatar,
                ],
            ], $inviteeId);
        }

        return $game;
    }

    /**
     * Join an existing waiting game.
     */
    public function joinGame(ChessGame $game, User $user): ChessGame
    {
        if ($game->status !== 'waiting') {
            return $game;
        }

        // Check if already in game
        if ($game->white_player_id === $user->id || $game->black_player_id === $user->id) {
            return $game;
        }

        if (!$game->white_player_id) {
            $game->white_player_id = $user->id;
        } else if (!$game->black_player_id) {
            $game->black_player_id = $user->id;
        } else {
            return $game; // Room full
        }

        $game->status = 'in_progress';
        $game->started_at = \Illuminate\Support\Carbon::now();
        $game->last_move_at = \Illuminate\Support\Carbon::now();
        $game->save();

        $game->load(['host', 'whitePlayer', 'blackPlayer']);

        // Broadcast game starting
        $this->broadcastToRealtime("chess_game_{$game->id}", 'chess_game_started', [
            'game' => $game,
        ]);

        $this->broadcastToRealtime('chess_lobby', 'chess_game_updated', [
            'game' => $game,
        ]);

        return $game;
    }

    /**
     * Execute a move in the game.
     */
    public function makeMove(
        ChessGame $game,
        User $user,
        string $fen,
        ?string $pgn,
        ?string $moveNotation,
        ?int $whiteTimeLeftMs,
        ?int $blackTimeLeftMs,
        ?string $gameOverReason,
        ?int $winnerId,
        bool $isDraw
    ): ChessGame {
        if ($game->status !== 'in_progress') {
            return $game;
        }

        // Determine if user is allowed to make this move
        $isWhite = $game->white_player_id === $user->id;
        $isBlack = $game->black_player_id === $user->id;

        if (($game->current_turn === 'white' && !$isWhite) || ($game->current_turn === 'black' && !$isBlack)) {
            return $game;
        }

        $game->fen = $fen;
        if ($pgn !== null) {
            $game->pgn = $pgn;
        }

        if ($whiteTimeLeftMs !== null) {
            $game->white_time_left_ms = $whiteTimeLeftMs;
        }
        if ($blackTimeLeftMs !== null) {
            $game->black_time_left_ms = $blackTimeLeftMs;
        }

        $game->last_move_at = \Illuminate\Support\Carbon::now();
        $game->current_turn = $game->current_turn === 'white' ? 'black' : 'white';

        if ($gameOverReason || $winnerId || $isDraw) {
            return $this->finishGame($game, $winnerId, $isDraw, $gameOverReason ?? ($isDraw ? 'draw' : 'checkmate'));
        }

        $game->save();

        // Broadcast move update
        $this->broadcastToRealtime("chess_game_{$game->id}", 'chess_move', [
            'game_id' => $game->id,
            'fen' => $game->fen,
            'pgn' => $game->pgn,
            'move' => $moveNotation,
            'current_turn' => $game->current_turn,
            'white_time_left_ms' => $game->white_time_left_ms,
            'black_time_left_ms' => $game->black_time_left_ms,
            'player_id' => $user->id,
        ]);

        return $game;
    }

    /**
     * Resign active match.
     */
    public function resignGame(ChessGame $game, User $user): ChessGame
    {
        if ($game->status !== 'in_progress') {
            return $game;
        }

        $winnerId = null;
        if ($game->white_player_id === $user->id) {
            $winnerId = $game->black_player_id;
        } else if ($game->black_player_id === $user->id) {
            $winnerId = $game->white_player_id;
        } else {
            return $game;
        }

        return $this->finishGame($game, $winnerId, false, 'resignation');
    }

    /**
     * Finish a game and distribute ELO and Reputation Points.
     */
    public function finishGame(ChessGame $game, ?int $winnerId, bool $isDraw, string $winReason): ChessGame
    {
        $game->status = 'completed';
        $game->ended_at = \Illuminate\Support\Carbon::now();
        $game->winner_id = $winnerId;
        $game->is_draw = $isDraw;
        $game->win_reason = $winReason;

        $whiteStat = $game->white_player_id ? $this->getOrCreatePlayerStat($game->white_player_id) : null;
        $blackStat = $game->black_player_id ? $this->getOrCreatePlayerStat($game->black_player_id) : null;

        // 1. ELO Rating Calculation for Ranked Matches
        if ($game->type === 'ranked' && $whiteStat && $blackStat) {
            $rA = $whiteStat->elo_rating;
            $rB = $blackStat->elo_rating;

            $eA = 1.0 / (1.0 + pow(10, ($rB - $rA) / 400.0));
            $eB = 1.0 / (1.0 + pow(10, ($rA - $rB) / 400.0));

            $k = 32;

            if ($isDraw) {
                $sA = 0.5;
                $sB = 0.5;
                $whiteStat->ranked_draws++;
                $blackStat->ranked_draws++;
            } else if ($winnerId === $game->white_player_id) {
                $sA = 1.0;
                $sB = 0.0;
                $whiteStat->ranked_wins++;
                $blackStat->ranked_losses++;
            } else {
                $sA = 0.0;
                $sB = 1.0;
                $whiteStat->ranked_losses++;
                $blackStat->ranked_wins++;
            }

            $deltaA = (int) round($k * ($sA - $eA));
            $deltaB = (int) round($k * ($sB - $eB));

            $whiteStat->elo_rating = max(100, $whiteStat->elo_rating + $deltaA);
            $blackStat->elo_rating = max(100, $blackStat->elo_rating + $deltaB);

            $whiteStat->peak_elo = max($whiteStat->peak_elo, $whiteStat->elo_rating);
            $blackStat->peak_elo = max($blackStat->peak_elo, $blackStat->elo_rating);

            $game->white_elo_change = $deltaA;
            $game->black_elo_change = $deltaB;
        } else if ($game->type === 'casual' && $whiteStat && $blackStat) {
            if ($isDraw) {
                $whiteStat->casual_draws++;
                $blackStat->casual_draws++;
            } else if ($winnerId === $game->white_player_id) {
                $whiteStat->casual_wins++;
                $blackStat->casual_losses++;
            } else {
                $whiteStat->casual_losses++;
                $blackStat->casual_wins++;
            }
        }

        // 2. Game Participation Reputation Points (+2 Winner, +1 Loser, +1 Draw)
        if ($whiteStat && $blackStat) {
            if ($isDraw) {
                $whiteStat->chess_reputation_points += 1;
                $blackStat->chess_reputation_points += 1;
            } else if ($winnerId === $game->white_player_id) {
                $whiteStat->chess_reputation_points += 2;
                $blackStat->chess_reputation_points += 1;
            } else {
                $whiteStat->chess_reputation_points += 1;
                $blackStat->chess_reputation_points += 2;
            }

            $whiteStat->save();
            $blackStat->save();

            // Clear user reputation cache so member leaderboard on dashboard reflects chess match points
            if ($game->white_player_id) {
                \Illuminate\Support\Facades\Cache::forget("user_reputation_{$game->white_player_id}");
            }
            if ($game->black_player_id) {
                \Illuminate\Support\Facades\Cache::forget("user_reputation_{$game->black_player_id}");
            }
        }

        $game->save();
        $game->load(['host', 'whitePlayer', 'blackPlayer', 'winner']);

        // Broadcast game over event
        $this->broadcastToRealtime("chess_game_{$game->id}", 'chess_game_over', [
            'game' => $game,
            'winner_id' => $winnerId,
            'is_draw' => $isDraw,
            'win_reason' => $winReason,
            'white_elo_change' => $game->white_elo_change,
            'black_elo_change' => $game->black_elo_change,
        ]);

        $this->broadcastToRealtime('chess_lobby', 'chess_game_updated', [
            'game' => $game,
        ]);

        return $game;
    }

    /**
     * Send HTTP post request to internal Node.js WebSocket broadcast API.
     */
    protected function broadcastToRealtime(string $channel, string $type, array $payload, ?int $userId = null): void
    {
        try {
            $realtimeUrl = env('REALTIME_SERVICE_URL', 'http://127.0.0.1:3001') . '/internal/broadcast';
            $secret = env('REALTIME_WS_SECRET', 'cyberlogic_secret_token_123');

            $body = [
                'channel' => $channel,
                'type' => $type,
                'payload' => $payload,
            ];
            if ($userId) {
                $body['user_id'] = $userId;
            }

            Http::withHeaders([
                'X-Realtime-Secret' => $secret,
                'Content-Type' => 'application/json',
            ])->timeout(2)->post($realtimeUrl, $body);
        } catch (\Throwable $e) {
            Log::warning("[ChessService] Broadcast failed: {$e->getMessage()}");
        }
    }

    /**
     * Get paginated lobby chat messages (7-day retention window).
     */
    public function getLobbyMessages(?int $beforeId = null, int $limit = 25): array
    {
        $query = ChessLobbyMessage::with('user')
            ->where('created_at', '>=', now()->subDays(7));

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $items = $query->orderBy('id', 'desc')
            ->limit($limit + 1)
            ->get();

        $hasMore = $items->count() > $limit;
        if ($hasMore) {
            $items = $items->slice(0, $limit);
        }

        // Format and reverse so oldest is first in returned array
        $messages = $items->reverse()->values()->map(function ($msg) {
            return [
                'id' => $msg->id,
                'text' => $msg->text,
                'created_at' => $msg->created_at->toISOString(),
                'sender' => [
                    'id' => $msg->user->id,
                    'name' => $msg->user->username ?? "{$msg->user->first_name} {$msg->user->last_name}",
                    'avatar' => $msg->user->avatar_path ? "/storage/{$msg->user->avatar_path}" : "https://api.dicebear.com/9.x/avataaars/svg?seed=" . urlencode($msg->user->first_name),
                ],
            ];
        });

        return [
            'messages' => $messages,
            'has_more' => $hasMore,
        ];
    }

    /**
     * Post a new lobby message, prune >7 day records, and broadcast live.
     */
    public function postLobbyMessage(User $user, string $text): array
    {
        // 1. Create message
        $msg = ChessLobbyMessage::create([
            'user_id' => $user->id,
            'text' => $text,
        ]);
        $msg->load('user');

        // 2. Prune messages older than 7 days
        ChessLobbyMessage::where('created_at', '<', now()->subDays(7))->delete();

        // 3. Format message payload
        $payload = [
            'id' => $msg->id,
            'text' => $msg->text,
            'created_at' => $msg->created_at->toISOString(),
            'sender' => [
                'id' => $user->id,
                'name' => $user->username ?? "{$user->first_name} {$user->last_name}",
                'avatar' => $user->avatar_path ? "/storage/{$user->avatar_path}" : "https://api.dicebear.com/9.x/avataaars/svg?seed=" . urlencode($user->first_name),
            ],
        ];

        // 4. Broadcast live WebSocket event to chess_lobby channel
        $this->broadcastToRealtime('chess_lobby', 'chess_lobby_chat', $payload);

        return $payload;
    }
}
