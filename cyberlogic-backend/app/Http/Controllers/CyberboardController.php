<?php

namespace App\Http\Controllers;

use App\Models\CyberboardBoard;
use App\Models\CyberboardCard;
use App\Models\CyberboardCardActivity;
use App\Models\CyberboardCardComment;
use App\Models\CyberboardCardVote;
use App\Models\CyberboardColumn;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ImageOptimizer;
use App\Services\NotificationService;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CyberboardController extends Controller
{
    /**
     * Check if user is permitted to view board (handles private board exclusivity).
     */
    private function canUserViewBoard(CyberboardBoard $board, $user): bool
    {
        if ($board->visibility !== 'private') {
            return true;
        }
        if (!$user) return false;
        if ($board->created_by === $user->id) return true;
        if (in_array($user->role, ['admin', 'superadmin'])) return true;
        $allowedMembers = $board->allowed_members ?? [];
        return in_array($user->id, $allowedMembers);
    }

    /**
     * Check if user is permitted to create columns on board.
     */
    private function canUserCreateColumn(CyberboardBoard $board, $user): bool
    {
        if (!$user) return false;
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        $isHost = $board->created_by === $user->id;
        if ($isAdmin || $isHost) return true;

        $policy = $board->column_creation_policy ?? 'everyone';
        if ($policy === 'host_admin_only') {
            return false;
        }
        if ($policy === 'specific_roles') {
            $allowedRoles = $board->allowed_column_creator_roles ?? [];
            return in_array($user->role, $allowedRoles);
        }
        if ($policy === 'specific_users') {
            $allowedUsers = $board->allowed_column_creator_users ?? [];
            return in_array($user->id, $allowedUsers);
        }
        return true;
    }

    /**
     * Check if user is permitted to edit cards in a column based on column permissions.
     */
    private function canUserEditCardInColumn(CyberboardColumn $column, $user): bool
    {
        if (!$user) return false;
        $board = $column->board ?? CyberboardBoard::find($column->board_id);
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        $isHost = $board && $board->created_by === $user->id;
        if ($isAdmin || $isHost) return true;

        $allowedRoles = $column->allowed_roles;
        $allowedUsers = $column->allowed_users;
        $hasRestriction = (!empty($allowedRoles)) || (!empty($allowedUsers));

        if (!$hasRestriction) {
            return true;
        }

        $roleAllowed = !empty($allowedRoles) && in_array($user->role, $allowedRoles);
        $userAllowed = !empty($allowedUsers) && in_array($user->id, $allowedUsers);
        return $roleAllowed || $userAllowed;
    }

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
        $user = $request->user();
        $isAdmin = $user && in_array($user->role, ['admin', 'superadmin']);

        $boards = CyberboardBoard::with(['creator:id,first_name,middle_name,last_name,avatar_path,role,username'])
            ->where('is_archived', false)
            ->where(function ($q) use ($user, $isAdmin) {
                if ($isAdmin) {
                    return; // Admins see all boards
                }
                $q->where('visibility', '!=', 'private')
                  ->orWhere('created_by', optional($user)->id);
                if ($user) {
                    $q->orWhereJsonContains('allowed_members', $user->id);
                }
            })
            ->withCount(['cards' => function ($q) {
                $q->where('is_archived', false);
            }])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($boards);
    }

    /**
     * GET /api/cyberboard/{id}
     * Retrieve full details of a board including columns, cards, votes, activities, and comments.
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
            'columns.cards.assignedUser:id,first_name,middle_name,last_name,avatar_path,role,username',
            'columns.cards.parent:id,title',
            'columns.cards.subCards' => function ($q) {
                $q->where('is_archived', false)->orderBy('position', 'asc');
            },
            'columns.cards.subCards.user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'columns.cards.subCards.assignedUser:id,first_name,middle_name,last_name,avatar_path,role,username',
            'columns.cards.votes',
            'columns.cards.comments' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'columns.cards.comments.user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'columns.cards.activities' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'columns.cards.activities.user:id,first_name,middle_name,last_name,avatar_path,role,username',
        ])->find($id);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        if (!$this->canUserViewBoard($board, $user)) {
            return response()->json([
                'message' => 'This board is private. You need an invitation from the host to view it.',
            ], 403);
        }

        // Format board data with computed properties (votes_count, has_voted, comments_count, activities)
        $formattedColumns = $board->columns->map(function ($column) use ($user) {
            $columnData = $column->toArray();
            $columnData['cards'] = $column->cards->map(function ($card) use ($user) {
                $cardData = $card->toArray();
                $cardData['votes_count'] = $card->votes->count();
                $cardData['comments_count'] = $card->comments->count();
                $cardData['has_voted'] = $user ? $card->votes->contains('user_id', $user->id) : false;
                $cardData['activities'] = $card->activities;
                return $cardData;
            });
            return $columnData;
        });

        $response = $board->toArray();
        $response['columns'] = $formattedColumns;

        return response()->json($response);
    }

    /**
     * GET /api/cyberboard/{id}/activities
     * Get all card activity logs for a given board.
     */
    public function getBoardActivities(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $board = CyberboardBoard::find($id);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        if (!$this->canUserViewBoard($board, $user)) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $activities = CyberboardCardActivity::where(function ($q) use ($id) {
            $q->where('board_id', $id)
              ->orWhereHas('card', function ($cq) use ($id) {
                  $cq->whereHas('column', function ($ccq) use ($id) {
                      $ccq->where('board_id', $id);
                  });
              });
        })
        ->with([
            'user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'card:id,title,column_id',
        ])
        ->orderBy('created_at', 'desc')
        ->limit(150)
        ->get();

        return response()->json($activities);
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
            'type' => 'nullable|string|in:activity,ideas,brainstorming,roadmap',
            'category' => 'nullable|string|in:system,club_related,projects_tech,events_social,others',
            'cover_color' => 'nullable|string|max:30',
            'visibility' => 'nullable|string|in:public,private',
            'allowed_members' => 'nullable|array',
            'allowed_members.*' => 'integer|exists:users,id',
            'column_creation_policy' => 'nullable|string|in:host_admin_only,specific_roles,specific_users,everyone',
            'allowed_column_creator_roles' => 'nullable|array',
            'allowed_column_creator_roles.*' => 'string',
            'allowed_column_creator_users' => 'nullable|array',
            'allowed_column_creator_users.*' => 'integer|exists:users,id',
            'gantt_edit_policy' => 'nullable|string|in:host_admin_only,specific_roles,specific_users,everyone',
            'allowed_gantt_editor_roles' => 'nullable|array',
            'allowed_gantt_editor_roles.*' => 'string',
            'allowed_gantt_editor_users' => 'nullable|array',
            'allowed_gantt_editor_users.*' => 'integer|exists:users,id',
            'methodology' => 'nullable|string|in:waterfall,agile,custom',
            'phase_settings' => 'nullable|array',
        ]);

        $category = $validated['category'] ?? 'club_related';
        if ($category === 'system' && !$isAdmin) {
            return response()->json([
                'message' => 'Only admins and superadmins can create System category boards.',
            ], 403);
        }

        $methodology = $validated['methodology'] ?? 'waterfall';
        $phaseSettings = $validated['phase_settings'] ?? null;

        if (($validated['type'] ?? 'activity') === 'roadmap' && empty($phaseSettings)) {
            if ($methodology === 'agile') {
                $phaseSettings = [
                    ['name' => 'Sprint 1', 'color' => '#06b6d4'],
                    ['name' => 'Sprint 2', 'color' => '#3b82f6'],
                    ['name' => 'Sprint 3', 'color' => '#8b5cf6'],
                    ['name' => 'Release v1.0', 'color' => '#10b981'],
                    ['name' => 'Backlog', 'color' => '#64748b'],
                ];
            } else {
                $phaseSettings = [
                    ['name' => 'Requirements & Planning', 'color' => '#3b82f6'],
                    ['name' => 'Architecture & Design', 'color' => '#8b5cf6'],
                    ['name' => 'Development & Implementation', 'color' => '#06b6d4'],
                    ['name' => 'Testing & QA', 'color' => '#f59e0b'],
                    ['name' => 'Deployment & Release', 'color' => '#10b981'],
                ];
            }
        }

        $board = CyberboardBoard::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'] ?? 'activity',
            'category' => $category,
            'cover_color' => $validated['cover_color'] ?? '#06b6d4',
            'visibility' => $validated['visibility'] ?? 'public',
            'allowed_members' => $validated['allowed_members'] ?? null,
            'column_creation_policy' => $validated['column_creation_policy'] ?? 'everyone',
            'allowed_column_creator_roles' => $validated['allowed_column_creator_roles'] ?? null,
            'allowed_column_creator_users' => $validated['allowed_column_creator_users'] ?? null,
            'gantt_edit_policy' => $validated['gantt_edit_policy'] ?? 'everyone',
            'allowed_gantt_editor_roles' => $validated['allowed_gantt_editor_roles'] ?? null,
            'allowed_gantt_editor_users' => $validated['allowed_gantt_editor_users'] ?? null,
            'methodology' => $methodology,
            'phase_settings' => $phaseSettings,
            'created_by' => $user->id,
            'is_archived' => false,
        ]);

        // Auto-seed default 5 columns unless board type is roadmap
        if (($validated['type'] ?? 'activity') !== 'roadmap') {
            foreach ($this->getDefaultColumns() as $col) {
                $board->columns()->create($col);
            }
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
            'type' => 'nullable|string|in:activity,ideas,brainstorming,roadmap',
            'category' => 'nullable|string|in:system,club_related,projects_tech,events_social,others',
            'cover_color' => 'nullable|string|max:30',
            'is_archived' => 'nullable|boolean',
            'is_pinned' => 'nullable|boolean',
            'visibility' => 'nullable|string|in:public,private',
            'allowed_members' => 'nullable|array',
            'allowed_members.*' => 'integer|exists:users,id',
            'column_creation_policy' => 'nullable|string|in:host_admin_only,specific_roles,specific_users,everyone',
            'allowed_column_creator_roles' => 'nullable|array',
            'allowed_column_creator_roles.*' => 'string',
            'allowed_column_creator_users' => 'nullable|array',
            'allowed_column_creator_users.*' => 'integer|exists:users,id',
            'gantt_edit_policy' => 'nullable|string|in:host_admin_only,specific_roles,specific_users,everyone',
            'allowed_gantt_editor_roles' => 'nullable|array',
            'allowed_gantt_editor_roles.*' => 'string',
            'allowed_gantt_editor_users' => 'nullable|array',
            'allowed_gantt_editor_users.*' => 'integer|exists:users,id',
            'methodology' => 'nullable|string|in:waterfall,agile,custom',
            'phase_settings' => 'nullable|array',
        ]);

        if (isset($validated['category']) && $validated['category'] === 'system' && !$isAdmin) {
            return response()->json([
                'message' => 'Only admins and superadmins can assign System category to boards.',
            ], 403);
        }

        if (isset($validated['is_pinned']) && !$isAdmin) {
            return response()->json([
                'message' => 'Only admins and superadmins can pin or unpin boards.',
            ], 403);
        }

        $board->update($validated);
        $board->load(['creator:id,first_name,middle_name,last_name,avatar_path,role,username']);

        RealtimeService::broadcast("cyberboard:{$board->id}", [
            'board' => $board,
        ], 'board:updated');

        return response()->json($board);
    }

    /**
     * POST /api/cyberboard/{id}/pin
     * Toggle board pin status (Admin only).
     */
    public function togglePin(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (!$isAdmin) {
            return response()->json(['message' => 'Only admins and superadmins can pin or unpin boards.'], 403);
        }

        $board = CyberboardBoard::find($id);
        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        $board->is_pinned = !$board->is_pinned;
        $board->save();
        $board->load(['creator:id,first_name,middle_name,last_name,avatar_path,role,username']);

        RealtimeService::broadcast("cyberboard:{$board->id}", [
            'board' => $board,
        ], 'board:updated');

        return response()->json([
            'message' => $board->is_pinned ? 'Board pinned to top.' : 'Board unpinned.',
            'is_pinned' => $board->is_pinned,
            'board' => $board,
        ]);
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
            'parent_id' => 'nullable|exists:cyberboard_cards,id',
            'predecessor_id' => 'nullable|exists:cyberboard_cards,id',
            'predecessor_ids' => 'nullable|array',
            'predecessor_ids.*' => 'integer|exists:cyberboard_cards,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'assigned_user_ids' => 'nullable|array',
            'assigned_user_ids.*' => 'integer|exists:users,id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'activity_date' => 'nullable|date',
            'activity_end_date' => 'nullable|date|after_or_equal:activity_date',
            'color_tag' => 'nullable|string|max:30',
            'priority' => 'nullable|in:low,medium,high',
            'phase' => 'nullable|string|max:100',
            'attachments' => 'nullable|array',
            'checklist' => 'nullable|array',
            'completion_percentage' => 'nullable|integer|min:0|max:100',
        ]);

        // Default to first column if column_id is not specified
        $columnId = $validated['column_id'] ?? optional($board->columns->first())->id;

        if (!$columnId) {
            return response()->json(['message' => 'Board has no columns'], 422);
        }

        $targetColumn = CyberboardColumn::where('id', $columnId)->where('board_id', $boardId)->first();
        if (!$targetColumn) {
            return response()->json(['message' => 'Selected column does not belong to this board'], 422);
        }

        $isHost = $board->created_by === $user->id;
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);
        $allowedRoles = $targetColumn->allowed_roles;
        $allowedUsers = $targetColumn->allowed_users;
        $hasRestriction = (!empty($allowedRoles)) || (!empty($allowedUsers));

        if ($hasRestriction && !$isHost && !$isAdmin) {
            $roleAllowed = !empty($allowedRoles) && in_array($user->role, $allowedRoles);
            $userAllowed = !empty($allowedUsers) && in_array($user->id, $allowedUsers);

            if (!$roleAllowed && !$userAllowed) {
                return response()->json([
                    'message' => 'You do not have permission to submit cards to this column.'
                ], 403);
            }
        }

        $maxPosition = CyberboardCard::where('column_id', $columnId)->max('position') ?? -1;

        $assignedUserIds = isset($validated['assigned_user_ids'])
            ? array_values(array_unique(array_filter($validated['assigned_user_ids'])))
            : (isset($validated['assigned_user_id']) ? [$validated['assigned_user_id']] : []);
        $primaryAssignedUserId = $assignedUserIds[0] ?? null;

        $predecessorIds = isset($validated['predecessor_ids'])
            ? array_values(array_unique(array_filter($validated['predecessor_ids'])))
            : (isset($validated['predecessor_id']) && $validated['predecessor_id'] ? [$validated['predecessor_id']] : []);
        $primaryPredecessorId = $predecessorIds[0] ?? ($validated['predecessor_id'] ?? null);

        $card = CyberboardCard::create([
            'column_id' => $columnId,
            'parent_id' => $validated['parent_id'] ?? null,
            'predecessor_id' => $primaryPredecessorId,
            'predecessor_ids' => $predecessorIds,
            'user_id' => $user->id,
            'assigned_user_id' => $primaryAssignedUserId,
            'assigned_user_ids' => $assignedUserIds,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'activity_date' => $validated['activity_date'] ?? null,
            'activity_end_date' => $validated['activity_end_date'] ?? null,
            'color_tag' => $validated['color_tag'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'phase' => $validated['phase'] ?? null,
            'position' => $maxPosition + 1,
            'is_archived' => false,
            'attachments' => $validated['attachments'] ?? null,
            'checklist' => $validated['checklist'] ?? null,
            'completion_percentage' => $validated['completion_percentage'] ?? 0,
        ]);

        // Log card creation activity
        CyberboardCardActivity::create([
            'board_id' => $boardId,
            'card_id' => $card->id,
            'user_id' => $user->id,
            'action' => 'created',
            'description' => "Created card '{$card->title}'",
        ]);

        $card->load([
            'user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'assignedUser:id,first_name,middle_name,last_name,avatar_path,role,username',
            'parent:id,title',
            'subCards' => function ($q) {
                $q->where('is_archived', false)->orderBy('position', 'asc');
            },
            'subCards.assignedUser:id,first_name,middle_name,last_name,avatar_path,role,username',
            'votes',
            'comments',
            'activities.user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'activities.card:id,title,column_id',
        ]);
        $cardArr = $card->toArray();
        $cardArr['votes_count'] = 0;
        $cardArr['comments_count'] = 0;
        $cardArr['has_voted'] = false;
        $cardArr['activities'] = $card->activities;

        foreach ($assignedUserIds as $assigneeId) {
            if ($assigneeId !== $user->id) {
                NotificationService::notifyUser(
                    $assigneeId,
                    'cyberboard_assigned',
                    'Assigned to CyberBoard Task',
                    "You were assigned to task '{$card->title}' by {$user->first_name}",
                    ['board_id' => $boardId, 'card_id' => $card->id],
                    'user-check',
                    "/app/cyberboard/{$boardId}?card={$card->id}"
                );
            }
        }

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card' => $cardArr,
        ], 'card:created');

        $fullText = ($card->title ?? '') . ' ' . ($card->description ?? '');
        if (str_contains($fullText, '@')) {
            NotificationService::notifyMentions(
                $fullText,
                $user,
                'cyberboard_mention',
                "Mention in CyberBoard",
                "{$user->first_name} mentioned you in CyberBoard idea '{$card->title}'",
                ['board_id' => $boardId, 'card_id' => $card->id],
                'at-sign',
                "/app/cyberboard/{$boardId}?card={$card->id}"
            );
        }

        return response()->json($cardArr, 201);
    }

    /**
     * PUT /api/cyberboard/cards/{id}
     * Edit suggestion card details (enforces Column Permissions).
     */
    public function updateCard(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $card = CyberboardCard::with('column')->find($id);

        if (!$card) {
            return response()->json(['message' => 'Card not found'], 404);
        }

        if (!$this->canUserEditCardInColumn($card->column, $user)) {
            return response()->json(['message' => 'You do not have permission to edit cards in this column based on column permissions.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'parent_id' => 'nullable|exists:cyberboard_cards,id',
            'predecessor_id' => 'nullable|exists:cyberboard_cards,id',
            'predecessor_ids' => 'nullable|array',
            'predecessor_ids.*' => 'integer|exists:cyberboard_cards,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'assigned_user_ids' => 'nullable|array',
            'assigned_user_ids.*' => 'integer|exists:users,id',
            'activity_date' => 'nullable|date',
            'activity_end_date' => 'nullable|date|after_or_equal:activity_date',
            'color_tag' => 'nullable|string|max:30',
            'priority' => 'nullable|in:low,medium,high',
            'phase' => 'nullable|string|max:100',
            'position' => 'nullable|integer',
            'attachments' => 'nullable|array',
            'column_id' => 'nullable|exists:cyberboard_columns,id',
            'checklist' => 'nullable|array',
            'completion_percentage' => 'nullable|integer|min:0|max:100',
        ]);

        if (isset($validated['assigned_user_ids'])) {
            $newAssignedUserIds = array_values(array_unique(array_filter($validated['assigned_user_ids'])));
            $validated['assigned_user_ids'] = $newAssignedUserIds;
            $validated['assigned_user_id'] = $newAssignedUserIds[0] ?? null;
        } elseif (array_key_exists('assigned_user_id', $validated)) {
            $validated['assigned_user_ids'] = $validated['assigned_user_id'] ? [$validated['assigned_user_id']] : [];
        }

        if (isset($validated['predecessor_ids'])) {
            $newPredecessorIds = array_values(array_unique(array_filter($validated['predecessor_ids'])));
            $validated['predecessor_ids'] = $newPredecessorIds;
            $validated['predecessor_id'] = $newPredecessorIds[0] ?? null;
        } elseif (array_key_exists('predecessor_id', $validated)) {
            $validated['predecessor_ids'] = $validated['predecessor_id'] ? [$validated['predecessor_id']] : [];
        }

        // Validate Gantt Chart editing permissions if timeline or phase is modified
        $isGanttEdit = array_key_exists('phase', $validated) ||
                       array_key_exists('activity_date', $validated) ||
                       array_key_exists('activity_end_date', $validated) ||
                       array_key_exists('predecessor_id', $validated) ||
                       array_key_exists('predecessor_ids', $validated);

        if ($isGanttEdit && $card->column) {
            $board = CyberboardBoard::find($card->column->board_id);
            if ($board && $board->type === 'roadmap' && !$this->canUserEditGantt($board, $user)) {
                return response()->json([
                    'message' => 'Permission Denied: You do not have permission to edit Gantt chart items or timeline dates on this board.'
                ], 403);
            }
        }

        $changeDescItems = [];
        if (isset($validated['title']) && $validated['title'] !== $card->title) {
            $changeDescItems[] = "title to '{$validated['title']}'";
        }
        if (array_key_exists('description', $validated) && $validated['description'] !== $card->description) {
            $changeDescItems[] = "description";
        }
        if (isset($validated['assigned_user_ids'])) {
            $oldIds = $card->assigned_user_ids ?? ($card->assigned_user_id ? [$card->assigned_user_id] : []);
            $newIds = $validated['assigned_user_ids'];
            if ($oldIds !== $newIds) {
                $changeDescItems[] = "assigned members (" . count($newIds) . " assigned)";
                $addedIds = array_diff($newIds, $oldIds);
                foreach ($addedIds as $newId) {
                    if ($newId !== $user->id) {
                        NotificationService::notifyUser(
                            $newId,
                            'cyberboard_assigned',
                            'Assigned to CyberBoard Task',
                            "You were assigned to task '{$card->title}' by {$user->first_name}",
                            ['board_id' => $card->column->board_id, 'card_id' => $card->id],
                            'user-check',
                            "/app/cyberboard/{$card->column->board_id}?card={$card->id}"
                        );
                    }
                }
            }
        }
        if (isset($validated['priority']) && $validated['priority'] !== $card->priority) {
            $changeDescItems[] = "priority to " . strtoupper($validated['priority']);
        }
        if (array_key_exists('activity_date', $validated) && $validated['activity_date'] !== $card->activity_date) {
            $changeDescItems[] = "schedule start date";
        }
        if (array_key_exists('activity_end_date', $validated) && $validated['activity_end_date'] !== $card->activity_end_date) {
            $changeDescItems[] = "schedule end date";
        }
        if (array_key_exists('phase', $validated) && $validated['phase'] !== $card->phase) {
            $oldP = $card->phase ? "'{$card->phase}'" : 'Unassigned';
            $newP = $validated['phase'] ? "'{$validated['phase']}'" : 'Unassigned';
            $changeDescItems[] = "phase from {$oldP} to {$newP}";
        }
        if (array_key_exists('color_tag', $validated) && $validated['color_tag'] !== $card->color_tag) {
            $changeDescItems[] = "accent color";
        }

        $card->update($validated);

        if (!empty($changeDescItems)) {
            CyberboardCardActivity::create([
                'board_id' => $card->column->board_id,
                'card_id' => $card->id,
                'user_id' => $user->id,
                'action' => 'updated',
                'description' => "Updated " . implode(', ', $changeDescItems),
            ]);
        }

        $card->load([
            'user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'assignedUser:id,first_name,middle_name,last_name,avatar_path,role,username',
            'parent:id,title',
            'subCards' => function ($q) {
                $q->where('is_archived', false)->orderBy('position', 'asc');
            },
            'subCards.assignedUser:id,first_name,middle_name,last_name,avatar_path,role,username',
            'votes',
            'comments',
            'activities.user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'activities.card:id,title,column_id',
        ]);

        $cardArr = $card->toArray();
        $cardArr['votes_count'] = $card->votes->count();
        $cardArr['comments_count'] = $card->comments->count();
        $cardArr['has_voted'] = $card->votes->contains('user_id', $user->id);
        $cardArr['activities'] = $card->activities;

        $boardId = $card->column->board_id;
        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card' => $cardArr,
        ], 'card:updated');

        if (!empty($changeDescItems)) {
            $assigned = $card->assigned_user_ids ?? ($card->assigned_user_id ? [$card->assigned_user_id] : []);
            $notifyUserIds = array_unique(array_merge([$card->user_id], $assigned));
            foreach ($notifyUserIds as $notifyId) {
                if ($notifyId && $notifyId !== $user->id) {
                    NotificationService::notifyUser(
                        $notifyId,
                        'cyberboard_card_updated',
                        "CyberBoard Task Updated",
                        "{$user->first_name} updated task '{$card->title}': " . implode(', ', $changeDescItems),
                        ['board_id' => $boardId, 'card_id' => $card->id],
                        'edit-3',
                        "/app/cyberboard/{$boardId}?card={$card->id}"
                    );
                }
            }
        }

        $fullText = ($card->title ?? '') . ' ' . ($card->description ?? '');
        if (str_contains($fullText, '@')) {
            NotificationService::notifyMentions(
                $fullText,
                $user,
                'cyberboard_mention',
                "Mention in CyberBoard",
                "{$user->first_name} mentioned you in CyberBoard idea '{$card->title}'",
                ['board_id' => $boardId, 'card_id' => $card->id],
                'at-sign',
                "/app/cyberboard/{$boardId}?card={$card->id}"
            );
        }

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
        $cardTitle = $card->title;
        $cardOwnerId = $card->user_id;
        $columnTitle = $card->column ? $card->column->title : 'Column';

        // Detach existing card activity records so they persist in board audit logs for transparency
        CyberboardCardActivity::where('card_id', $cardId)->update([
            'board_id' => $boardId,
            'card_id' => null,
        ]);

        // Record card deletion activity log
        CyberboardCardActivity::create([
            'board_id' => $boardId,
            'card_id' => null,
            'user_id' => $user->id,
            'action' => 'deleted',
            'description' => "Deleted card '{$cardTitle}' from '{$columnTitle}'",
        ]);

        $card->delete();

        if ($cardOwnerId !== $user->id) {
            NotificationService::notifyUser(
                $cardOwnerId,
                'cyberboard_card_deleted',
                "Your idea was removed",
                "Your suggestion '{$cardTitle}' was deleted from CyberBoard.",
                ['board_id' => $boardId],
                'trash-2',
                "/app/cyberboard/{$boardId}"
            );
        }

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

        $targetColumn = CyberboardColumn::with('board')->find($toColumnId);
        if (!$targetColumn) {
            return response()->json(['message' => 'Target column not found'], 404);
        }

        $board = $targetColumn->board;
        $isHost = $board && $board->created_by === $user->id;
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        // Check Gantt Chart Editing Policy if board is Roadmap type
        if ($board && $board->type === 'roadmap' && !$this->canUserEditGantt($board, $user)) {
            return response()->json([
                'message' => 'Permission Denied: You do not have permission to drag & drop or reorder Gantt chart items on this board.'
            ], 403);
        }

        // Check Source Column Permission (Moving Out)
        $sourceColumn = $card->column;
        if ($sourceColumn && $fromColumnId !== $toColumnId && !$isHost && !$isAdmin) {
            $srcAllowedRoles = $sourceColumn->allowed_roles;
            $srcAllowedUsers = $sourceColumn->allowed_users;
            $srcHasRestriction = (!empty($srcAllowedRoles)) || (!empty($srcAllowedUsers));

            if ($srcHasRestriction) {
                $roleAllowed = !empty($srcAllowedRoles) && in_array($user->role, $srcAllowedRoles);
                $userAllowed = !empty($srcAllowedUsers) && in_array($user->id, $srcAllowedUsers);
                if (!$roleAllowed && !$userAllowed) {
                    return response()->json([
                        'message' => 'You do not have permission to move cards out of this column.'
                    ], 403);
                }
            }
        }

        // Check Target Column Permission (Moving In)
        $allowedRoles = $targetColumn->allowed_roles;
        $allowedUsers = $targetColumn->allowed_users;
        $hasRestriction = (!empty($allowedRoles)) || (!empty($allowedUsers));

        if ($hasRestriction && !$isHost && !$isAdmin) {
            $roleAllowed = !empty($allowedRoles) && in_array($user->role, $allowedRoles);
            $userAllowed = !empty($allowedUsers) && in_array($user->id, $allowedUsers);

            if (!$roleAllowed && !$userAllowed) {
                return response()->json([
                    'message' => 'You do not have permission to move cards into this column.'
                ], 403);
            }
        }

        $boardId = $targetColumn->board_id;

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

        $fromColumnTitle = CyberboardColumn::where('id', $fromColumnId)->value('title') ?? 'Column';
        $toColumnTitle = $targetColumn->title;
        $activityDesc = $fromColumnId !== $toColumnId
            ? "Moved card from '{$fromColumnTitle}' to '{$toColumnTitle}'"
            : "Reordered position in '{$toColumnTitle}'";

        CyberboardCardActivity::create([
            'board_id' => $boardId,
            'card_id' => $card->id,
            'user_id' => $user->id,
            'action' => 'moved',
            'description' => $activityDesc,
        ]);

        $activities = CyberboardCardActivity::with([
            'user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'card:id,title,column_id',
        ])
            ->where('card_id', $card->id)
            ->orderBy('created_at', 'desc')
            ->get();

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $card->id,
            'from_column_id' => $fromColumnId,
            'to_column_id' => $toColumnId,
            'position' => $newPos,
            'moved_by_user_id' => $user->id,
            'activities' => $activities,
        ], 'card:moved');

        if ($fromColumnId !== $toColumnId) {
            $assigned = $card->assigned_user_ids ?? ($card->assigned_user_id ? [$card->assigned_user_id] : []);
            $notifyUserIds = array_unique(array_merge([$card->user_id], $assigned));
            foreach ($notifyUserIds as $notifyId) {
                if ($notifyId && $notifyId !== $user->id) {
                    NotificationService::notifyUser(
                        $notifyId,
                        'cyberboard_card_moved',
                        "Task moved stage",
                        "Task '{$card->title}' was moved to the '{$targetColumn->title}' stage.",
                        [
                            'board_id' => $boardId,
                            'card_id' => $card->id,
                            'column_id' => $toColumnId,
                            'column_title' => $targetColumn->title,
                        ],
                        'arrow-right-circle',
                        "/app/cyberboard/{$boardId}?card={$card->id}"
                    );
                }
            }
        }

        return response()->json([
            'message' => 'Card moved successfully',
            'card_id' => $card->id,
            'column_id' => $toColumnId,
            'position' => $newPos,
            'activities' => $activities,
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

        $activityDesc = $hasVoted ? "Upvoted card" : "Removed upvote";
        CyberboardCardActivity::create([
            'board_id' => $boardId,
            'card_id' => $id,
            'user_id' => $user->id,
            'action' => $hasVoted ? 'voted' : 'unvoted',
            'description' => $activityDesc,
        ]);

        $activities = CyberboardCardActivity::with([
            'user:id,first_name,middle_name,last_name,avatar_path,role,username',
            'card:id,title,column_id',
        ])
            ->where('card_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'card_id' => $id,
            'votes_count' => $votesCount,
            'voted_by_user_id' => $user->id,
            'has_voted' => $hasVoted,
            'activities' => $activities,
        ], 'card:voted');

        if ($hasVoted && $card->user_id !== $user->id) {
            NotificationService::notifyUser(
                $card->user_id,
                'cyberboard_like',
                "New upvote on your idea",
                "{$user->first_name} liked your suggestion '{$card->title}'",
                ['board_id' => $boardId, 'card_id' => $card->id],
                'thumbs-up',
                "/app/cyberboard/{$boardId}?card={$card->id}"
            );
        }

        return response()->json([
            'card_id' => $id,
            'votes_count' => $votesCount,
            'has_voted' => $hasVoted,
            'activities' => $activities,
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

        $assigned = $card->assigned_user_ids ?? ($card->assigned_user_id ? [$card->assigned_user_id] : []);
        $notifyUserIds = array_unique(array_merge([$card->user_id], $assigned));
        foreach ($notifyUserIds as $notifyId) {
            if ($notifyId && $notifyId !== $user->id) {
                NotificationService::notifyUser(
                    $notifyId,
                    'cyberboard_comment',
                    "New comment on task",
                    "{$user->first_name} commented on '{$card->title}'",
                    ['board_id' => $boardId, 'card_id' => $card->id],
                    'message-square',
                    "/app/cyberboard/{$boardId}?card={$card->id}"
                );
            }
        }

        if (str_contains($validated['content'], '@')) {
            NotificationService::notifyMentions(
                $validated['content'],
                $user,
                'cyberboard_mention',
                "Mention in CyberBoard Comment",
                "{$user->first_name} mentioned you in a comment on '{$card->title}'",
                ['board_id' => $boardId, 'card_id' => $card->id],
                'at-sign',
                "/app/cyberboard/{$boardId}?card={$card->id}"
            );
        }

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

        if (!$this->canUserCreateColumn($board, $user)) {
            return response()->json(['message' => 'You do not have permission to add columns to this board based on board settings.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'icon' => 'nullable|string|max:20',
            'color' => 'nullable|string|max:30',
            'status_type' => 'nullable|string|max:40',
            'allowed_roles' => 'nullable|array',
            'allowed_roles.*' => 'string',
            'allowed_users' => 'nullable|array',
            'allowed_users.*' => 'integer|exists:users,id',
        ]);

        $maxPos = CyberboardColumn::where('board_id', $boardId)->max('position') ?? -1;

        $column = CyberboardColumn::create([
            'board_id' => $boardId,
            'title' => $validated['title'],
            'icon' => $validated['icon'] ?? '📌',
            'color' => $validated['color'] ?? '#06b6d4',
            'status_type' => $validated['status_type'] ?? 'not_started',
            'position' => $maxPos + 1,
            'allowed_roles' => $validated['allowed_roles'] ?? null,
            'allowed_users' => $validated['allowed_users'] ?? null,
        ]);

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'column' => $column,
        ], 'column:created');

        return response()->json($column, 201);
    }

    /**
     * PUT /api/cyberboard/{boardId}/columns/reorder
     * Reorder board columns.
     */
    public function reorderColumns(Request $request, int $boardId): JsonResponse
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
            'order' => 'required|array',
            'order.*' => 'integer|exists:cyberboard_columns,id',
        ]);

        foreach ($validated['order'] as $index => $columnId) {
            CyberboardColumn::where('id', $columnId)
                ->where('board_id', $boardId)
                ->update(['position' => $index]);
        }

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'order' => $validated['order'],
            'reordered_by_user_id' => $user->id,
        ], 'columns:reordered');

        return response()->json(['message' => 'Columns reordered successfully']);
    }

    /**
     * PUT /api/cyberboard/{boardId}/cards/batch-reorder
     * Batch reorder/update positions and optional phases for cards in 1 request.
     */
    public function batchReorderCards(Request $request, int $boardId): JsonResponse
    {
        $user = $request->user();
        $board = CyberboardBoard::find($boardId);

        if (!$board) {
            return response()->json(['message' => 'Board not found'], 404);
        }

        if ($board->type === 'roadmap' && !$this->canUserEditGantt($board, $user)) {
            return response()->json([
                'message' => 'Permission Denied: You do not have permission to drag & drop or reorder Gantt chart items on this board.'
            ], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:cyberboard_cards,id',
            'items.*.position' => 'required|integer|min:0',
            'items.*.phase' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $boardId) {
            foreach ($validated['items'] as $item) {
                $updateData = ['position' => $item['position']];
                if (array_key_exists('phase', $item)) {
                    $updateData['phase'] = $item['phase'];
                }
                CyberboardCard::where('id', $item['id'])
                    ->whereHas('column', function ($q) use ($boardId) {
                        $q->where('board_id', $boardId);
                    })
                    ->update($updateData);
            }
        });

        RealtimeService::broadcast("cyberboard:{$boardId}", [
            'items' => $validated['items'],
            'reordered_by_user_id' => $user->id,
        ], 'cards:batch_reordered');

        return response()->json(['message' => 'Cards reordered successfully']);
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
            'status_type' => 'nullable|string|max:40',
            'allowed_roles' => 'nullable|array',
            'allowed_roles.*' => 'string',
            'allowed_users' => 'nullable|array',
            'allowed_users.*' => 'integer|exists:users,id',
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

    /**
     * POST /api/cyberboard/cards/upload-attachment
     * Upload an image attachment for a task card.
     */
    public function uploadAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,webp,jpg,gif|max:5120',
        ]);

        if ($request->file('image')->isValid()) {
            $path = ImageOptimizer::optimize($request->file('image'), 'cyberboard_attachments');
            $file = $request->file('image');

            AuditLogger::log('uploaded', 'CyberboardCard', null, 'Task Card Attachment Image', ['path' => $path], $request);

            return response()->json([
                'url' => asset('storage/' . $path),
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);
        }

        return response()->json(['error' => 'Failed to upload attachment image.'], 400);
    }

    /**
     * Helper method to validate if user has permission to edit Gantt items or roadmap dates/phases.
     */
    protected function canUserEditGantt(CyberboardBoard $board, $user): bool
    {
        if ($board->created_by === $user->id || in_array($user->role, ['admin', 'superadmin'])) {
            return true;
        }

        $policy = $board->gantt_edit_policy ?? 'everyone';
        if ($policy === 'host_admin_only') {
            return false;
        }
        if ($policy === 'specific_roles') {
            $roles = $board->allowed_gantt_editor_roles ?? [];
            return !empty($roles) && in_array($user->role, $roles);
        }
        if ($policy === 'specific_users') {
            $users = $board->allowed_gantt_editor_users ?? [];
            return !empty($users) && in_array($user->id, $users);
        }

        return true;
    }
}
