<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use App\Models\ResourceVote;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class ResourceController extends Controller
{
    /**
     * GET /api/resources
     * Return all approved resources.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Resource::with('user');

        if ($user && $user->isAdmin()) {
            if ($request->has('status')) {
                $query->where('status', $request->query('status'));
            }
        } else {
            $query->where('status', 'approved');
        }

        if ($request->has('category') && $request->query('category') !== 'All') {
            $query->where('category', $request->query('category'));
        }

        if ($request->has('q') && !empty($request->query('q'))) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        $resources = $query->orderBy('created_at', 'desc')->get();

        return response()->json($resources);
    }

    /**
     * GET /api/my-resources
     * Return all resources submitted by the authenticated user.
     */
    public function userIndex(Request $request): JsonResponse
    {
        $resources = Resource::where('user_id', $request->user()->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($resources);
    }

    /**
     * POST /api/resources
     * Submit a new resource (pending approval).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'required|string',
            'excerpt' => 'nullable|string',
            'category' => 'required|string|in:Tutorials,Documents,Tools,Links',
            'link' => 'nullable|url|max:255',
            'file' => 'nullable|file|max:20480', // max 20MB
            'icon' => 'nullable|string|max:50',
            'sections' => 'nullable|string', // JSON string
            'image' => $request->hasFile('image') 
                ? 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096' 
                : 'nullable|string',
        ]);

        $user = $request->user();
        $status = $user->isAdmin() ? 'approved' : 'pending';

        // Process sections if provided
        $sections = null;
        if (!empty($validated['sections'])) {
            $sections = json_decode($validated['sections'], true);
        }

        // Optimize cover image if provided
        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = \App\Services\ImageOptimizer::optimize($request->file('image'), 'resources');
            $imagePath = '/storage/' . $path;
        } elseif ($request->filled('image')) {
            $imagePath = $request->input('image');
        }

        $resourceData = [
            'user_id' => $user->id,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'description' => $validated['description'],
            'excerpt' => $validated['excerpt'] ?? null,
            'category' => $validated['category'],
            'link' => $validated['link'] ?? null,
            'icon' => $validated['icon'] ?? 'file-text',
            'image' => $imagePath,
            'status' => $status,
            'sections' => $sections,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('resources', 'public');
            $resourceData['file_path'] = $path;
        }

        $resource = Resource::create($resourceData);

        AuditLogger::log('created', 'Resource', $resource->id, $resource->title, [
            'status' => $status
        ], $request);

        return response()->json($resource->load('user'), 201);
    }

    /**
     * GET /api/resources/{id}
     */
    public function show(Request $request, $id): JsonResponse
    {
        $resource = Resource::with('user')->findOrFail($id);

        $now = time();
        $uniqueId = auth()->check() ? auth()->id() : $request->session()->getId();
        $lastVisitKey = "resource_last_visit:{$id}:{$uniqueId}";
        $lastVisit = Cache::get($lastVisitKey);

        if (!$lastVisit || ($now - (int)$lastVisit) >= 60) {
            $resource->increment('access_count');
        }

        Cache::put($lastVisitKey, $now, now()->addMinutes(10));

        return response()->json($resource);
    }

    /**
     * GET /api/resources/{id}/download
     */
    public function download(Request $request, $id)
    {
        $resource = Resource::findOrFail($id);
        $type = $request->query('type', 'file');

        $uniqueId = auth()->check() ? auth()->id() : $request->session()->getId();
        $cacheKey = "resource_download:{$id}:{$uniqueId}";

        if (!Cache::has($cacheKey)) {
            $resource->increment('download_count');
            Cache::put($cacheKey, true, now()->addMinutes(5));
        }

        if ($type === 'link' && $resource->link) {
            return redirect($resource->link);
        }

        if ($resource->file_path) {
            return Storage::disk('public')->download($resource->file_path);
        }

        if ($resource->link) {
            return redirect($resource->link);
        }

        return response()->json(['error' => 'Resource has no downloadable file or link.'], 404);
    }

    /**
     * PUT /api/resources/{id}
     * Update an existing resource.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $resource = Resource::findOrFail($id);
        $user = $request->user();

        // Check ownership
        if ($resource->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Forbidden. You do not own this resource.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'required|string',
            'excerpt' => 'nullable|string',
            'category' => 'required|string|in:Tutorials,Documents,Tools,Links',
            'link' => 'nullable|url|max:255',
            'file' => 'nullable|file|max:20480', // max 20MB
            'icon' => 'nullable|string|max:50',
            'sections' => 'nullable|string', // JSON string
            'image' => $request->hasFile('image') 
                ? 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096' 
                : 'nullable|string',
        ]);

        $status = $user->isAdmin() ? $resource->status : 'pending'; // Reset to pending for regular members

        // Process sections if provided
        $sections = $resource->sections;
        if (array_key_exists('sections', $validated)) {
            $sections = $validated['sections'] ? json_decode($validated['sections'], true) : null;
        }

        $resourceData = [
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'description' => $validated['description'],
            'excerpt' => $validated['excerpt'] ?? null,
            'category' => $validated['category'],
            'link' => $validated['link'] ?? null,
            'icon' => $validated['icon'] ?? $resource->icon,
            'status' => $status,
            'sections' => $sections,
        ];

        // Optimize cover image if provided
        if ($request->hasFile('image')) {
            // Delete old cover image if it exists
            if ($resource->image) {
                // Strip /storage/ prefix to delete from disk
                $oldPath = str_replace('/storage/', '', $resource->image);
                Storage::disk('public')->delete($oldPath);
            }
            $path = \App\Services\ImageOptimizer::optimize($request->file('image'), 'resources');
            $resourceData['image'] = '/storage/' . $path;
        } elseif ($request->has('image')) {
            $resourceData['image'] = $request->input('image');
        }

        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($resource->file_path) {
                Storage::disk('public')->delete($resource->file_path);
            }
            $file = $request->file('file');
            $path = $file->store('resources', 'public');
            $resourceData['file_path'] = $path;
        }

        $resource->update($resourceData);

        AuditLogger::log('updated', 'Resource', $resource->id, $resource->title, [
            'status' => $status
        ], $request);

        return response()->json($resource->load('user'));
    }

    /**
     * DELETE /api/resources/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $resource = Resource::findOrFail($id);
        $user = $request->user();

        if ($resource->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Forbidden. You do not have permission to delete this resource.'], 403);
        }

        // Delete associated files
        if ($resource->file_path) {
            Storage::disk('public')->delete($resource->file_path);
        }

        // Delete cover image if it exists and is local
        if ($resource->image && str_starts_with($resource->image, '/storage/')) {
            $imagePath = str_replace('/storage/', '', $resource->image);
            Storage::disk('public')->delete($imagePath);
        }

        // Delete images inside media blocks (sections)
        if (is_array($resource->sections)) {
            foreach ($resource->sections as $sec) {
                if (isset($sec['type']) && $sec['type'] === 'image' && isset($sec['images']) && is_array($sec['images'])) {
                    foreach ($sec['images'] as $img) {
                        if (isset($img['url']) && str_starts_with($img['url'], '/storage/')) {
                            $localPath = str_replace('/storage/', '', $img['url']);
                            Storage::disk('public')->delete($localPath);
                        }
                    }
                }
            }
        }

        $resource->delete();

        AuditLogger::log('deleted', 'Resource', $resource->id, $resource->title, null, $request);

        return response()->json(['success' => true]);
    }

    /**
     * PUT /api/admin/resources/{id}/approve
     */
    public function approve(Request $request, $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden. Admin authorization required.'], 403);
        }

        $resource = Resource::findOrFail($id);
        $resource->update(['status' => 'approved']);

        AuditLogger::log('approved', 'Resource', $resource->id, $resource->title, null, $request);

        return response()->json($resource->load('user'));
    }

    /**
     * PUT /api/admin/resources/{id}/reject
     */
    public function reject(Request $request, $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden. Admin authorization required.'], 403);
        }

        $resource = Resource::findOrFail($id);
        $resource->update(['status' => 'rejected']);

        AuditLogger::log('rejected', 'Resource', $resource->id, $resource->title, null, $request);

        return response()->json($resource->load('user'));
    }

    /**
     * POST /api/resources/{id}/vote
     */
    public function vote(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|integer|in:-1,1',
        ]);

        $resource = Resource::findOrFail($id);
        $userId = $request->user()->id;
        $value = $validated['value'];

        $existingVote = ResourceVote::where('user_id', $userId)
            ->where('resource_id', $resource->id)
            ->first();

        if ($existingVote) {
            if ($existingVote->value === (int) $value) {
                // Remove vote if same
                $existingVote->delete();
                $userVote = null;
            } else {
                // Update vote if opposite
                $existingVote->update(['value' => $value]);
                $userVote = (int) $value;
            }
        } else {
            // Create new vote
            ResourceVote::create([
                'user_id' => $userId,
                'resource_id' => $resource->id,
                'value' => $value,
            ]);
            $userVote = (int) $value;
        }

        $voteScore = (int) $resource->votes()->sum('value');

        AuditLogger::log('voted', 'Resource', $resource->id, $resource->title, [
            'value' => $value,
            'vote_score' => $voteScore,
            'user_vote' => $userVote
        ], $request);

        return response()->json([
            'vote_score' => $voteScore,
            'user_vote' => $userVote,
        ]);
    }
}
