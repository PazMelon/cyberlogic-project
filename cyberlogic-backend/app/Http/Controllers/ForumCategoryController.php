<?php

namespace App\Http\Controllers;

use App\Models\ForumCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ForumCategoryController extends Controller
{
    /**
     * GET /api/forum/categories
     * Retrieve all forum categories ordered by sort_order.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ForumCategory::orderBy('sort_order', 'asc');

        // Non-admins can only see visible categories
        if (! $user || ! in_array($user->role, ['admin', 'superadmin'])) {
            $query->where('is_visible', true);
        }

        $categories = $query->get();

        // If General category doesn't exist, let's auto-seed it as a fallback
        if ($categories->isEmpty()) {
            $general = ForumCategory::create([
                'name' => 'General Discussion',
                'slug' => 'general',
                'description' => 'Chat about anything club-related',
                'color' => 'primary',
                'type' => 'discussion',
                'icon' => 'MessageSquare',
                'is_visible' => true,
                'allow_solved' => false,
                'sort_order' => 1,
            ]);
            $categories = collect([$general]);
        }

        return response()->json($categories);
    }

    /**
     * POST /api/admin/forum/categories
     * Create a new forum category (Admin/Superadmin only).
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (! in_array($currentUser->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'color' => 'required|string|max:30',
            'type' => 'required|string|in:discussion,support',
            'icon' => 'nullable|string|max:50',
            'is_visible' => 'required|boolean',
            'allow_solved' => 'required|boolean',
            'rules' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        // Ensure unique slug
        $count = 1;
        $originalSlug = $validated['slug'];
        while (ForumCategory::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug.'-'.$count++;
        }

        // Set next sort order
        $maxSort = ForumCategory::max('sort_order') ?: 0;
        $validated['sort_order'] = $maxSort + 1;

        $category = ForumCategory::create($validated);

        return response()->json($category, 201);
    }

    /**
     * PUT /api/admin/forum/categories/{id}
     * Update an existing category (Admin/Superadmin only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (! in_array($currentUser->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $category = ForumCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'color' => 'required|string|max:30',
            'type' => 'required|string|in:discussion,support',
            'icon' => 'nullable|string|max:50',
            'is_visible' => 'required|boolean',
            'allow_solved' => 'required|boolean',
            'rules' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        // Ensure unique slug (ignoring current category)
        $count = 1;
        $originalSlug = $validated['slug'];
        while (ForumCategory::where('slug', $validated['slug'])->where('id', '!=', $id)->exists()) {
            $validated['slug'] = $originalSlug.'-'.$count++;
        }

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * DELETE /api/admin/forum/categories/{id}
     * Delete a category and reassign all threads to the General category.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        if (! in_array($currentUser->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $category = ForumCategory::findOrFail($id);

        // Prevent deletion of General category
        if ($category->slug === 'general') {
            return response()->json(['message' => 'The default General category cannot be deleted.'], 422);
        }

        // Find or create default general category to hold reassigned threads
        $general = ForumCategory::where('slug', 'general')->first();
        if (! $general) {
            $general = ForumCategory::create([
                'name' => 'General Discussion',
                'slug' => 'general',
                'description' => 'Chat about anything club-related',
                'color' => 'primary',
                'type' => 'discussion',
                'icon' => 'MessageSquare',
                'is_visible' => true,
                'allow_solved' => false,
                'sort_order' => 1,
            ]);
        }

        // Reassign threads
        DB::transaction(function () use ($category, $general) {
            $category->threads()->update(['category_id' => $general->id]);
            $category->delete();
        });

        return response()->json(['message' => 'Category deleted successfully, threads reassigned to General']);
    }

    /**
     * PUT /api/admin/forum/categories/reorder
     * Reorder categories sort_order based on drag and drop payload list of IDs.
     */
    public function reorder(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (! in_array($currentUser->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:forum_categories,id',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $index => $id) {
                ForumCategory::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['message' => 'Category sorting updated successfully']);
    }
}
