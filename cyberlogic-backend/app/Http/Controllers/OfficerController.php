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
                'bio' => $officer->bio,
                'avatar' => $officer->avatar,
                'email' => $officer->email,
                'github' => $officer->github,
                'linkedin' => $officer->linkedin,
                'sort_order' => $officer->sort_order,
                'user_id' => $officer->user_id,
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
            'bio' => $officer->bio,
            'avatar' => $officer->avatar,
            'email' => $officer->email,
            'github' => $officer->github,
            'linkedin' => $officer->linkedin,
            'sort_order' => $officer->sort_order,
            'user_id' => $officer->user_id,
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
            'display_bio' => 'nullable|string',
            'display_avatar' => 'nullable|string|max:2048',
            'display_email' => 'nullable|email|max:255',
            'display_github' => 'nullable|string|max:255',
            'display_linkedin' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        if (!isset($validated['sort_order'])) {
            $validated['sort_order'] = Officer::max('sort_order') + 1;
        }

        $officer = Officer::create($validated);

        AuditLogger::log('created', 'Officer', $officer->id, $officer->name, null, $request);

        return response()->json($officer);
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
            'display_bio' => 'nullable|string',
            'display_avatar' => 'nullable|string|max:2048',
            'display_email' => 'nullable|email|max:255',
            'display_github' => 'nullable|string|max:255',
            'display_linkedin' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $officer->update($validated);

        AuditLogger::log('updated', 'Officer', $officer->id, $officer->name, null, $request);

        return response()->json($officer);
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
        $officer->delete();

        AuditLogger::log('deleted', 'Officer', $offId, $offName, null, $request);

        return response()->json(['success' => true]);
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
