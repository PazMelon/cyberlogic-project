<?php

namespace App\Http\Controllers;

use App\Models\CyberboardBoard;
use App\Models\CyberboardCard;
use App\Models\CyberboardCardComment;
use App\Models\CyberboardCardVote;
use App\Models\CyberboardColumn;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CyberboardController extends Controller
{
    /**
     * Get default columns setup for a new board.
     */
    private function getDefaultColumns(): array
    {
        return [
            ['title' => 'Ideas', 'icon' => '💡', 'color' => '#06b6d4', 'position' => 0],
            ['title' => 'Under Review', 'icon' => '📋', 'color' => '#f59e0b', 'position' => 1],
            ['title' => 'Approved', 'icon' => '✅', 'color' => '#10b981', 'position' => 2],
            ['title' => 'In Progress', 'icon' => '🚀', 'color' => '#8b5cf6', 'position' => 3],
            ['title' => 'Completed', 'icon' => '🎉', 'color' => '#ec4899', 'position' => 4],
        ];
    }

    /**
     * GET /api/cyberboard
     * List all active boards with creator details and summary counts.
     */
    public function index(Request $request): JsonResponse
    {
        $boards = CyberboardBoard::with(['creator:id,first_name,middle_name,last_name,avatar_path,role,username'])
            ->where('is_archived', false)
            ->withCount(['cards' => function ($q) {
                $q->where('is_archived', false);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($boards);
    }

    /**
     * GET /api/cyberboard/{id}
     * Retrieve full details of a board including columns, cards, votes, and comments.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $board = CyberboardBoard::with([
            'creator:id,first_name,middle_name,last_name,avatar_path,role,username',
            'columns' => function ($q) {
                $q->orderBy('position', 'asc');
            },
            'columns.cards' => function ($q) {
                $q->where('is_archived', false)->orderBy('position', 'asc');
            },
            'columns.cards.user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'columns.cards.votes',
            'columns.cards.comments' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'columns.cards.comments.user:id,first_name,middle_name,last_name,avatar_path,role,username',
        ])->find($id);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        // Format board data with computed properties (votes_count, has_voted, comments_count)
        $formattedColumns = $board->columns->map(function ($column) use ($user) {
            $columnData = $column->toArray();
            $columnData['cards'] = $column->cards->map(function ($card) use ($user) {
                $cardData = $card->toArray();
                $cardData['votes_count'] = $card->votes->count();
                $cardData['comments_count'] = $card->comments->count();
                $cardData['has_voted'] = $card->votes->contains('user_id', $user->id);
                return $cardData;
            });
            return $columnData;
        });

        $response = $board->toArray();
        $response['columns'] = $formattedColumns;

        return response()->json($response);
    }

    /**
     * POST /api/cyberboard
     * Create a new board.
     * Non-admins are limited to 1 active (ongoing) board at a time.
     */
    public function storeBoard(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        // Enforce limit: Non-admin members can only have 1 active board at a time
        if (!$isAdmin) {
            $activeCount = CyberboardBoard::where('created_by', $user->id)
                ->where('is_archived', false)
                ->count();

            if ($activeCount >= 1) {
                return response()->json([
                    'message' => 'You already have an ongoing active board. Please complete or archive it before starting a new one.',
                ], 422);
            }
        }

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string|max:1000',
            'cover_color' => 'nullable|string|max:30',
        ]);

        $board = CyberboardBoard::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'cover_color' => $validated['cover_color'] ?? '#06b6d4',
            'created_by' => $user->id,
            'is_archived' => false,
        ]);

        // Auto-seed default 5 columns
        foreach ($this->getDefaultColumns() as $col) {
            $board->columns()->create($col);
        }

        $board->load(['creator:id,first_name,middle_name,last_name,avatar_path,role,username', 'columns']);

        return response()->json($board, 201);
    }

    /**
     * PUT /api/cyberboard/{id}
     * Update board details.
     */
    public function updateBoard(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $board = CyberboardBoard::find($id);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($board->created_by !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string|max:1000',
            'cover_color' => 'nullable|string|max:30',
            'is_archived' => 'nullable|boolean',
        ]);

        $board->update($validated);
        $board->load(['creator:id,first_name,middle_name,last_name,avatar_path,role,username']);

        RealtimeService::broadcast("cyberboard:{$board->id}", [
            'board' => $board,
        ], 'board:updated');

        return response()->json($board);
    }

    /**
     * DELETE /api/cyberboard/{id}
     * Archive or delete board.
     */
    public function destroyBoard(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $board = CyberboardBoard::find($id);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($board->created_by !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $board->delete();

        RealtimeService::broadcast("cyberboard:{$id}", [
            'board_id' => $id,
        ], 'board:deleted');

        return response()->json(['message' => 'Board deleted successfully']);
    }

    /**
     * POST /api/cyberboard/{boardId}/cards
     * Submit a new suggestion card to the board.
     */
    public function storeCard(Request $request, int $boardId): JsonResponse
    {
        $user = $request->user();
        $board = CyberboardBoard::with('columns')->find($boardId);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        $validated = $request->validate([
            'column_id' => 'nullable|exists:cyberboard_columns,id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'activity_date' => 'nullable|date',
            'activity_end_date' => 'nullable|date|after_or_equal:activity_date',
            'color_tag' => 'nullable|string|max:30',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        // Default to first column if column_id is not specified
        $columnId = $validated['column_id'] ?? optional($board->columns->first())->id;

        if (!$columnId) {
            return response()->json(['message' => 'Board has no columns'], 422);
        }

        $maxPosition = CyberboardCard::where('column_id', $columnId)->max('position') ?? -1;

        $card = CyberboardCard::create([
            'column_id' => $columnId,
            'user_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'activity_date' => $validated['activity_date'] ?? null,
            'activity_end_date' => $validated['activity_end_date'] ?? null,
            'color_tag' => $validated['color_tag'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'position' => $maxPosition + 1,
            'is_archived' => false,
        ]);

        $card->load(['user:id,first_name,middle_name,last_name,avatar_path,role,username', 'votes', 'comments']);
        $cardArr = $card->toArray();
        $cardArr['votes_count'] = 0;
        $cardArr['comments_count'] = 0;
        $cardArr['has_voted'] = false;

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card' => $cardArr,
        ], 'card:created');

        return response()->json($cardArr, 201);
    }

    /**
     * PUT /api/cyberboard/cards/{id}
     * Edit suggestion card details.
     */
    public function updateCard(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $card = CyberboardCard::with('column')->find($id);

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($card->user_id !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'activity_date' => 'nullable|date',
            'activity_end_date' => 'nullable|date|after_or_equal:activity_date',
            'color_tag' => 'nullable|string|max:30',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $card->update($validated);
        $card->load(['user:id,first_name,middle_name,last_name,avatar_path,role,username', 'votes', 'comments']);

        $cardArr = $card->toArray();
        $cardArr['votes_count'] = $card->votes->count();
        $cardArr['comments_count'] = $card->comments->count();
        $cardArr['has_voted'] = $card->votes->contains('user_id', $user->id);

        $boardId = $card->column->board_id;
        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card' => $cardArr,
        ], 'card:updated');

        return response()->json($cardArr);
    }

    /**
     * DELETE /api/cyberboard/cards/{id}
     * Delete suggestion card.
     */
    public function destroyCard(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $card = CyberboardCard::with('column')->find($id);

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($card->user_id !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $boardId = $card->column->board_id;
        $cardId = $card->id;
        $card->delete();

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $cardId,
        ], 'card:deleted');

        return response()->json(['message' => 'Card deleted successfully']);
    }

    /**
     * PUT /api/cyberboard/cards/{id}/move
     * Drag and drop move a card to a different column / position.
     */
    public function moveCard(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $card = CyberboardCard::with('column')->find($id);

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        $validated = $request->validate([
            'column_id' => 'required|exists:cyberboard_columns,id',
            'position' => 'required|integer|min:0',
        ]);

        $fromColumnId = $card->column_id;
        $toColumnId = $validated['column_id'];
        $newPos = $validated['position'];
        $boardId = $card->column->board_id;

        DB::transaction(function () use ($card, $fromColumnId, $toColumnId, $newPos) {
            // Update target column cards position
            CyberboardCard::where('column_id', $toColumnId)
                ->where('id', '!=', $card->id)
                ->where('position', '>=', $newPos)
                ->increment('position');

            $card->column_id = $toColumnId;
            $card->position = $newPos;
            $card->save();
        });

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $card->id,
            'from_column_id' => $fromColumnId,
            'to_column_id' => $toColumnId,
            'position' => $newPos,
            'moved_by_user_id' => $user->id,
        ], 'card:moved');

        return response()->json([
            'message' => 'Card moved successfully',
            'card_id' => $card->id,
            'column_id' => $toColumnId,
            'position' => $newPos,
        ]);
    }

    /**
     * POST /api/cyberboard/cards/{id}/vote
     * Toggle upvote on a card.
     */
    public function toggleVote(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $card = CyberboardCard::with('column')->find($id);

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        $existingVote = CyberboardCardVote::where('card_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingVote) {
            $existingVote->delete();
            $hasVoted = false;
        } else {
            CyberboardCardVote::create([
                'card_id' => $id,
                'user_id' => $user->id,
            ]);
            $hasVoted = true;
        }

        $votesCount = CyberboardCardVote::where('card_id', $id)->count();
        $boardId = $card->column->board_id;

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $id,
            'votes_count' => $votesCount,
            'voted_by_user_id' => $user->id,
            'has_voted' => $hasVoted,
        ], 'card:voted');

        return response()->json([
            'card_id' => $id,
            'votes_count' => $votesCount,
            'has_voted' => $hasVoted,
        ]);
    }

    /**
     * POST /api/cyberboard/cards/{id}/comments
     * Add discussion comment to a card.
     */
    public function storeComment(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $card = CyberboardCard::with('column')->find($id);

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = CyberboardCardComment::create([
            'card_id' => $id,
            'user_id' => $user->id,
            'content' => $validated['content'],
        ]);

        $comment->load('user:id,first_name,middle_name,last_name,avatar_path,role,username');
        $boardId = $card->column->board_id;

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $id,
            'comment' => $comment,
        ], 'card:commented');

        return response()->json($comment, 201);
    }

    /**
     * DELETE /api/cyberboard/comments/{id}
     * Delete comment from a card.
     */
    public function destroyComment(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $comment = CyberboardCardComment::with('card.column')->find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($comment->user_id !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $boardId = $comment->card->column->board_id;
        $cardId = $comment->card_id;
        $commentId = $comment->id;

        $comment->delete();

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $cardId,
            'comment_id' => $commentId,
        ], 'comment:deleted');

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    /**
     * POST /api/cyberboard/{boardId}/columns
     * Create column in board (Admin or Board Owner).
     */
    public function storeColumn(Request $request, int $boardId): JsonResponse
    {
        $user = $request->user();
        $board = CyberboardBoard::find($boardId);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($board->created_by !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'icon' => 'nullable|string|max:20',
            'color' => 'nullable|string|max:30',
        ]);

        $maxPos = CyberboardColumn::where('board_id', $boardId)->max('position') ?? -1;

        $column = CyberboardColumn::create([
            'board_id' => $boardId,
            'title' => $validated['title'],
            'icon' => $validated['icon'] ?? '📌',
            'color' => $validated['color'] ?? '#06b6d4',
            'position' => $maxPos + 1,
        ]);

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'column' => $column,
        ], 'column:created');

        return response()->json($column, 201);
    }

    /**
     * PUT /api/cyberboard/columns/{id}
     * Update column details.
     */
    public function updateColumn(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $column = CyberboardColumn::with('board')->find($id);

        if (!$column) {
            return response()->json(['message' => 'Column not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($column->board->created_by !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'icon' => 'nullable|string|max:20',
            'color' => 'nullable|string|max:30',
        ]);

        $column->update($validated);

        RealtimeService::broadcast("cyberboard:{$column->board_id}", [
            'column' => $column,
        ], 'column:updated');

        return response()->json($column);
    }

    /**
     * DELETE /api/cyberboard/columns/{id}
     * Delete column (moves cards to first available column).
     */
    public function destroyColumn(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $column = CyberboardColumn::with('board')->find($id);

        if (!$column) {
            return response()->json(['message' => 'Column not found'], 404);
        }

        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        if ($column->board->created_by !== $user->id && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $boardId = $column->board_id;

        DB::transaction(function () use ($column, $boardId) {
            $fallbackColumn = CyberboardColumn::where('board_id', $boardId)
                ->where('id', '!=', $column->id)
                ->orderBy('position', 'asc')
                ->first();

            if ($fallbackColumn) {
                CyberboardCard::where('column_id', $column->id)->update(['column_id' => $fallbackColumn->id]);
            } else {
                CyberboardCard::where('column_id', $column->id)->delete();
            }

            $column->delete();
        });

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'column_id' => $id,
        ], 'column:deleted');

        return response()->json(['message' => 'Column deleted successfully']);
    }
}
