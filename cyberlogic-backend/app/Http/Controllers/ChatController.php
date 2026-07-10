<?php

namespace App\Http\Controllers;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\ChatMessageReaction;
use App\Models\ChatSavedMedia;
use App\Services\AuditLogger;
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
        $channels = ChatChannel::orderBy('sort_order', 'asc')->get();

        if ($channels->isEmpty()) {
            $defaultChannels = [
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

            $channels = ChatChannel::all();
        }

        // Filter based on user role and archive status
        $filtered = $channels->filter(function ($channel) use ($user) {
            // Non-admins can't see archived channels
            if ($channel->is_archived && !$user->isAdmin()) {
                return false;
            }

            // Check if user role is in allowed_roles
            if (is_array($channel->allowed_roles)) {
                return in_array($user->role, $channel->allowed_roles);
            }

            return true;
        })->values();

        return response()->json($filtered);
    }

    /**
     * Get message history for a specific channel.
     */
    public function messages(string $slug): JsonResponse
    {
        $channel = ChatChannel::where('slug', $slug)->firstOrFail();
        $beforeId = request()->query('before_id');

        // Get last 50 messages, ordered oldest to newest for the chat stream
        $query = ChatMessage::where('channel_id', $channel->id)
            ->with(['user', 'reactions.user', 'parent.user'])
            ->orderBy('id', 'desc')
            ->limit(50);

        if ($beforeId) {
            $query->where('id', '<', (int) $beforeId);
        }

        $messages = $query->get()
            ->reverse()
            ->values();

        $currentUser = request()->user();

        // Map messages to format expected by the frontend
        $mappedMessages = $messages->map(function ($msg) use ($slug, $currentUser) {
            // Group reactions by emoji
            $reactionsGrouped = $msg->reactions->groupBy('emoji');
            $reactionsSummary = [];

            foreach ($reactionsGrouped as $emoji => $reactions) {
                $userIds = $reactions->pluck('user_id')->toArray();
                $reactionsSummary[] = [
                    'emoji' => $emoji,
                    'count' => $reactions->count(),
                    'users' => $reactions->map(function ($r) {
                        return $r->user ? $r->user->name : 'Anonymous';
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
                'author' => $msg->user ? $msg->user->name : 'Anonymous',
                'authorAvatar' => $msg->user ? $msg->user->avatar : 'https://api.dicebear.com/9.x/avataaars/svg?seed=user',
                'authorId' => $msg->user_id,
                'content' => $content,
                'timestamp' => $msg->created_at ? $msg->created_at->format('g:i A') : now()->format('g:i A'),
                'isSystem' => $msg->type === 'system',
                'isDeleted' => $isDeleted,
                'deletionReason' => $deletionReason,
                'reactions' => $isDeleted ? [] : $reactionsSummary,
                'replyTo' => $msg->parent ? [
                    'id' => $msg->parent->id,
                    'content' => $msg->parent->content,
                    'author' => $msg->parent->user ? $msg->parent->user->name : 'Anonymous',
                ] : null,
            ];
        });

        return response()->json($mappedMessages);
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
                    return $r->user ? $r->user->name : 'Anonymous';
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

        // Ensure unique slug (ignoring current ID)
        $count = 1;
        $originalSlug = $validated['slug'];
        while (ChatChannel::where('slug', $validated['slug'])->where('id', '!=', $id)->exists()) {
            $validated['slug'] = $originalSlug.'-'.$count++;
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
            'url' => 'required|url',
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
}
