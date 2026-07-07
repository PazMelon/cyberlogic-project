<?php

namespace App\Http\Controllers;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
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
        $channels = ChatChannel::all();

        if ($channels->isEmpty()) {
            $defaultChannels = [
                [
                    'name' => 'General',
                    'slug' => 'general',
                    'description' => 'General chat and discussion for all members.',
                    'type' => 'group',
                    'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                    'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
                ],
                [
                    'name' => 'Announcements',
                    'slug' => 'announcements',
                    'description' => 'Realtime announcement stream and updates.',
                    'type' => 'group',
                    'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                    'write_roles' => ['officer', 'admin', 'superadmin'],
                ],
                [
                    'name' => 'Events',
                    'slug' => 'events',
                    'description' => 'Chat and updates about upcoming club events.',
                    'type' => 'group',
                    'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                    'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
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
            if ($channel->is_archived && ! in_array($user->role, ['admin', 'superadmin'])) {
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

        // Get last 50 messages, ordered oldest to newest for the chat stream
        $messages = ChatMessage::where('channel_id', $channel->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        // Map messages to format expected by the frontend
        $mappedMessages = $messages->map(function ($msg) use ($slug) {
            return [
                'id' => $msg->id,
                'channelId' => $slug,
                'author' => $msg->user ? $msg->user->name : 'Anonymous',
                'authorAvatar' => $msg->user ? $msg->user->avatar : 'https://api.dicebear.com/9.x/avataaars/svg?seed=user',
                'authorId' => $msg->user_id,
                'content' => $msg->content,
                'timestamp' => $msg->created_at ? $msg->created_at->format('g:i A') : now()->format('g:i A'),
                'isSystem' => $msg->type === 'system',
            ];
        });

        return response()->json($mappedMessages);
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
        if (! in_array($currentUser->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'type' => 'required|string|in:group,dm',
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

        $channel = ChatChannel::create($validated);

        return response()->json($channel, 201);
    }

    /**
     * Update an existing chat channel (Admin/Superadmin only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (! in_array($currentUser->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $channel = ChatChannel::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'type' => 'required|string|in:group,dm',
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

        return response()->json($channel);
    }

    /**
     * Delete a chat channel (Superadmin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized. Superadmin role required.'], 403);
        }

        $channel = ChatChannel::findOrFail($id);
        $channel->delete();

        return response()->json(['message' => 'Channel deleted successfully']);
    }
}
