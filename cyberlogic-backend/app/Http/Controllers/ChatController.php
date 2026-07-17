<?php

namespace App\Http\Controllers;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\ChatMessageReaction;
use App\Models\ChatSavedMedia;
use App\Models\ChatChannelRead;
use App\Services\AuditLogger;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Get all chat channels. Seeds default ones if none exist.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $channels = ChatChannel::with(['members'])->orderBy('sort_order', 'asc')->get();

        if ($channels->isEmpty()) {
            $defaultChannels = [
                [
                    'name' => 'Activity Log',
                    'slug' => 'activity-log',
                    'description' => 'Automated activity feed — tracks member logins, session durations, and presence.',
                    'type' => 'group',
                    'icon' => 'Activity',
                    'grouping' => 'System',
                    'allowed_roles' => ['member', 'admin', 'superadmin'],
                    'write_roles' => [],
                    'is_protected' => true,
                    'sort_order' => 0,
                ],
                [
                    'name' => 'General',
                    'slug' => 'general',
                    'description' => 'General chat and discussion for all members.',
                    'type' => 'group',
                    'allowed_roles' => ['member', 'admin', 'superadmin'],
                    'write_roles' => ['member', 'admin', 'superadmin'],
                ],
                [
                    'name' => 'Announcements',
                    'slug' => 'announcements',
                    'description' => 'Realtime announcement stream and updates.',
                    'type' => 'group',
                    'allowed_roles' => ['member', 'admin', 'superadmin'],
                    'write_roles' => ['admin', 'superadmin'],
                ],
                [
                    'name' => 'Events',
                    'slug' => 'events',
                    'description' => 'Chat and updates about upcoming club events.',
                    'type' => 'group',
                    'allowed_roles' => ['member', 'admin', 'superadmin'],
                    'write_roles' => ['member', 'admin', 'superadmin'],
                ],
            ];

            foreach ($defaultChannels as $chan) {
                ChatChannel::create($chan);
            }

            $channels = ChatChannel::with(['members'])->orderBy('sort_order', 'asc')->get();
        }

        // Filter based on user role, membership status, and archive status
        $filtered = $channels->filter(function ($channel) use ($user) {
            // Non-admins can't see archived channels
            if ($channel->is_archived && !$user->isAdmin()) {
                return false;
            }

            // If it is a DM or has explicit members, verify membership
            if ($channel->type === 'dm' || ($channel->type === 'group' && $channel->members->isNotEmpty())) {
                return $channel->members->contains($user->id);
            }

            // Check if user role is in allowed_roles for public channels
            if (is_array($channel->allowed_roles)) {
                return in_array($user->role, $channel->allowed_roles);
            }

            return true;
        })->values();

        // Attach latest message ID dynamically and replace DM names/icons
        $filtered->each(function ($channel) use ($user) {
            $channel->latest_message_id = $channel->messages()->max('id') ?: 0;

            if ($channel->type === 'dm') {
                $otherUser = $channel->members->first(fn($m) => $m->id !== $user->id) ?? $user;
                $channel->name = $otherUser->first_name . ' ' . $otherUser->last_name;
                $channel->icon = $otherUser->avatar_path ? asset('storage/' . $otherUser->avatar_path) : 'avatar';
                $channel->description = "Direct message with " . $otherUser->first_name;
            } elseif ($channel->type === 'group' && $channel->allowed_roles === null) {
                $memberNames = $channel->members->pluck('first_name')->toArray();
                $channel->description = "Group messages with " . implode(', ', $memberNames) . ". . . .";
            }
        });

        return response()->json($filtered);
    }

    public function messages(string $slug): JsonResponse
    {
        $channel = ChatChannel::where('slug', $slug)->firstOrFail();
        $beforeId = request()->query('before_id');
        $afterId = request()->query('after_id');
        $aroundId = request()->query('around_id');

        $baseQuery = ChatMessage::where('channel_id', $channel->id);

        if ($slug === 'freedom-wall') {
            $baseQuery->where('is_flagged', false);
        }

        if ($aroundId) {
            $aroundId = (int)$aroundId;
            // Get 25 messages before and 25 messages after around_id
            $older = (clone $baseQuery)
                ->where('id', '<=', $aroundId)
                ->with(['user', 'reactions.user', 'parent.user'])
                ->orderBy('id', 'desc')
                ->limit(25)
                ->get();

            $newer = (clone $baseQuery)
                ->where('id', '>', $aroundId)
                ->with(['user', 'reactions.user', 'parent.user'])
                ->orderBy('id', 'asc')
                ->limit(25)
                ->get();

            $messages = $older->merge($newer)->sortBy('id')->values();
        } elseif ($afterId) {
            $messages = (clone $baseQuery)
                ->where('id', '>', (int)$afterId)
                ->with(['user', 'reactions.user', 'parent.user'])
                ->orderBy('id', 'asc')
                ->limit(50)
                ->get()
                ->values();
        } else {
            // Get last 50 messages, ordered oldest to newest for the chat stream
            $query = (clone $baseQuery)
                ->with(['user', 'reactions.user', 'parent.user'])
                ->orderBy('id', 'desc')
                ->limit(50);

            if ($beforeId) {
                $query->where('id', '<', (int) $beforeId);
            }

            $messages = $query->get()
                ->reverse()
                ->values();
        }

        $currentUser = request()->user();
        $isFreedomWall = $slug === 'freedom-wall';

        // Map messages to format expected by the frontend
        $mappedMessages = $messages->map(function ($msg) use ($isFreedomWall, $slug, $currentUser) {
            // Group reactions by emoji
            $reactionsGrouped = $msg->reactions->groupBy('emoji');
            $reactionsSummary = [];

            foreach ($reactionsGrouped as $emoji => $reactions) {
                $userIds = $reactions->pluck('user_id')->toArray();
                $reactionsSummary[] = [
                    'emoji' => $emoji,
                    'count' => $reactions->count(),
                    'users' => $isFreedomWall ? [] : $reactions->map(function ($r) {
                        return $r->user ? ($r->user->username ?: $r->user->name) : 'Anonymous';
                    })->values()->toArray(),
                    'reacted' => $currentUser ? in_array($currentUser->id, $userIds) : false,
                ];
            }

            // Handle moderation-deleted messages
            $content = $msg->content;
            $isDeleted = (bool) $msg->is_deleted;
            $deletionReason = null;
            if ($isDeleted) {
                $deletionReason = $msg->deletion_reason ?: 'No reason provided';
                $content = 'This message has been removed by an Admin because of "' . $deletionReason . '".';
            }

            return [
                'id' => $msg->id,
                'channelId' => $slug,
                'author' => $isFreedomWall ? 'Anonymous' : ($msg->user ? ($msg->user->username ?: $msg->user->name) : 'Anonymous'),
                'authorAvatar' => $isFreedomWall ? 'https://api.dicebear.com/9.x/avataaars/svg?seed=anonymous' : ($msg->user ? $msg->user->avatar : 'https://api.dicebear.com/9.x/avataaars/svg?seed=user'),
                'authorId' => $isFreedomWall ? null : $msg->user_id,
                'authorUsername' => $isFreedomWall ? null : ($msg->user ? $msg->user->username : null),
                'content' => $content,
                'timestamp' => $msg->created_at ? $msg->created_at->toIso8601String() : now()->toIso8601String(),
                'isSystem' => $msg->type === 'system',
                'isDeleted' => $isDeleted,
                'deletionReason' => $deletionReason,
                'reactions' => $isDeleted ? [] : $reactionsSummary,
                'isMe' => $currentUser && $msg->user_id === $currentUser->id,
                'intent' => $msg->intent ?: 'general',
                'replyTo' => $msg->parent ? [
                    'id' => $msg->parent->id,
                    'content' => $msg->parent->content,
                    'author' => $isFreedomWall ? 'Anonymous' : ($msg->parent->user ? ($msg->parent->user->username ?: $msg->parent->user->name) : 'Anonymous'),
                    'authorUsername' => $isFreedomWall ? null : ($msg->parent->user ? $msg->parent->user->username : null),
                ] : null,
            ];
        });

        $readReceipts = [];
        if (!$isFreedomWall) {
            $readReceipts = ChatChannelRead::where('channel_id', $channel->id)
                ->with(['user'])
                ->get()
                ->map(function ($receipt) {
                    return [
                        'user_id' => $receipt->user_id,
                        'name' => $receipt->user ? ($receipt->user->username ?: $receipt->user->name) : 'Anonymous',
                        'avatar' => $receipt->user ? $receipt->user->avatar : null,
                        'message_id' => (int)$receipt->last_seen_message_id,
                    ];
                });
        }

        return response()->json([
            'messages' => $mappedMessages,
            'read_receipts' => $readReceipts
        ]);
    }

    /**
     * Toggle reaction on a message. Max 5 unique emojis per user per message.
     */
    public function toggleReaction(Request $request, int $messageId): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'emoji' => 'required|string|max:20',
        ]);
        $emoji = $validated['emoji'];

        $existing = ChatMessageReaction::where('message_id', $messageId)
            ->where('user_id', $user->id)
            ->whereRaw('BINARY emoji = ?', [$emoji])
            ->first();

        if ($existing) {
            // User clicked the same emoji again, remove it
            $existing->delete();
        } else {
            // Delete all other reactions the user has on this message (since we restrict to 1 reaction)
            ChatMessageReaction::where('message_id', $messageId)
                ->where('user_id', $user->id)
                ->delete();

            ChatMessageReaction::create([
                'message_id' => $messageId,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
        }

        $chatMsg = ChatMessage::find($messageId);
        $msgContent = $chatMsg ? substr($chatMsg->content, 0, 50) : "Message #$messageId";
        AuditLogger::log('reacted', 'ChatMessage', $messageId, $msgContent, [
            'emoji' => $emoji,
            'added' => ! $existing
        ], $request);

        // Get updated list of reactions for this message
        $reactions = ChatMessageReaction::where('message_id', $messageId)
            ->with('user')
            ->get();

        $reactionsGrouped = $reactions->groupBy('emoji');
        $reactionsSummary = [];

        foreach ($reactionsGrouped as $emo => $reacs) {
            $userIds = $reacs->pluck('user_id')->toArray();
            $reactionsSummary[] = [
                'emoji' => $emo,
                'count' => $reacs->count(),
                'users' => $reacs->map(function ($r) {
                    return $r->user ? ($r->user->username ?: $r->user->name) : 'Anonymous';
                })->values()->toArray(),
                'reacted' => in_array($user->id, $userIds),
            ];
        }

        return response()->json([
            'messageId' => $messageId,
            'reactions' => $reactionsSummary,
        ]);
    }

    /**
     * Generate a short-lived ticket for WebSocket connection authentication.
     */
    public function ticket(Request $request): JsonResponse
    {
        $ticket = Str::random(40);

        DB::table('chat_tickets')->insert([
            'user_id' => $request->user()->id,
            'ticket' => $ticket,
            'expires_at' => now()->addMinutes(1),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'ticket' => $ticket,
        ]);
    }

    /**
     * Create a new chat channel (Admin/Superadmin only).
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'type' => 'required|string|in:group,dm',
            'icon' => 'nullable|string|max:50',
            'grouping' => 'required|string|max:100',
            'allowed_roles' => 'nullable|array',
            'write_roles' => 'nullable|array',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        // Ensure unique slug
        $count = 1;
        $originalSlug = $validated['slug'];
        while (ChatChannel::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug.'-'.$count++;
        }

        $validated['created_by'] = $currentUser->id;

        // Set next sort order
        $maxSort = ChatChannel::max('sort_order') ?: 0;
        $validated['sort_order'] = $maxSort + 1;

        $channel = ChatChannel::create($validated);

        AuditLogger::log('created', 'ChatChannel', $channel->id, $channel->name, null, $request);

        return response()->json($channel, 201);
    }

    /**
     * Update an existing chat channel (Admin/Superadmin only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $channel = ChatChannel::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'type' => 'required|string|in:group,dm',
            'icon' => 'nullable|string|max:50',
            'grouping' => 'required|string|max:100',
            'allowed_roles' => 'nullable|array',
            'write_roles' => 'nullable|array',
            'is_archived' => 'required|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if ($channel->is_protected) {
            // Overwrite protected properties so they cannot be modified
            $validated['name'] = $channel->name;
            $validated['slug'] = $channel->slug;
            $validated['type'] = $channel->type;
            $validated['grouping'] = $channel->grouping;
            $validated['is_archived'] = false;
        } else {
            // Ensure unique slug (ignoring current ID)
            $count = 1;
            $originalSlug = $validated['slug'];
            while (ChatChannel::where('slug', $validated['slug'])->where('id', '!=', $id)->exists()) {
                $validated['slug'] = $originalSlug.'-'.$count++;
            }
        }

        $channel->update($validated);

        AuditLogger::log('updated', 'ChatChannel', $channel->id, $channel->name, null, $request);

        return response()->json($channel);
    }

    /**
     * Delete a chat channel (Superadmin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete channels.'], 403);
        }

        $channel = ChatChannel::findOrFail($id);
        if ($channel->is_protected) {
            return response()->json(['message' => 'This is a system protected channel and cannot be deleted.'], 403);
        }
        $channelId = $channel->id;
        $channelName = $channel->name;
        $channel->delete();

        AuditLogger::log('deleted', 'ChatChannel', $channelId, $channelName, null, $request);

        return response()->json(['message' => 'Channel deleted successfully']);
    }

    /**
     * Reorder chat channels sort_order (Admin/Superadmin only).
     */
    public function reorder(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:chat_channels,id',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $index => $id) {
                ChatChannel::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        AuditLogger::log('reordered', 'ChatChannel', null, 'Chat Channels Sorting', [
            'ids' => $validated['ids']
        ], $request);

        return response()->json(['message' => 'Channel sorting updated successfully']);
    }

    public function getGifs(Request $request): JsonResponse
    {
        $limit = $request->query('limit', 15);
        $offset = $request->query('offset', 0);
        $search = $request->query('search', '');
        $category = $request->query('category', '');

        $query = ChatSavedMedia::with(['user:id,first_name,last_name,avatar_path'])
            ->orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if (!empty($category) && $category !== 'All') {
            $query->where('category', $category);
        }

        $gifs = $query->offset($offset)->limit($limit)->get();
        return response()->json($gifs);
    }

    public function storeGif(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'url' => 'required|url|unique:chat_saved_media,url',
            'category' => 'nullable|string|max:50',
        ]);

        $validated['user_id'] = $request->user() ? $request->user()->id : null;

        $gif = ChatSavedMedia::create($validated);
        $gif->load('user:id,first_name,last_name,avatar_path');

        AuditLogger::log('created', 'ChatSavedMedia', $gif->id, $gif->title, ['url' => $gif->url], $request);

        return response()->json($gif, 201);
    }

    /**
     * Delete a saved GIF/image link.
     */
    public function destroyGif(Request $request, int $id): JsonResponse
    {
        $gif = ChatSavedMedia::findOrFail($id);
        
        AuditLogger::log('deleted', 'ChatSavedMedia', $gif->id, $gif->title, ['url' => $gif->url], $request);

        $gif->delete();
        return response()->json(['message' => 'Media link deleted successfully']);
    }

    /**
     * Soft-delete a chat message (Admin with manage_chat permission).
     * Replaces message content with moderation notice.
     */
    public function deleteMessage(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete messages.'], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $message = ChatMessage::findOrFail($id);

        if ($message->is_deleted) {
            return response()->json(['message' => 'This message has already been deleted.'], 422);
        }

        $message->update([
            'is_deleted' => true,
            'deleted_by' => $currentUser->id,
            'deletion_reason' => $validated['reason'],
            'deleted_at_timestamp' => now(),
        ]);

        AuditLogger::log('deleted_message', 'ChatMessage', $message->id, substr($message->content, 0, 80), [
            'reason' => $validated['reason'],
            'channel_id' => $message->channel_id,
            'original_author_id' => $message->user_id,
        ], $request);

        return response()->json([
            'message' => 'Message deleted successfully',
            'messageId' => $message->id,
        ]);
    }

    /**
     * Mark a channel as read up to a message ID.
     */
    public function markAsRead(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $channel = ChatChannel::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'message_id' => 'required|integer',
        ]);

        $messageId = $validated['message_id'];

        if ($slug !== 'freedom-wall') {
            $existing = ChatChannelRead::where('user_id', $user->id)
                ->where('channel_id', $channel->id)
                ->first();

            if (!$existing || $existing->last_seen_message_id < $messageId) {
                ChatChannelRead::updateOrCreate(
                    ['user_id' => $user->id, 'channel_id' => $channel->id],
                    ['last_seen_message_id' => $messageId]
                );

                \App\Services\RealtimeService::broadcast("chat:{$slug}", [
                    'user_id' => $user->id,
                    'name' => $user->username ?: $user->name,
                    'avatar' => $user->avatar,
                    'message_id' => $messageId
                ], 'message_seen');
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get all flagged messages (Admin/Superadmin only).
     */
    public function flaggedMessages(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = ChatMessage::where(function($query) {
            $query->where('moderation_status', 'flagged')
                  ->orWhere(function($q) {
                      $q->where('moderation_status', 'approved')
                        ->whereNotNull('flagged_reason');
                  })
                  ->orWhere('moderation_status', 'rejected')
                  ->orWhere('is_deleted', true);
        })
        ->with(['user', 'channel'])
        ->orderBy('created_at', 'desc')
        ->get();

        $isSuperAdmin = $currentUser->isSuperAdmin();

        $mapped = $messages->map(function ($msg) use ($isSuperAdmin) {
            return [
                'id' => $msg->id,
                'content' => $msg->content,
                'flagged_reason' => $msg->flagged_reason ?: 'Potential violation flagged by AI',
                'moderation_status' => $msg->moderation_status,
                'channel_name' => $msg->channel ? $msg->channel->name : 'Unknown',
                'channel_slug' => $msg->channel ? $msg->channel->slug : '',
                'created_at' => $msg->created_at ? $msg->created_at->toIso8601String() : now()->toIso8601String(),
                // Only disclose author details if user is superadmin
                'author_name' => $isSuperAdmin ? ($msg->user ? $msg->user->name : 'Anonymous') : 'Anonymous',
                'author_email' => $isSuperAdmin ? ($msg->user ? $msg->user->email : 'N/A') : 'Hidden',
                'author_avatar' => $isSuperAdmin ? ($msg->user ? $msg->user->avatar : null) : 'https://api.dicebear.com/9.x/avataaars/svg?seed=anonymous',
                'author_role' => $isSuperAdmin ? ($msg->user ? $msg->user->role : 'N/A') : 'Hidden',
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Approve a flagged message (Admin/Superadmin only).
     */
    public function approveFlaggedMessage(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message = ChatMessage::findOrFail($id);
        $message->update([
            'is_flagged' => false,
            'moderation_status' => 'approved',
        ]);

        $channel = $message->channel;
        $channelSlug = $channel ? $channel->slug : 'freedom-wall';

        // Format message for WebSocket broadcast (anonymized)
        $formattedMsg = [
            'id' => $message->id,
            'channelId' => $channelSlug,
            'author' => 'Anonymous',
            'authorAvatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=anonymous',
            'authorId' => null,
            'authorUsername' => null,
            'content' => $message->content,
            'timestamp' => $message->created_at ? $message->created_at->toIso8601String() : now()->toIso8601String(),
            'isSystem' => $message->type === 'system',
            'isDeleted' => false,
            'reactions' => [],
            'replyTo' => null,
            '_originalAuthorId' => $message->user_id, // helper for Node to set isMe
        ];

        // Broadcast to channel
        \App\Services\RealtimeService::broadcast("chat:{$channelSlug}", $formattedMsg, 'message');

        AuditLogger::log('approved_flagged_message', 'ChatMessage', $message->id, substr($message->content, 0, 80), [
            'channel_id' => $message->channel_id,
        ], $request);

        return response()->json(['message' => 'Message approved successfully']);
    }

    /**
     * Reject/delete a flagged message (Admin/Superadmin only).
     */
    public function rejectFlaggedMessage(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $message = ChatMessage::findOrFail($id);
        $message->update([
            'is_flagged' => false,
            'is_deleted' => true,
            'deleted_by' => $currentUser->id,
            'deletion_reason' => $validated['reason'],
            'moderation_status' => 'rejected',
            'deleted_at_timestamp' => now(),
        ]);

        if ($message->user_id) {
            $channelName = $message->channel ? $message->channel->name : 'chat';
            $channelSlug = $message->channel ? $message->channel->slug : null;

            \App\Services\NotificationService::notifyUser(
                $message->user_id,
                'chat_moderation',
                'Message Rejected',
                "Your message in #{$channelName} was rejected by an admin. Reason: " . $validated['reason'],
                [
                    'message_id' => $message->id,
                    'reason' => $validated['reason'],
                    'channel_slug' => $channelSlug,
                ],
                'shield-alert',
                "/app/chat?channel={$channelSlug}&message_id={$message->id}"
            );
        }

        AuditLogger::log('rejected_flagged_message', 'ChatMessage', $message->id, substr($message->content, 0, 80), [
            'reason' => $validated['reason'],
            'channel_id' => $message->channel_id,
            'original_author_id' => $message->user_id,
        ], $request);

        return response()->json(['message' => 'Message rejected and deleted successfully']);
    }

    /**
     * Internal endpoint for WebSocket server to request Gemini moderation (Secret header required).
     */
    public function moderateMessage(Request $request): JsonResponse
    {
        $secretHeader = $request->header('X-Realtime-Secret');
        $expectedSecret = config('services.realtime.secret');

        if (empty($secretHeader) || $secretHeader !== $expectedSecret) {
            return response()->json(['error' => 'Unauthorized internal call'], 401);
        }

        $validated = $request->validate([
            'messageId' => 'required|integer|exists:chat_messages,id',
            'content' => 'required|string',
        ]);

        $messageId = $validated['messageId'];
        $content = $validated['content'];

        $result = GeminiService::moderate($content);

        $message = ChatMessage::find($messageId);
        if ($message) {
            $message->update([
                'is_flagged' => $result['is_harmful'],
                'flagged_reason' => $result['reason'],
                'moderation_status' => $result['is_harmful'] ? 'flagged' : 'approved',
                'intent' => $result['intent'] ?? 'general',
            ]);
        }

        return response()->json([
            'is_harmful' => $result['is_harmful'],
            'reason' => $result['reason'],
            'intent' => $result['intent'] ?? 'general'
        ]);
    }

    /**
     * Internal endpoint for WebSocket server to request Gemini batch moderation (Secret header required).
     */
    public function moderateBatchMessages(Request $request): JsonResponse
    {
        $secretHeader = $request->header('X-Realtime-Secret');
        $expectedSecret = config('services.realtime.secret');

        if (empty($secretHeader) || $secretHeader !== $expectedSecret) {
            return response()->json(['error' => 'Unauthorized internal call'], 401);
        }

        // Run the batch moderation
        $messages = ChatMessage::where('moderation_status', 'none')
            ->where('type', 'text')
            ->where(function($query) {
                $query->whereNull('user_id')
                      ->orWhereHas('user', function($q) {
                          $q->where('role', '!=', 'bot');
                      });
            })
            ->where('is_deleted', false)
            ->limit(50)
            ->get();

        if ($messages->isEmpty()) {
            return response()->json([
                'processed' => 0,
                'message' => 'No unprocessed messages found.'
            ]);
        }

        $payload = $messages->map(fn($m) => [
            'id' => $m->id,
            'content' => $m->content
        ])->toArray();

        $results = GeminiService::moderateBatch($payload);

        if (empty($results)) {
            return response()->json([
                'error' => 'Failed to receive or parse AI moderation evaluation.'
            ], 500);
        }

        $flaggedCount = 0;
        $approvedCount = 0;

        foreach ($results as $item) {
            $msgId = $item['id'] ?? null;
            $isHarmful = filter_var($item['is_harmful'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $reason = $item['reason'] ?? null;

            $message = ChatMessage::find($msgId);
            if ($message) {
                $message->update([
                    'is_flagged' => $isHarmful,
                    'flagged_reason' => $reason,
                    'moderation_status' => $isHarmful ? 'flagged' : 'approved',
                ]);

                if ($isHarmful) {
                    $flaggedCount++;
                } else {
                    $approvedCount++;
                }
            }
        }

        return response()->json([
            'processed' => $messages->count(),
            'approved' => $approvedCount,
            'flagged' => $flaggedCount,
            'message' => 'Batch moderation complete.'
        ]);
    }

    /**
     * Get statistics and comparison metrics for message moderation.
     */
    public function moderationStats(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('manage_chat')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 1. Pending Flagged Count
        $pendingFlags = ChatMessage::where('moderation_status', 'flagged')->count();

        // 2. Total Actioned/Rejected
        $totalRejected = ChatMessage::where('moderation_status', 'rejected')->count();

        // 3. Flagged Today vs Yesterday Comparison
        $todayStart = now()->startOfDay();
        $yesterdayStart = now()->subDay()->startOfDay();
        $yesterdayEnd = now()->subDay()->endOfDay();

        $flaggedToday = ChatMessage::where('is_flagged', true)
            ->where('created_at', '>=', $todayStart)
            ->count();

        $flaggedYesterday = ChatMessage::where('is_flagged', true)
            ->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])
            ->count();

        if ($flaggedYesterday > 0) {
            $comparePct = round((($flaggedToday - $flaggedYesterday) / $flaggedYesterday) * 100, 1);
        } else {
            $comparePct = $flaggedToday > 0 ? 100.0 : 0.0;
        }

        // 4. Most Flagged Channel
        $mostFlaggedChannel = ChatMessage::where('is_flagged', true)
            ->select('channel_id', DB::raw('count(*) as total'))
            ->groupBy('channel_id')
            ->orderBy('total', 'desc')
            ->first();

        $hotspotChannelName = 'None';
        $hotspotCount = 0;
        if ($mostFlaggedChannel) {
            $channel = ChatChannel::find($mostFlaggedChannel->channel_id);
            if ($channel) {
                $hotspotChannelName = $channel->name;
                $hotspotCount = $mostFlaggedChannel->total;
            }
        }

        return response()->json([
            'pending_flags' => $pendingFlags,
            'total_rejected' => $totalRejected,
            'compare_yesterday_pct' => $comparePct,
            'most_flagged_channel' => $hotspotChannelName,
            'most_flagged_count' => $hotspotCount,
        ]);
    }

    /**
     * Initiate or retrieve a 1-on-1 DM channel.
     */
    public function initiateDm(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'recipient_id' => 'required|integer|exists:users,id',
        ]);

        $recipientId = $validated['recipient_id'];

        // Prevent creating a duplicate DM by checking if a DM already exists between these two users
        $existingChannel = ChatChannel::where('type', 'dm')
            ->whereHas('members', function($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->whereHas('members', function($q) use ($recipientId) {
                $q->where('users.id', $recipientId);
            })
            ->first();

        if ($existingChannel) {
            // Load members to return same structure as index
            $existingChannel->load(['members']);
            $otherUser = $user;
            foreach ($existingChannel->members as $m) {
                if ($m->id !== $user->id) {
                    $otherUser = $m;
                    break;
                }
            }
            $existingChannel->name = $otherUser->first_name . ' ' . $otherUser->last_name;
            $existingChannel->icon = $otherUser->avatar_path ? asset('storage/' . $otherUser->avatar_path) : 'avatar';
            $existingChannel->description = "Direct message with " . $otherUser->first_name;
            return response()->json($existingChannel);
        }

        // Create new DM channel
        $slug = 'dm-' . min($user->id, $recipientId) . '-' . max($user->id, $recipientId);
        
        $channel = ChatChannel::create([
            'name' => 'Direct Message', // placeholder
            'slug' => $slug,
            'description' => 'Private DM channel',
            'type' => 'dm',
            'grouping' => 'Direct Messages',
            'created_by' => $user->id,
            'is_protected' => false,
            'is_archived' => false,
        ]);

        // Add both users as members
        $channel->members()->attach([$user->id, $recipientId]);

        // Load members to return dynamic name
        $channel->load(['members']);
        $otherUser = $user;
        foreach ($channel->members as $m) {
            if ($m->id !== $user->id) {
                $otherUser = $m;
                break;
            }
        }
        $channel->name = $otherUser->first_name . ' ' . $otherUser->last_name;
        $channel->icon = $otherUser->avatar_path ? asset('storage/' . $otherUser->avatar_path) : 'avatar';
        $channel->description = "Direct message with " . $otherUser->first_name;

        // Broadcast realtime new channel update to recipient
        \App\Services\RealtimeService::broadcast(
            'presence',
            [
                'id' => $channel->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'slug' => $channel->slug,
                'description' => "Direct message with " . $user->first_name,
                'type' => $channel->type,
                'icon' => $user->avatar_path ? asset('storage/' . $user->avatar_path) : 'avatar',
                'grouping' => $channel->grouping,
                'is_protected' => $channel->is_protected,
                'is_archived' => $channel->is_archived,
            ],
            'channel_created',
            $recipientId
        );

        return response()->json($channel, 201);
    }

    /**
     * Create a private custom group chat.
     */
    public function createGroup(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        $name = $validated['name'];
        $description = $validated['description'] ?? null;
        $userIds = $validated['user_ids'];

        // Always include the creator
        if (!in_array($user->id, $userIds)) {
            $userIds[] = $user->id;
        }

        $slug = 'group-' . Str::random(12);

        $channel = ChatChannel::create([
            'name' => $name,
            'slug' => $slug,
            'description' => $description,
            'type' => 'group',
            'grouping' => 'Group Chats',
            'created_by' => $user->id,
            'is_protected' => false,
            'is_archived' => false,
            'allowed_roles' => null, // null allowed_roles means private group members only
            'write_roles' => null,
        ]);

        // Add all members
        $channel->members()->attach($userIds);

        // Load members to build description and return same structure
        $channel->load(['members']);
        $memberNames = $channel->members->pluck('first_name')->toArray();
        $channel->description = "Group messages with " . implode(', ', $memberNames) . ". . . .";

        // Broadcast realtime new channel update to all other members
        foreach ($userIds as $memberId) {
            if ($memberId === $user->id) continue;
            \App\Services\RealtimeService::broadcast(
                'presence',
                $channel->toArray(),
                'channel_created',
                $memberId
            );
        }

        return response()->json($channel, 201);
    }
}
