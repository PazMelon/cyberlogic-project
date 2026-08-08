<?php

namespace App\Http\Controllers;

use App\Models\ChessGame;
use App\Models\ChessTournament;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ChessTournamentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChessTournamentController extends Controller
{
    protected ChessTournamentService $tournamentService;

    public function __construct(ChessTournamentService $tournamentService)
    {
        $this->tournamentService = $tournamentService;
    }

    /**
     * Get list of tournaments.
     */
    public function index(): JsonResponse
    {
        $tournaments = ChessTournament::with([
            'creator',
            'winner',
            'participants.user',
            'matches.whiteUser',
            'matches.blackUser',
            'matches.winnerUser',
            'matches.chessGame',
        ])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'tournaments' => $tournaments,
        ]);
    }

    /**
     * Create a new tournament.
     * Admins can create Ranked tournaments; members can create Casual tournaments.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'max_players' => 'required|integer|min:2|max:32',
            'time_control' => 'required|integer|min:1|max:60',
            'type' => 'nullable|in:ranked,casual',
            'enable_third_place_match' => 'nullable|boolean',
            'elimination_mode' => 'nullable|in:single,double',
            'start_time' => 'nullable|date',
        ]);

        // Enforce Ranked mode restriction: Admins only can create Ranked tournaments
        $requestedType = $validated['type'] ?? 'casual';
        if ($requestedType === 'ranked' && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only administrators can create Ranked tournaments. Members can create Casual tournaments.'], 403);
        }

        $validated['type'] = ($user->isAdmin() || $user->isSuperAdmin()) ? $requestedType : 'casual';

        $tournament = $this->tournamentService->createTournament($user, $validated);

        AuditLogger::log('created', 'ChessTournament', $tournament->id, $tournament->title, [
            'max_players' => $tournament->max_players,
            'elimination_mode' => $tournament->elimination_mode,
            'type' => $tournament->type,
        ], $request);

        return response()->json([
            'message' => 'Tournament created successfully',
            'tournament' => $tournament,
        ], 201);
    }

    /**
     * Show single tournament details with full bracket structure.
     */
    public function show(int $id): JsonResponse
    {
        $tournament = ChessTournament::with([
            'creator',
            'winner',
            'participants.user',
            'matches.whiteUser',
            'matches.blackUser',
            'matches.winnerUser',
            'matches.chessGame',
        ])->findOrFail($id);

        if ($tournament->status === 'in_progress') {
            if ($tournament->matches->isEmpty() && $tournament->participants->count() >= 2) {
                /** @var User $user */
                $user = Auth::user();
                $tournament = $this->tournamentService->startTournament($tournament, $user ?: $tournament->creator);
            } else {
                $this->tournamentService->checkAndAdvanceRound($tournament);
            }
        }

        // Auto-fix any active 2-player match missing a game record
        foreach ($tournament->matches as $match) {
            if ($match->status === 'in_progress' && $match->white_user_id && $match->black_user_id && (!$match->chess_game_id || !$match->chessGame)) {
                $whiteUser = User::find($match->white_user_id);
                if ($whiteUser) {
                    $game = ChessGame::create([
                        'game_code' => \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                        'host_player_id' => $whiteUser->id,
                        'white_player_id' => $match->white_user_id,
                        'black_player_id' => $match->black_user_id,
                        'type' => $tournament->type,
                        'time_control' => $tournament->time_control,
                        'allow_spectators' => true,
                        'status' => 'in_progress',
                        'started_at' => now(),
                    ]);
                    $match->chess_game_id = $game->id;
                    $match->save();
                }
            }
        }

        // Reload fresh matches
        $tournament->load(['matches.whiteUser', 'matches.blackUser', 'matches.winnerUser', 'matches.chessGame']);

        return response()->json([
            'tournament' => $tournament,
        ]);
    }

    /**
     * Delete/Cancel a tournament (Tournament Creator or Admin + Audit Log).
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $tournament = ChessTournament::findOrFail($id);

        if ($tournament->creator_id !== $user->id && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only the tournament creator or administrators can delete this tournament.'], 403);
        }

        $title = $tournament->title;
        $this->tournamentService->cancelTournament($tournament);

        AuditLogger::log('deleted', 'ChessTournament', $id, $title, null, $request);

        return response()->json([
            'message' => 'Tournament deleted successfully',
        ]);
    }

    /**
     * Update an existing tournament (Tournament Creator or Admin).
     */
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $tournament = ChessTournament::findOrFail($id);

        if ($tournament->creator_id !== $user->id && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only the tournament creator or administrators can edit this tournament.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'max_players' => 'nullable|integer|min:2|max:32',
            'time_control' => 'nullable|integer|min:1|max:60',
            'type' => 'nullable|in:ranked,casual',
            'enable_third_place_match' => 'nullable|boolean',
            'elimination_mode' => 'nullable|in:single,double',
            'start_time' => 'nullable|date',
            'scheduled_at' => 'nullable|date',
        ]);

        // Validate type restriction: Only admins can set Ranked mode
        if (isset($validated['type']) && $validated['type'] === 'ranked' && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only administrators can set tournament type to Ranked.'], 403);
        }

        // If tournament is still in registration, update structural fields
        if ($tournament->status === 'registration') {
            if (isset($validated['max_players'])) {
                $participantCount = $tournament->participants()->count();
                if ($validated['max_players'] < $participantCount) {
                    return response()->json([
                        'message' => "Cannot reduce max players below currently registered participants count ({$participantCount}).",
                    ], 422);
                }
                $tournament->max_players = $validated['max_players'];
            }

            if (isset($validated['time_control'])) {
                $tournament->time_control = $validated['time_control'];
            }

            if (isset($validated['elimination_mode'])) {
                $tournament->elimination_mode = $validated['elimination_mode'];
            }

            if (isset($validated['enable_third_place_match'])) {
                $tournament->enable_third_place_match = $validated['enable_third_place_match'];
            }

            if (array_key_exists('start_time', $validated) || array_key_exists('scheduled_at', $validated)) {
                $startTime = $validated['start_time'] ?? $validated['scheduled_at'] ?? null;
                $tournament->scheduled_at = $startTime ? \Carbon\Carbon::parse($startTime) : null;
            }

            if (isset($validated['type']) && ($user->isAdmin() || $user->isSuperAdmin())) {
                $tournament->type = $validated['type'];
            }
        }

        // Always update basic metadata
        if (isset($validated['title'])) {
            $tournament->title = $validated['title'];
        }
        if (array_key_exists('description', $validated)) {
            $tournament->description = $validated['description'];
        }

        $tournament->save();

        $tournament->load([
            'creator',
            'winner',
            'participants.user',
            'matches.whiteUser',
            'matches.blackUser',
            'matches.winnerUser',
            'matches.chessGame',
        ]);

        AuditLogger::log('updated', 'ChessTournament', $tournament->id, $tournament->title, [
            'max_players' => $tournament->max_players,
            'time_control' => $tournament->time_control,
            'elimination_mode' => $tournament->elimination_mode,
            'status' => $tournament->status,
        ], $request);

        return response()->json([
            'message' => 'Tournament updated successfully',
            'tournament' => $tournament,
        ]);
    }

    /**
     * Join tournament registration.
     */
    public function join(int $id): JsonResponse
    {
        $tournament = ChessTournament::findOrFail($id);

        try {
            $updated = $this->tournamentService->joinTournament($tournament, Auth::user());
            return response()->json([
                'message' => 'Successfully joined tournament',
                'tournament' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Leave tournament registration.
     */
    public function leave(int $id): JsonResponse
    {
        $tournament = ChessTournament::findOrFail($id);

        try {
            $updated = $this->tournamentService->leaveTournament($tournament, Auth::user());
            return response()->json([
                'message' => 'Successfully left tournament',
                'tournament' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Start tournament & generate bracket tree.
     * The tournament creator or any Admin can override and start the tournament.
     */
    public function start(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $tournament = ChessTournament::findOrFail($id);

        if ($tournament->creator_id !== $user->id && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only the tournament creator or administrators can start this tournament.'], 403);
        }

        try {
            $updated = $this->tournamentService->startTournament($tournament, $user);

            AuditLogger::log('started', 'ChessTournament', $tournament->id, $tournament->title, null, $request);

            return response()->json([
                'message' => 'Tournament started successfully!',
                'tournament' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FAIL-SAFE ENDPOINTS: Check-In, Pause, Resume
    // ═══════════════════════════════════════════════════════════

    /**
     * Check in to a tournament match.
     * POST /api/chess/tournaments/{id}/matches/{matchId}/checkin
     */
    public function checkin(int $id, int $matchId): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $tournament = ChessTournament::findOrFail($id);
        $match = $tournament->matches()->findOrFail($matchId);

        try {
            $updated = $this->tournamentService->checkinPlayer($match, $user->id);
            return response()->json([
                'message' => 'Check-in successful',
                'match' => $updated->load(['whiteUser', 'blackUser', 'chessGame']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Approve a disconnect pause for a tournament match.
     * POST /api/chess/tournaments/{id}/matches/{matchId}/pause
     */
    public function pause(int $id, int $matchId, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $tournament = ChessTournament::findOrFail($id);
        $match = $tournament->matches()->findOrFail($matchId);

        $disconnectedColor = $request->input('disconnected_color');
        if (!in_array($disconnectedColor, ['white', 'black'])) {
            return response()->json(['error' => 'Invalid disconnected color.'], 400);
        }

        try {
            $updated = $this->tournamentService->pauseMatch($match, $disconnectedColor, $user->id);
            return response()->json([
                'message' => 'Match paused successfully',
                'match' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Resume a paused tournament match.
     * POST /api/chess/tournaments/{id}/matches/{matchId}/resume
     */
    public function resume(int $id, int $matchId): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $tournament = ChessTournament::findOrFail($id);
        $match = $tournament->matches()->findOrFail($matchId);

        // Only match participants or admins can resume
        $isParticipant = ($match->white_user_id === $user->id || $match->black_user_id === $user->id);
        if (!$isParticipant && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $updated = $this->tournamentService->resumeMatch($match);
            return response()->json([
                'message' => 'Match resumed',
                'match' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
