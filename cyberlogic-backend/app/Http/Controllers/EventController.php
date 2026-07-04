<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    /**
     * RBAC Protection Gate
     * Aborts request with 403 if user lacks required admin/officer credentials.
     */
    private function authorizeRbac(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'superadmin', 'officer'])) {
            abort(response()->json([
                'error' => 'Forbidden. Write permissions are restricted to officers and administrators.'
            ], 403));
        }
    }

    /**
     * XSS Scrubber
     * Sanitizes HTML contentEditable nodes to remove script blocks, event listeners, and javascript links.
     */
    private function sanitizeHtml(?string $html): string
    {
        if (empty($html)) {
            return '';
        }
        // 1. Scrub script tags and inner contents
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        // 2. Scrub event hooks (onclick, onerror, onload, onmouseover, etc.)
        $html = preg_replace('/on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
        $html = preg_replace('/on\w+\s*=\s*\S+/i', '', $html);
        // 3. Scrub javascript: link handlers
        $html = preg_replace('/href\s*=\s*["\']\s*javascript:[^"\']*["\']/i', '', $html);
        
        return $html;
    }

    /**
     * GET /api/events
     * Retrieve all events.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Eager load registrations count
        $events = Event::withCount('registrations')
            ->orderBy('date', 'asc')
            ->get();

        $result = $events->map(function (Event $event) use ($user) {
            $isRegistered = false;
            if ($user) {
                $isRegistered = $event->registrations()
                    ->where('user_id', $user->id)
                    ->exists();
            }

            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => $event->date->format('Y-m-d'),
                'start_time' => substr($event->start_time, 0, 5),
                'end_time' => substr($event->end_time, 0, 5),
                'location' => $event->location,
                'type' => $event->type,
                'image' => $event->image,
                'capacity' => $event->capacity,
                'attendees' => $event->registrations_count,
                'is_registered' => $isRegistered,
                'sections' => $event->sections ?: [],
            ];
        });

        return response()->json($result);
    }

    /**
     * GET /api/events/{id}
     * Retrieve a specific event.
     */
    public function show(Request $request, $id)
    {
        $event = Event::withCount('registrations')->findOrFail($id);
        $user = $request->user();

        $isRegistered = false;
        if ($user) {
            $isRegistered = $event->registrations()
                ->where('user_id', $user->id)
                ->exists();
        }

        return response()->json([
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'date' => $event->date->format('Y-m-d'),
            'start_time' => substr($event->start_time, 0, 5),
            'end_time' => substr($event->end_time, 0, 5),
            'location' => $event->location,
            'type' => $event->type,
            'image' => $event->image,
            'capacity' => $event->capacity,
            'attendees' => $event->registrations_count,
            'is_registered' => $isRegistered,
            'sections' => $event->sections ?: [],
        ]);
    }

    /**
     * POST /api/events
     * Create a new event.
     */
    public function store(Request $request)
    {
        $this->authorizeRbac($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'date' => 'required|date_format:Y-m-d',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
            'type' => 'required|string|in:Workshop,Seminar,Competition,Social,Meeting',
            'image' => 'nullable|string|max:2048',
            'capacity' => 'nullable|integer|min:1',
            'sections' => 'nullable|array',
        ]);

        // Process sections: sanitize html text blocks for XSS protection
        $sections = $request->input('sections', []);
        if (is_array($sections)) {
            foreach ($sections as &$section) {
                if (isset($section['type']) && $section['type'] === 'text' && isset($section['html'])) {
                    $section['html'] = $this->sanitizeHtml($section['html']);
                }
            }
        }

        $event = Event::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'],
            'type' => $validated['type'],
            'image' => $validated['image'] ?? null,
            'capacity' => $validated['capacity'] ?? 50,
            'sections' => $sections,
        ]);

        return response()->json($event, 201);
    }

    /**
     * PUT /api/events/{id}
     * Update an event.
     */
    public function update(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'date' => 'required|date_format:Y-m-d',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
            'type' => 'required|string|in:Workshop,Seminar,Competition,Social,Meeting',
            'image' => 'nullable|string|max:2048',
            'capacity' => 'nullable|integer|min:1',
            'sections' => 'nullable|array',
        ]);

        // Process sections: sanitize html text blocks for XSS protection
        $sections = $request->input('sections', []);
        if (is_array($sections)) {
            foreach ($sections as &$section) {
                if (isset($section['type']) && $section['type'] === 'text' && isset($section['html'])) {
                    $section['html'] = $this->sanitizeHtml($section['html']);
                }
            }
        }

        $event->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'],
            'type' => $validated['type'],
            'image' => $validated['image'] ?? null,
            'capacity' => $validated['capacity'] ?? 50,
            'sections' => $sections,
        ]);

        return response()->json($event);
    }

    /**
     * DELETE /api/events/{id}
     * Delete an event.
     */
    public function destroy(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $event = Event::findOrFail($id);
        $event->delete();

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/events/{id}/register
     * Register the authenticated user for an event (RSVP).
     */
    public function register(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        // Perform capacity verification and registration inside a transaction
        return DB::transaction(function () use ($user, $id) {
            // Lock event row to prevent race conditions exceeding capacity
            $event = Event::lockForUpdate()->findOrFail($id);

            // 1. Check if already registered
            $exists = EventRegistration::where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'error' => 'You are already registered for this event.',
                    'attendees' => $event->registrations()->count(),
                    'is_registered' => true
                ], 400);
            }

            // 2. Check capacity
            $currentCount = $event->registrations()->count();
            if ($currentCount >= $event->capacity) {
                return response()->json([
                    'error' => 'Registration failed. This event is fully booked.',
                    'attendees' => $currentCount,
                    'is_registered' => false
                ], 400);
            }

            // 3. Create registration
            EventRegistration::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully registered for the event.',
                'attendees' => $event->registrations()->count(),
                'is_registered' => true
            ]);
        });
    }

    /**
     * POST /api/events/{id}/unregister
     * Cancel the authenticated user's registration for an event.
     */
    public function unregister(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $event = Event::findOrFail($id);

        // Delete registration
        EventRegistration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Successfully cancelled registration.',
            'attendees' => $event->registrations()->count(),
            'is_registered' => false
        ]);
    }
}
