<?php

namespace App\Http\Controllers;

use App\Models\Officer;
use App\Services\ImageOptimizer;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficerController extends Controller
{
    /**
     * RBAC Protection Gate
     */
    private function authorizeRbac(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_settings')) {
            abort(response()->json([
                'error' => 'Forbidden. You do not have permission to manage site settings.'
            ], 403));
        }
    }

    /**
     * GET /api/officers
     * Public endpoint to get resolved officers list.
     */
    public function index(): JsonResponse
    {
        $officers = Officer::with('user')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $resolved = $officers->map(function ($officer) {
            return [
                'id' => $officer->id,
                'name' => $officer->name,
                'role' => $officer->role,
                'department' => $officer->department,
                'year_level' => $officer->year_level,
                'bio' => $officer->bio,
                'expertise' => $officer->expertise,
                'avatar' => $officer->avatar,
                'email' => $officer->email,
                'github' => $officer->github,
                'linkedin' => $officer->linkedin,
                'facebook' => $officer->facebook,
                'instagram' => $officer->instagram,
                'wechat' => $officer->wechat,
                'tiktok' => $officer->tiktok,
                'twitter' => $officer->twitter,
                'reddit' => $officer->reddit,
                'sort_order' => $officer->sort_order,
                'user_id' => $officer->user_id,
                'username' => $officer->username,
            ];
        });

        return response()->json($resolved);
    }

    /**
     * GET /api/officers/{id}
     * Public endpoint to get resolved single officer profile.
     */
    public function show($id): JsonResponse
    {
        $officer = Officer::with('user')->findOrFail($id);

        return response()->json([
            'id' => $officer->id,
            'name' => $officer->name,
            'role' => $officer->role,
            'department' => $officer->department,
            'year_level' => $officer->year_level,
            'bio' => $officer->bio,
            'expertise' => $officer->expertise,
            'avatar' => $officer->avatar,
            'email' => $officer->email,
            'github' => $officer->github,
            'linkedin' => $officer->linkedin,
            'facebook' => $officer->facebook,
            'instagram' => $officer->instagram,
            'wechat' => $officer->wechat,
            'tiktok' => $officer->tiktok,
            'twitter' => $officer->twitter,
            'reddit' => $officer->reddit,
            'sort_order' => $officer->sort_order,
            'user_id' => $officer->user_id,
            'username' => $officer->username,
        ]);
    }

    /**
     * GET /api/admin/officers
     * Admin endpoint to get list of officers with raw settings.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $this->authorizeRbac($request);

        $officers = Officer::with('user')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json($officers);
    }

    /**
     * POST /api/admin/officers
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeRbac($request);

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'use_profile_info' => 'required|boolean',
            'display_name' => 'nullable|string|max:255',
            'display_role' => 'nullable|string|max:255',
            'display_department' => 'nullable|string|max:255',
            'display_year_level' => 'nullable|string|max:255',
            'display_bio' => 'nullable|string',
            'display_avatar' => 'nullable|string|max:2048',
            'display_email' => 'nullable|email|max:255',
            'display_github' => 'nullable|string|max:255',
            'display_linkedin' => 'nullable|string|max:255',
            'display_facebook' => 'nullable|string|max:255',
            'display_instagram' => 'nullable|string|max:255',
            'display_wechat' => 'nullable|string|max:255',
            'display_tiktok' => 'nullable|string|max:255',
            'display_twitter' => 'nullable|string|max:255',
            'display_reddit' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        if (!isset($validated['sort_order'])) {
            $validated['sort_order'] = Officer::max('sort_order') + 1;
        }

        $officer = Officer::create($validated);

        AuditLogger::log('created', 'Officer', $officer->id, $officer->name, null, $request);

        return response()->json($this->formatOfficerResponse($officer));
    }

    /**
     * PUT /api/admin/officers/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $this->authorizeRbac($request);

        $officer = Officer::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'use_profile_info' => 'required|boolean',
            'display_name' => 'nullable|string|max:255',
            'display_role' => 'nullable|string|max:255',
            'display_department' => 'nullable|string|max:255',
            'display_year_level' => 'nullable|string|max:255',
            'display_bio' => 'nullable|string',
            'display_avatar' => 'nullable|string|max:2048',
            'display_email' => 'nullable|email|max:255',
            'display_github' => 'nullable|string|max:255',
            'display_linkedin' => 'nullable|string|max:255',
            'display_facebook' => 'nullable|string|max:255',
            'display_instagram' => 'nullable|string|max:255',
            'display_wechat' => 'nullable|string|max:255',
            'display_tiktok' => 'nullable|string|max:255',
            'display_twitter' => 'nullable|string|max:255',
            'display_reddit' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $officer->update($validated);

        AuditLogger::log('updated', 'Officer', $officer->id, $officer->name, null, $request);

        return response()->json($this->formatOfficerResponse($officer));
    }

    /**
     * Helper to format officer model array for clean JSON responses without serialization traps.
     */
    private function formatOfficerResponse(Officer $officer): array
    {
        $officer->fresh()->load('user');
        return [
            'id' => $officer->id,
            'user_id' => $officer->user_id,
            'use_profile_info' => (bool)$officer->use_profile_info,
            'display_name' => $officer->display_name,
            'display_role' => $officer->display_role,
            'display_department' => $officer->display_department,
            'display_year_level' => $officer->display_year_level,
            'display_bio' => $officer->display_bio,
            'display_avatar' => $officer->display_avatar,
            'display_email' => $officer->display_email,
            'display_github' => $officer->display_github,
            'display_linkedin' => $officer->display_linkedin,
            'display_facebook' => $officer->display_facebook,
            'display_instagram' => $officer->display_instagram,
            'display_wechat' => $officer->display_wechat,
            'display_tiktok' => $officer->display_tiktok,
            'display_twitter' => $officer->display_twitter,
            'display_reddit' => $officer->display_reddit,
            'sort_order' => (int)$officer->sort_order,
            'name' => (string)($officer->name ?? ''),
            'role' => (string)($officer->role ?? ''),
            'department' => $officer->department,
            'year_level' => $officer->year_level,
            'bio' => $officer->bio,
            'expertise' => is_array($officer->expertise) ? array_values($officer->expertise) : [],
            'avatar' => (string)($officer->avatar ?? ''),
            'email' => $officer->email,
            'github' => $officer->github,
            'linkedin' => $officer->linkedin,
            'facebook' => $officer->facebook,
            'instagram' => $officer->instagram,
            'wechat' => $officer->wechat,
            'tiktok' => $officer->tiktok,
            'twitter' => $officer->twitter,
            'reddit' => $officer->reddit,
            'username' => $officer->username,
        ];
    }

    /**
     * DELETE /api/admin/officers/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $this->authorizeRbac($request);

        $officer = Officer::findOrFail($id);
        $offId = $officer->id;
        $offName = $officer->name;
        $oldAvatar = $officer->display_avatar;

        $officer->delete();

        if ($oldAvatar) {
            $this->deleteOldAvatarStorageFile($oldAvatar);
        }

        AuditLogger::log('deleted', 'Officer', $offId, $offName, null, $request);

        return response()->json(['success' => true]);
    }

    /**
     * Clean up unused officer avatar files from storage disk.
     */
    private function deleteOldAvatarStorageFile(?string $path): void
    {
        if (empty($path)) return;

        // Clean path of domain and storage/ prefixes
        $cleanPath = preg_replace('#^https?://[^/]+/#', '', $path);
        $cleanPath = ltrim($cleanPath, '/');
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        if (!empty($cleanPath) && \Illuminate\Support\Facades\Storage::disk('public')->exists($cleanPath)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($cleanPath);
        }
    }

    /**
     * PUT /api/admin/officers/reorder
     */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorizeRbac($request);

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:officers,id',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Officer::where('id', $id)->update(['sort_order' => $index]);
        }

        AuditLogger::log('updated', 'Officer', null, 'Officer sort order', ['ids' => $validated['ids']], $request);

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/admin/officers/upload-avatar
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $this->authorizeRbac($request);

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,jpg,gif|max:5120',
        ]);

        if ($request->file('image')->isValid()) {
            $path = ImageOptimizer::optimize($request->file('image'), 'officers');
            
            AuditLogger::log('uploaded', 'Officer', null, 'Officer Avatar Image', ['path' => $path], $request);

            return response()->json([
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['error' => 'Failed to upload avatar.'], 400);
    }
}
