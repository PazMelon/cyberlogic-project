<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use App\Models\ResourceVote;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'description' => 'required|string',
            'category' => 'required|string|in:Tutorials,Documents,Tools,Links',
            'link' => 'nullable|url|max:255',
            'file' => 'nullable|file|max:10240', // max 10MB
            'icon' => 'nullable|string|max:50',
        ]);

        $user = $request->user();
        $status = $user->isAdmin() ? 'approved' : 'pending';

        $resourceData = [
            'user_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'link' => $validated['link'] ?? null,
            'icon' => $validated['icon'] ?? 'file-text',
            'status' => $status,
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
    public function show($id): JsonResponse
    {
        $resource = Resource::with('user')->findOrFail($id);
        return response()->json($resource);
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
            'description' => 'required|string',
            'category' => 'required|string|in:Tutorials,Documents,Tools,Links',
            'link' => 'nullable|url|max:255',
            'file' => 'nullable|file|max:10240', // max 10MB
            'icon' => 'nullable|string|max:50',
        ]);

        $status = $user->isAdmin() ? $resource->status : 'pending'; // Reset to pending for regular members

        $resourceData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'link' => $validated['link'] ?? null,
            'icon' => $validated['icon'] ?? $resource->icon,
            'status' => $status,
        ];

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
