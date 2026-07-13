<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProject;
use App\Models\UserGalleryPhoto;
use App\Services\ImageOptimizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileShowcaseController extends Controller
{
    // ─── Projects ────────────────────────────────────────────────────────────────

    /**
     * GET /api/user/projects
     * List the authenticated user's projects.
     */
    public function myProjects(Request $request): JsonResponse
    {
        $projects = $request->user()
            ->projects()
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($projects);
    }

    /**
     * GET /api/users/{userId}/projects
     * List a user's projects (public).
     */
    public function userProjects($userId): JsonResponse
    {
        $user = User::where('status', 'approved')->findOrFail($userId);

        $projects = $user->projects()
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($projects);
    }

    /**
     * POST /api/user/projects
     * Create a new project.
     */
    public function storeProject(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'link' => ['nullable', 'string', 'max:500', 'url'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['string', 'max:500'],
        ]);

        $project = $user->projects()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'link' => $validated['link'] ?? null,
            'images' => $validated['images'] ?? [],
            'sort_order' => $user->projects()->count(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully.',
            'project' => $project,
        ], 201);
    }

    /**
     * PUT /api/user/projects/{id}
     * Update an existing project.
     */
    public function updateProject(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $project = $user->projects()->findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'link' => ['nullable', 'string', 'max:500', 'url'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['string', 'max:500'],
        ]);

        // Delete removed images from storage
        $oldImages = $project->images ?? [];
        $newImages = $validated['images'] ?? [];
        $removedImages = array_diff($oldImages, $newImages);
        foreach ($removedImages as $removedPath) {
            Storage::disk('public')->delete($removedPath);
        }

        $project->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'link' => $validated['link'] ?? null,
            'images' => $newImages,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully.',
            'project' => $project->fresh(),
        ]);
    }

    /**
     * DELETE /api/user/projects/{id}
     * Delete a project and cleanup its images.
     */
    public function destroyProject(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $project = $user->projects()->findOrFail($id);

        // Cleanup images from storage
        if ($project->images && is_array($project->images)) {
            foreach ($project->images as $imagePath) {
                Storage::disk('public')->delete($imagePath);
            }
        }

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully.',
        ]);
    }

    /**
     * POST /api/user/projects/upload-image
     * Upload a single project image and return the storage path.
     */
    public function uploadProjectImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp,jpg,gif', 'max:5120'],
        ]);

        $path = ImageOptimizer::optimize($request->file('image'), 'projects');

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }

    // ─── Gallery ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/user/gallery
     * List the authenticated user's gallery photos.
     */
    public function myGallery(Request $request): JsonResponse
    {
        $photos = $request->user()
            ->galleryPhotos()
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($photos);
    }

    /**
     * GET /api/users/{userId}/gallery
     * List a user's gallery photos (public).
     */
    public function userGallery($userId): JsonResponse
    {
        $user = User::where('status', 'approved')->findOrFail($userId);

        $photos = $user->galleryPhotos()
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($photos);
    }

    /**
     * POST /api/user/gallery
     * Upload a new gallery photo (enforces 30 limit).
     */
    public function storeGalleryPhoto(Request $request): JsonResponse
    {
        $user = $request->user();

        // Enforce 50 photo limit
        $currentCount = $user->galleryPhotos()->count();
        if ($currentCount >= 50) {
            return response()->json([
                'error' => 'Gallery limit reached. You can upload a maximum of 50 photos.',
            ], 422);
        }

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp,jpg,gif', 'max:5120'],
            'caption' => ['nullable', 'string', 'max:255'],
        ]);

        $path = ImageOptimizer::optimize($request->file('image'), 'gallery');

        $photo = $user->galleryPhotos()->create([
            'image_path' => $path,
            'caption' => $request->input('caption'),
            'sort_order' => $currentCount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully.',
            'photo' => $photo,
        ], 201);
    }

    /**
     * PUT /api/user/gallery/{id}
     * Update a gallery photo's caption.
     */
    public function updateGalleryPhoto(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $photo = $user->galleryPhotos()->findOrFail($id);

        $validated = $request->validate([
            'caption' => ['nullable', 'string', 'max:255'],
        ]);

        $photo->update([
            'caption' => $validated['caption'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Photo updated successfully.',
            'photo' => $photo->fresh(),
        ]);
    }

    /**
     * DELETE /api/user/gallery/{id}
     * Delete a gallery photo and cleanup storage file.
     */
    public function destroyGalleryPhoto(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $photo = $user->galleryPhotos()->findOrFail($id);

        // Cleanup file from storage
        Storage::disk('public')->delete($photo->image_path);

        $photo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Photo deleted successfully.',
        ]);
    }
}
