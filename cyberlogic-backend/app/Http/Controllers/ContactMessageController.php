<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class ContactMessageController extends Controller
{
    /**
     * Submit a contact message (Public guest access with rate-limiting).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $email = Str::lower($validated['email']);
        
        // Retrieve the client fingerprint header (defaults to IP if not provided)
        $fingerprint = $request->header('X-Client-Fingerprint') ?: $request->ip();

        // Unique rate limiting keys
        $emailLimitKey = 'contact_limit_email:' . $email;
        $fingerprintLimitKey = 'contact_limit_fingerprint:' . $fingerprint;

        // Rate Limit Configuration: 3 attempts per hour (3600 seconds)
        $maxAttempts = 3;
        $decaySeconds = 3600;

        if (RateLimiter::tooManyAttempts($emailLimitKey, $maxAttempts) || 
            RateLimiter::tooManyAttempts($fingerprintLimitKey, $maxAttempts)) {
            
            $secondsRemaining = max(
                RateLimiter::availableIn($emailLimitKey),
                RateLimiter::availableIn($fingerprintLimitKey)
            );

            $minutesRemaining = ceil($secondsRemaining / 60);

            return response()->json([
                'message' => "Too many messages sent. Please try again in {$minutesRemaining} minute(s)."
            ], 429);
        }

        // Record hits
        RateLimiter::hit($emailLimitKey, $decaySeconds);
        RateLimiter::hit($fingerprintLimitKey, $decaySeconds);

        // Save the message
        $contactMessage = ContactMessage::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'message' => $validated['message'],
            'fingerprint' => $request->header('X-Client-Fingerprint'),
            'status' => 'unread',
        ]);

        return response()->json([
            'message' => 'Your message has been sent successfully. We will review it shortly!',
            'contact_message' => $contactMessage,
        ], 201);
    }

    /**
     * Get all contact messages (Admin/Superadmin only).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Return messages sorted by newest first
        $messages = ContactMessage::orderBy('created_at', 'desc')->get();
        
        return response()->json($messages);
    }

    /**
     * Update message status (Admin/Superadmin only).
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:unread,read,archived',
        ]);

        $message = ContactMessage::findOrFail($id);
        $message->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Message status updated successfully',
            'contact_message' => $message,
        ]);
    }

    /**
     * Delete a contact message (Admin/Superadmin only).
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message = ContactMessage::findOrFail($id);
        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully',
        ]);
    }
}
