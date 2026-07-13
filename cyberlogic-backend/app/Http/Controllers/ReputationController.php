<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReputationController extends Controller
{
    /**
     * GET /api/reputation/leaderboard
     * Return list of users sorted by their reputation score for the given timeframe.
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $timeframe = $request->query('timeframe', 'week');
        if (!in_array($timeframe, ['today', 'week', 'month', 'year', 'allTime'])) {
            $timeframe = 'week';
        }

        $users = User::where('status', 'approved')->get();

        $leaderboard = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'reputation' => $user->reputation,
            ];
        })->sortByDesc(function ($item) use ($timeframe) {
            return $item['reputation'][$timeframe] ?? 0;
        })->values();

        return response()->json($leaderboard);
    }

    /**
     * GET /api/reputation/{id}
     * Return reputation details for a specific user.
     */
    public function show($id): JsonResponse
    {
        $user = User::where('status', 'approved')->findOrFail($id);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
            ],
            'reputation' => $user->reputation,
        ]);
    }
}
