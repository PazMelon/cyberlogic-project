<?php

namespace App\Http\Controllers;

use App\Models\ChessGame;
use App\Models\ChessPlayerStat;
use App\Models\User;
use App\Services\ChessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChessController extends Controller
{
    protected ChessService $chessService;

    public function __construct(ChessService $chessService)
    {
        $this->chessService = $chessService;
    }

    /**
     * Get active/waiting games for lobby.
     * Auto-expires unstarted 'waiting' matches created over 5 minutes ago.
     */
    public function index(): JsonResponse
    {
        // Auto-cancel waiting rooms older than 5 minutes
        ChessGame::where('status', 'waiting')
            ->where('created_at', '<=', \Illuminate\Support\Carbon::now()->subMinutes(5))
            ->update([
                'status' => 'aborted',
                'win_reason' => 'expired_unstarted',
            ]);

        $games = ChessGame::with(['host', 'whitePlayer', 'blackPlayer'])
            ->whereIn('status', ['waiting', 'in_progress'])
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'games' => $games,
        ]);
    }

    /**
     * Delete/cancel a waiting game room (host maker only).
     */
    public function destroy(string $code): JsonResponse
    {
        $game = ChessGame::where('game_code', $code)->firstOrFail();
        $user = Auth::user();

        if ($game->host_player_id !== $user->id) {
            return response()->json(['error' => 'Only the room creator can delete this match.'], 403);
        }

        if ($game->status !== 'waiting') {
            return response()->json(['error' => 'Only unstarted waiting matches can be deleted.'], 400);
        }

        $game->status = 'aborted';
        $game->win_reason = 'cancelled_by_host';
        $game->save();

        return response()->json(['message' => 'Game room deleted successfully.']);
    }

    /**
     * Create a new game room.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|in:ranked,casual',
            'time_control' => 'nullable|integer|min:1|max:60',
            'allow_spectators' => 'nullable|boolean',
            'color_preference' => 'nullable|in:white,black,random',
            'invitee_id' => 'nullable|exists:users,id',
        ]);

        /** @var User $user */
        $user = Auth::user();

        $game = $this->chessService->createGame($user, $validated);

        return response()->json([
            'message' => 'Game created successfully',
            'game' => $game,
        ], 201);
    }

    /**
     * Get single game by code, enforcing spectator permissions.
     */
    public function show(string $code): JsonResponse
    {
        $game = ChessGame::with(['host', 'whitePlayer', 'blackPlayer', 'winner'])
            ->where('game_code', $code)
            ->firstOrFail();

        /** @var User|null $user */
        $user = Auth::user();
        $userId = $user ? $user->id : null;

        $isPlayer = $userId && ($game->white_player_id === $userId || $game->black_player_id === $userId || $game->host_player_id === $userId);

        if (!$game->allow_spectators && !$isPlayer && $game->status !== 'waiting') {
            return response()->json([
                'error' => 'Spectators are disabled for this match',
                'spectators_allowed' => false,
            ], 403);
        }

        return response()->json([
            'game' => $game,
            'is_player' => $isPlayer,
            'spectators_allowed' => $game->allow_spectators,
        ]);
    }

    /**
     * Join game as 2nd player.
     */
    public function join(string $code): JsonResponse
    {
        $game = ChessGame::where('game_code', $code)->firstOrFail();

        /** @var User $user */
        $user = Auth::user();

        $updatedGame = $this->chessService->joinGame($game, $user);

        return response()->json([
            'game' => $updatedGame,
        ]);
    }

    /**
     * Submit a move in the game.
     */
    public function move(string $code, Request $request): JsonResponse
    {
        $game = ChessGame::where('game_code', $code)->firstOrFail();

        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'fen' => 'required|string',
            'pgn' => 'nullable|string',
            'move' => 'nullable|string',
            'white_time_left_ms' => 'nullable|integer',
            'black_time_left_ms' => 'nullable|integer',
            'game_over_reason' => 'nullable|string',
            'winner_id' => 'nullable|integer',
            'is_draw' => 'nullable|boolean',
        ]);

        $updatedGame = $this->chessService->makeMove(
            $game,
            $user,
            $validated['fen'],
            $validated['pgn'] ?? null,
            $validated['move'] ?? null,
            $validated['white_time_left_ms'] ?? null,
            $validated['black_time_left_ms'] ?? null,
            $validated['game_over_reason'] ?? null,
            $validated['winner_id'] ?? null,
            filter_var($validated['is_draw'] ?? false, FILTER_VALIDATE_BOOLEAN)
        );

        return response()->json([
            'game' => $updatedGame,
        ]);
    }

    /**
     * Resign from an active match.
     */
    public function resign(string $code): JsonResponse
    {
        $game = ChessGame::where('game_code', $code)->firstOrFail();

        /** @var User $user */
        $user = Auth::user();

        $updatedGame = $this->chessService->resignGame($game, $user);

        return response()->json([
            'game' => $updatedGame,
        ]);
    }

    /**
     * Offer or accept draw.
     */
    public function offerDraw(string $code, Request $request): JsonResponse
    {
        $game = ChessGame::where('game_code', $code)->firstOrFail();

        /** @var User $user */
        $user = Auth::user();

        $action = $request->input('action', 'offer'); // 'offer', 'accept', 'decline'

        if ($action === 'accept') {
            $updatedGame = $this->chessService->finishGame($game, null, true, 'draw_agreement');
            return response()->json(['game' => $updatedGame]);
        }

        return response()->json(['message' => 'Draw action sent']);
    }

    /**
     * Get chess leaderboard (Ranked ELO & Reputation).
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $sortBy = $request->input('sort', 'elo'); // 'elo' or 'reputation'

        // Ensure all registered users have a chess player stat entry automatically
        $existingUserIds = ChessPlayerStat::pluck('user_id')->toArray();
        $missingUserIds = User::whereNotIn('id', $existingUserIds)->pluck('id');
        foreach ($missingUserIds as $uId) {
            ChessPlayerStat::firstOrCreate(['user_id' => $uId]);
        }

        $query = ChessPlayerStat::with(['user:id,first_name,last_name,middle_name,avatar_path,username,role']);

        if ($sortBy === 'reputation') {
            $query->orderBy('chess_reputation_points', 'desc')->orderBy('ranked_wins', 'desc');
        } else {
            $query->orderBy('elo_rating', 'desc')->orderBy('ranked_wins', 'desc');
        }

        $stats = $query->limit(50)->get();

        return response()->json([
            'leaderboard' => $stats,
        ]);
    }

    /**
     * Get user chess stats.
     */
    public function userStats(?int $userId = null): JsonResponse
    {
        $targetUserId = $userId ?: Auth::id();

        if (!$targetUserId) {
            return response()->json(['error' => 'User ID required'], 400);
        }

        $stat = $this->chessService->getOrCreatePlayerStat($targetUserId);
        $stat->load(['user:id,first_name,last_name,middle_name,avatar_path,username,role']);

        return response()->json([
            'stat' => $stat,
        ]);
    }

    /**
     * Get paginated lobby messages (7 days retention, backreading supported).
     */
    public function lobbyMessages(Request $request): JsonResponse
    {
        $beforeId = $request->query('before_id') ? (int) $request->query('before_id') : null;
        $data = $this->chessService->getLobbyMessages($beforeId, 25);

        return response()->json($data);
    }

    /**
     * Send a message in the chess lobby.
     */
    public function postLobbyMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:1000',
        ]);

        $message = $this->chessService->postLobbyMessage(Auth::user(), $validated['text']);

        return response()->json([
            'message' => $message,
        ]);
    }
}
