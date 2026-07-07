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
    public function index(): JsonResponse
    {
        $channels = ChatChannel::all();

        if ($channels->isEmpty()) {
            $defaultChannels = [
                [
                    'name' => 'General',
                    'slug' => 'general',
                    'description' => 'General chat and discussion for all members.',
                    'type' => 'group',
                ],
                [
                    'name' => 'Announcements',
                    'slug' => 'announcements',
                    'description' => 'Realtime announcement stream and updates.',
                    'type' => 'group',
                ],
                [
                    'name' => 'Events',
                    'slug' => 'events',
                    'description' => 'Chat and updates about upcoming club events.',
                    'type' => 'group',
                ],
            ];

            foreach ($defaultChannels as $chan) {
                ChatChannel::create($chan);
            }

            $channels = ChatChannel::all();
        }

        return response()->json($channels);
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
}
