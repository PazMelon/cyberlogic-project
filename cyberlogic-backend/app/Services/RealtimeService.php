<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeService
{
    /**
     * Broadcast an event payload to the Node.js WebSocket server.
     *
     * @param  string  $channel  The target channel name (e.g. 'announcements', 'events', 'notifications:1')
     * @param  array  $payload  The event payload to broadcast
     * @return bool True if broadcast was successful
     */
    public static function broadcast(string $channel, array $payload): bool
    {
        $url = config('services.realtime.url').'/internal/broadcast';
        $secret = config('services.realtime.secret');

        try {
            $response = Http::withHeaders([
                'X-Realtime-Secret' => $secret,
            ])->post($url, [
                'channel' => $channel,
                'payload' => $payload,
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning("Realtime broadcast failed: Server returned {$response->status()} - {$response->body()}");

            return false;
        } catch (\Throwable $e) {
            Log::error("Realtime broadcast connection error: {$e->getMessage()}");

            return false;
        }
    }
}
