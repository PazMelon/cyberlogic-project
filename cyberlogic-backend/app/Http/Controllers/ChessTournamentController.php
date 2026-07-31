<?php

namespace App\Http\Controllers;

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
            'creator:id,first_name,last_name,avatar_path',
            'winner:id,first_name,last_name,avatar_path',
            'participants.user:id,first_name,last_name,avatar_path',
        ])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'tournaments' => $tournaments,
        ]);
    }

    /**
     * Create a new tournament (Admin only + Audit Log).
     */
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only administrators can create tournaments.'], 403);
        }

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

        $tournament = $this->tournamentService->createTournament($user, $validated);

        AuditLogger::log('created', 'ChessTournament', $tournament->id, $tournament->title, [
            'max_players' => $tournament->max_players,
            'elimination_mode' => $tournament->elimination_mode,
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
            'creator:id,first_name,last_name,avatar_path',
            'winner:id,first_name,last_name,avatar_path',
            'participants.user:id,first_name,last_name,avatar_path',
            'matches.whiteUser:id,first_name,last_name,avatar_path',
            'matches.blackUser:id,first_name,last_name,avatar_path',
            'matches.winnerUser:id,first_name,last_name,avatar_path',
            'matches.chessGame:id,game_code,status,fen',
        ])->findOrFail($id);

        return response()->json([
            'tournament' => $tournament,
        ]);
    }

    /**
     * Delete/Cancel a tournament (Admin only + Audit Log).
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only administrators can delete tournaments.'], 403);
        }

        $tournament = ChessTournament::findOrFail($id);
        $title = $tournament->title;

        // Delete associated matches & participants
        $tournament->matches()->delete();
        $tournament->participants()->delete();
        $tournament->delete();

        AuditLogger::log('deleted', 'ChessTournament', $id, $title, null, $request);

        return response()->json([
            'message' => 'Tournament deleted successfully',
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
     */
    public function start(int $id, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only administrators can start tournaments.'], 403);
        }

        $tournament = ChessTournament::findOrFail($id);

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
}
