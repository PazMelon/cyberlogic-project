<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Services\ImageOptimizer;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AnnouncementController extends Controller
{
    /**
     * RBAC Protection Gate
     * Aborts request with 403 if user lacks required admin/officer credentials.
     */
    private function authorizeRbac(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_announcements')) {
            abort(response()->json([
                'error' => 'Forbidden. You do not have permission to manage announcements.'
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
     * GET /api/announcements
     * Retrieve all announcements.
     */
    public function index()
    {
        $announcements = Announcement::with('user')
            ->orderBy('pinned', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($announcements);
    }

    /**
     * GET /api/announcements/{id}
     * Retrieve a specific announcement.
     */
    public function show($id)
    {
        $announcement = Announcement::with('user')->findOrFail($id);
        return response()->json($announcement);
    }

    /**
     * POST /api/announcements
     * Create a new announcement.
     */
    public function store(Request $request)
    {
        $this->authorizeRbac($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'excerpt' => 'required|string|max:1000',
            'content' => 'nullable|string',
            'category' => 'required|string|in:General,Academic,Events',
            'user_id' => 'nullable|integer|exists:users,id',
            'pinned' => 'nullable|boolean',
            'sections' => 'nullable|array',
            'image' => 'nullable|string|max:2048',
        ]);

        // Process sections: sanitize html nodes for XSS protection
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
            $targetUser = \App\Models\User::find($targetUserId) ?: $currentUser;
            $authorName = $targetUser->name;
            $authorAvatar = $targetUser->avatar;
        } else {
            $targetUserId = $currentUser->id;
            $authorName = $currentUser->name;
            $authorAvatar = $currentUser->avatar;
        }

        // Map values
        $announcement = Announcement::create([
            'user_id' => $targetUserId,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'excerpt' => $validated['excerpt'],
            'content' => $validated['content'] ?? '',
            'category' => $validated['category'],
            'author' => $authorName,
            'author_avatar' => $authorAvatar,
            'date' => now()->format('M j, Y'),
            'pinned' => $validated['pinned'] ?? false,
            'sections' => $sections,
            'image' => $validated['image'] ?? null,
        ]);

        AuditLogger::log('created', 'Announcement', $announcement->id, $announcement->title, null, $request);

        // Generate notifications for all approved users
        try {
            $approvedUsers = \App\Models\User::where('status', 'approved')->get();
            foreach ($approvedUsers as $u) {
                $notif = \App\Models\Notification::create([
                    'user_id' => $u->id,
                    'type' => 'announcement',
                    'title' => 'New Announcement Published',
                    'body' => $announcement->title,
                    'data' => ['announcement_id' => $announcement->id],
                ]);

                \App\Services\RealtimeService::broadcast(
                    'notifications',
                    $notif->toArray(),
                    'new_notification',
                    $u->id
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to generate announcement notifications: " . $e->getMessage());
        }

        return response()->json($announcement, 201); // Created
    }

    /**
     * PUT /api/announcements/{id}
     * Update an announcement.
     */
    public function update(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'excerpt' => 'required|string|max:1000',
            'content' => 'nullable|string',
            'category' => 'required|string|in:General,Academic,Events',
            'user_id' => 'nullable|integer|exists:users,id',
            'pinned' => 'nullable|boolean',
            'sections' => 'nullable|array',
            'image' => 'nullable|string|max:2048',
        ]);

        // Process sections: sanitize html nodes for XSS protection
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
            $targetUserId = $validated['user_id'] ?? ($announcement->user_id ?? $currentUser->id);
            $targetUser = \App\Models\User::find($targetUserId) ?: $currentUser;
            $authorName = $targetUser->name;
            $authorAvatar = $targetUser->avatar;
        } else {
            $targetUserId = $announcement->user_id ?: $currentUser->id;
            $authorName = $announcement->author;
            $authorAvatar = $announcement->author_avatar;
        }

        $announcement->update([
            'user_id' => $targetUserId,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'excerpt' => $validated['excerpt'],
            'content' => $validated['content'] ?? '',
            'category' => $validated['category'],
            'author' => $authorName,
            'author_avatar' => $authorAvatar,
            'pinned' => $validated['pinned'] ?? false,
            'sections' => $sections,
            'image' => $validated['image'] ?? null,
        ]);

        AuditLogger::log('updated', 'Announcement', $announcement->id, $announcement->title, null, $request);

        return response()->json($announcement);
    }

    /**
     * DELETE /api/announcements/{id}
     * Delete an announcement.
     */
    public function destroy(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $announcement = Announcement::findOrFail($id);
        $annId = $announcement->id;
        $annTitle = $announcement->title;
        $announcement->delete();

        AuditLogger::log('deleted', 'Announcement', $annId, $annTitle, null, $request);

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/announcements/upload-image
     * Securely store an image file under public assets.
     */
    public function uploadImage(Request $request)
    {
        $this->authorizeRbac($request);

        // Server-side size limits & mime-type binary verification (prevents PHP shells masquerading as images)
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,jpg,gif|max:5120',
        ]);

        if ($request->file('image')->isValid()) {
            // Use global optimizer service
            $path = ImageOptimizer::optimize($request->file('image'), 'announcements');
            
            AuditLogger::log('uploaded', 'Announcement', null, 'Announcement Image', ['path' => $path], $request);

            return response()->json([
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['error' => 'Failed to upload image.'], 400);
    }
}
