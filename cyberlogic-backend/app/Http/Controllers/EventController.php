<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\EventAttendance;
use App\Services\AuditLogger;
use Carbon\Carbon;
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
        if (!$user || !$user->hasPermission('manage_events')) {
            abort(response()->json([
                'error' => 'Forbidden. You do not have permission to manage events.'
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
        
        // Eager load registrations and attendances count and creator user
        $events = Event::with('user')->withCount(['registrations', 'attendances'])
            ->orderBy('date', 'asc')
            ->get();

        $result = $events->map(function (Event $event) use ($user) {
            // Auto-complete check
            if ($event->status === 'upcoming') {
                $eventDateTimeStr = $event->date->format('Y-m-d') . ' ' . $event->end_time;
                $eventEnd = Carbon::parse($eventDateTimeStr);
                if ($eventEnd->isPast()) {
                    $event->status = 'completed';
                    $event->save();
                }
            }

            $isRegistered = false;
            $isAttended = false;
            if ($user) {
                $isRegistered = $event->registrations()
                    ->where('user_id', $user->id)
                    ->exists();
                $isAttended = $event->attendances()
                    ->where('user_id', $user->id)
                    ->exists();
            }

            return [
                'id' => $event->id,
                'user_id' => $event->user_id,
                'user' => $event->user,
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
                'status' => $event->status,
                'event_mode' => $event->event_mode,
                'attendance_capacity' => $event->attendance_capacity,
                'registration_start' => $event->registration_start,
                'registration_end' => $event->registration_end,
                'attendance_start' => $event->attendance_start ? substr($event->attendance_start, 0, 5) : null,
                'attendance_end' => $event->attendance_end ? substr($event->attendance_end, 0, 5) : null,
                'attendance_count' => $event->attendances_count,
                'is_attended' => $isAttended,
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
        $event = Event::with('user')->withCount(['registrations', 'attendances'])->findOrFail($id);
        $user = $request->user();

        // Auto-complete check
        if ($event->status === 'upcoming') {
            $eventDateTimeStr = $event->date->format('Y-m-d') . ' ' . $event->end_time;
            $eventEnd = Carbon::parse($eventDateTimeStr);
            if ($eventEnd->isPast()) {
                $event->status = 'completed';
                $event->save();
            }
        }

        $isRegistered = false;
        $isAttended = false;
        if ($user) {
            $isRegistered = $event->registrations()
                ->where('user_id', $user->id)
                ->exists();
            $isAttended = $event->attendances()
                ->where('user_id', $user->id)
                ->exists();
        }

        return response()->json([
            'id' => $event->id,
            'user_id' => $event->user_id,
            'user' => $event->user,
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
            'status' => $event->status,
            'event_mode' => $event->event_mode,
            'attendance_capacity' => $event->attendance_capacity,
            'registration_start' => $event->registration_start,
            'registration_end' => $event->registration_end,
            'attendance_start' => $event->attendance_start ? substr($event->attendance_start, 0, 5) : null,
            'attendance_end' => $event->attendance_end ? substr($event->attendance_end, 0, 5) : null,
            'attendance_count' => $event->attendances_count,
            'is_attended' => $isAttended,
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
            'user_id' => 'nullable|integer|exists:users,id',
            'image' => 'nullable|string|max:2048',
            'capacity' => 'nullable|integer|min:1',
            'sections' => 'nullable|array',
            'status' => 'nullable|string|in:upcoming,ongoing,completed,closed,postponed',
            'event_mode' => 'required|string|in:registration_and_attendance,attendance_only,registration_only',
            'attendance_capacity' => 'nullable|integer|min:0',
            'registration_start' => 'nullable|date',
            'registration_end' => 'nullable|date',
            'attendance_start' => 'nullable|date_format:H:i',
            'attendance_end' => 'nullable|date_format:H:i',
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

        $currentUser = $request->user();
        if ($currentUser->role === 'superadmin') {
            $targetUserId = $validated['user_id'] ?? $currentUser->id;
        } else {
            $targetUserId = $currentUser->id;
        }

        $event = Event::create([
            'user_id' => $targetUserId,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'],
            'type' => $validated['type'],
            'image' => $validated['image'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'sections' => $sections,
            'status' => $validated['status'] ?? 'upcoming',
            'event_mode' => $validated['event_mode'],
            'attendance_capacity' => $validated['attendance_capacity'] ?? null,
            'registration_start' => $validated['registration_start'] ?? null,
            'registration_end' => $validated['registration_end'] ?? null,
            'attendance_start' => $validated['attendance_start'] ?? null,
            'attendance_end' => $validated['attendance_end'] ?? null,
        ]);

        AuditLogger::log('created', 'Event', $event->id, $event->title, null, $request);

        // Generate notifications for all approved users
        try {
            $approvedUsers = \App\Models\User::where('status', 'approved')->get();
            foreach ($approvedUsers as $u) {
                $notif = \App\Models\Notification::create([
                    'user_id' => $u->id,
                    'type' => 'event',
                    'title' => 'New Event Created',
                    'body' => $event->title,
                    'data' => ['event_id' => $event->id],
                ]);

                \App\Services\RealtimeService::broadcast(
                    'notifications',
                    $notif->toArray(),
                    'new_notification',
                    $u->id
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to generate event notifications: " . $e->getMessage());
        }

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
            'user_id' => 'nullable|integer|exists:users,id',
            'image' => 'nullable|string|max:2048',
            'capacity' => 'nullable|integer|min:1',
            'sections' => 'nullable|array',
            'status' => 'nullable|string|in:upcoming,ongoing,completed,closed,postponed',
            'event_mode' => 'required|string|in:registration_and_attendance,attendance_only,registration_only',
            'attendance_capacity' => 'nullable|integer|min:0',
            'registration_start' => 'nullable|date',
            'registration_end' => 'nullable|date',
            'attendance_start' => 'nullable|date_format:H:i',
            'attendance_end' => 'nullable|date_format:H:i',
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

        $currentUser = $request->user();
        if ($currentUser->role === 'superadmin') {
            $targetUserId = $validated['user_id'] ?? ($event->user_id ?? $currentUser->id);
        } else {
            $targetUserId = $event->user_id ?? $currentUser->id;
        }

        $event->update([
            'user_id' => $targetUserId,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'],
            'type' => $validated['type'],
            'image' => $validated['image'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'sections' => $sections,
            'status' => $validated['status'] ?? $event->status,
            'event_mode' => $validated['event_mode'],
            'attendance_capacity' => $validated['attendance_capacity'] ?? null,
            'registration_start' => $validated['registration_start'] ?? null,
            'registration_end' => $validated['registration_end'] ?? null,
            'attendance_start' => $validated['attendance_start'] ?? null,
            'attendance_end' => $validated['attendance_end'] ?? null,
        ]);

        AuditLogger::log('updated', 'Event', $event->id, $event->title, null, $request);

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
        $eventId = $event->id;
        $eventTitle = $event->title;
        $event->delete();

        AuditLogger::log('deleted', 'Event', $eventId, $eventTitle, null, $request);

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
        return DB::transaction(function () use ($user, $id, $request) {
            // Lock event row to prevent race conditions exceeding capacity
            $event = Event::lockForUpdate()->findOrFail($id);

            // Check event mode
            if ($event->event_mode === 'attendance_only') {
                return response()->json(['error' => 'Registration is not enabled for this event.'], 400);
            }

            // Check event status
            if ($event->status !== 'upcoming') {
                return response()->json(['error' => "Cannot register. Event status is {$event->status}."], 400);
            }

            // Check registration timing window
            $now = now();
            $eventDateStr = $event->date->format('Y-m-d');
            
            if ($event->registration_start) {
                $registrationStart = Carbon::parse($event->registration_start);
                if ($now->lt($registrationStart)) {
                    return response()->json(['error' => 'Registration has not started yet.'], 400);
                }
            }
            if ($event->registration_end) {
                $registrationEnd = Carbon::parse($event->registration_end);
                if ($now->gt($registrationEnd)) {
                    return response()->json(['error' => 'Registration has already closed.'], 400);
                }
            }

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
            if ($event->capacity !== null) {
                $currentCount = $event->registrations()->count();
                if ($currentCount >= $event->capacity) {
                    return response()->json([
                        'error' => 'Registration failed. This event is fully booked.',
                        'attendees' => $currentCount,
                        'is_registered' => false
                    ], 400);
                }
            }

            // 3. Create registration
            $registration = EventRegistration::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
            ]);

            AuditLogger::log('registered', 'EventRegistration', $registration->id, $event->title, [
                'event_id' => $event->id
            ], $request);

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

        if ($event->status !== 'upcoming') {
            return response()->json(['error' => "Cannot cancel registration. Event status is {$event->status}."], 400);
        }

        // Delete registration
        EventRegistration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->delete();

        AuditLogger::log('unregistered', 'EventRegistration', null, $event->title, [
            'event_id' => $event->id
        ], $request);

        return response()->json([
            'success' => true,
            'message' => 'Successfully cancelled registration.',
            'attendees' => $event->registrations()->count(),
            'is_registered' => false
        ]);
    }

    /**
     * GET /api/events/{id}/attendance-qr
     * Generate a signed QR token for the authenticated user for this event.
     */
    public function generateQr(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $event = Event::findOrFail($id);

        if ($event->event_mode === 'registration_only') {
            return response()->json(['error' => 'Attendance tracking is not enabled for this event.'], 400);
        }

        // Format: event_id:user_id:timestamp
        $timestamp = time();
        $payload = "{$event->id}:{$user->id}:{$timestamp}";
        $signature = hash_hmac('sha256', $payload, config('app.key'));
        
        $token = base64_encode("{$payload}:{$signature}");

        return response()->json([
            'qr_token' => $token
        ]);
    }

    /**
     * POST /api/events/{id}/check-in
     * Admin scans QR → validates token → creates attendance record.
     */
    public function checkIn(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $event = Event::findOrFail($id);

        if ($event->event_mode === 'registration_only') {
            return response()->json(['error' => 'Attendance tracking is not enabled for this event.'], 400);
        }

        $validated = $request->validate([
            'qr_token' => 'required|string',
        ]);

        $token = base64_decode($validated['qr_token']);
        if (!$token) {
            return response()->json(['error' => 'Invalid QR Code format.'], 400);
        }

        $parts = explode(':', $token);
        if (count($parts) !== 4) {
            return response()->json(['error' => 'Invalid QR Code format.'], 400);
        }

        [$tokenEventId, $tokenUserId, $tokenTimestamp, $signature] = $parts;

        // Verify signature
        $payload = "{$tokenEventId}:{$tokenUserId}:{$tokenTimestamp}";
        $expectedSignature = hash_hmac('sha256', $payload, config('app.key'));

        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json(['error' => 'QR Code signature mismatch.'], 400);
        }

        if ((int)$tokenEventId !== (int)$event->id) {
            return response()->json(['error' => 'This QR Code is for a different event.'], 400);
        }

        if (in_array($event->status, ['completed', 'closed', 'postponed'])) {
            return response()->json(['error' => "Cannot record attendance for a {$event->status} event."], 400);
        }

        $user = \App\Models\User::findOrFail($tokenUserId);

        // Verify timing requirements
        $now = now();
        $eventDateStr = $event->date->format('Y-m-d');
        
        if ($event->attendance_start) {
            $attendanceStart = Carbon::parse($eventDateStr . ' ' . $event->attendance_start);
            if ($now->lt($attendanceStart)) {
                return response()->json(['error' => 'Attendance check-in is not open yet.'], 400);
            }
        }

        $status = 'present';
        if ($event->attendance_end) {
            $attendanceEnd = Carbon::parse($eventDateStr . ' ' . $event->attendance_end);
            if ($now->gt($attendanceEnd)) {
                $status = 'late';
            }
        }

        // Check attendance capacity
        if ($event->attendance_capacity !== null && $event->attendance_capacity > 0) {
            $currentCount = $event->attendances()->count();
            if ($currentCount >= $event->attendance_capacity) {
                $alreadyCheckedIn = $event->attendances()->where('user_id', $user->id)->exists();
                if (!$alreadyCheckedIn) {
                    return response()->json(['error' => 'Attendance capacity has been reached.'], 400);
                }
            }
        }

        // Record attendance
        $attendance = DB::transaction(function () use ($event, $user, $status, $validated, $request) {
            return EventAttendance::updateOrCreate(
                [
                    'event_id' => $event->id,
                    'user_id' => $user->id,
                ],
                [
                    'status' => $status,
                    'checked_in_at' => now(),
                    'checked_in_by' => $request->user()->id,
                    'qr_token' => $validated['qr_token'],
                ]
            );
        });

        AuditLogger::log('checked_in', 'EventAttendance', $attendance->id, "{$user->name} attended {$event->title}", [
            'event_id' => $event->id,
            'user_id' => $user->id,
            'status' => $status
        ], $request);

        // Broadcast real-time attendance update via WebSockets
        try {
            \App\Services\RealtimeService::broadcast("events:{$event->id}:attendance", [
                'event_id' => $event->id,
                'attendee' => [
                    'id' => $attendance->id,
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'status' => $status,
                    'checked_in_at' => $attendance->checked_in_at->toDateTimeString(),
                    'checked_in_by_name' => $request->user()->name,
                ]
            ]);
        } catch (\Throwable $e) {
            // Silently catch exceptions to not disrupt client check-in response
            \Illuminate\Support\Facades\Log::error("Realtime attendance broadcast failed: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully.',
            'attendee' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'status' => $status,
                'checked_in_at' => $attendance->checked_in_at->toDateTimeString(),
            ]
        ]);
    }

    /**
     * GET /api/events/{id}/attendees
     * List all attendance records for an event (admin).
     */
    public function attendees(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $event = Event::findOrFail($id);

        $attendances = $event->attendances()->with(['user', 'checkedInBy'])->get()->map(function ($att) {
            return [
                'id' => $att->id,
                'user_id' => $att->user->id,
                'name' => $att->user->name,
                'email' => $att->user->email,
                'avatar' => $att->user->avatar,
                'status' => $att->status,
                'checked_in_at' => $att->checked_in_at ? $att->checked_in_at->toDateTimeString() : null,
                'checked_in_by_name' => $att->checkedInBy ? $att->checkedInBy->name : null,
            ];
        });

        $registrations = $event->registrations()->with('user')->get()->map(function ($reg) {
            return [
                'id' => $reg->id,
                'user_id' => $reg->user->id,
                'name' => $reg->user->name,
                'email' => $reg->user->email,
                'avatar' => $reg->user->avatar,
                'registered_at' => $reg->created_at->toDateTimeString(),
            ];
        });

        return response()->json([
            'attendees' => $attendances,
            'registrations' => $registrations
        ]);
    }

    /**
     * PUT /api/events/{id}/status
     * Admin changes event status.
     */
    public function updateStatus(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:upcoming,ongoing,completed,closed,postponed',
        ]);

        $event->update([
            'status' => $validated['status']
        ]);

        AuditLogger::log('status_updated', 'Event', $event->id, "Event {$event->title} status changed to {$validated['status']}", [
            'status' => $validated['status']
        ], $request);

        return response()->json([
            'success' => true,
            'status' => $event->status,
            'message' => "Event status updated to {$event->status}."
        ]);
    }
}
