<?php

namespace App\Http\Controllers;

use App\Models\ForumCategory;
use App\Models\ForumComment;
use App\Models\ForumThread;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;

class ForumThreadController extends Controller
{
    /**
     * XSS Scrubber
     */
    private function sanitizeHtml(?string $html): string
    {
        if (empty($html)) {
            return '';
        }
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $html = preg_replace('/on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
        $html = preg_replace('/on\w+\s*=\s*\S+/i', '', $html);
        $html = preg_replace('/href\s*=\s*["\']\s*javascript:[^"\']*["\']/i', '', $html);

        return $html;
    }

    /**
     * GET /api/forum/threads
     * Retrieve all threads.
     */
    public function index(Request $request)
    {
        $query = ForumThread::with(['user', 'category']);

        // Filter by category slug
        if ($request->has('category') && $request->input('category') !== 'all') {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->input('category'));
            });
        }

        // Search by title or content
        if ($request->has('q') && ! empty($request->input('q'))) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Sort
        $sort = $request->input('sort', 'newest');
        if ($sort === 'popular') {
            // Sort by pinned, then engagement: views + comments count * 3 + votes count * 2
            // Since counting relations in raw SQL is complex, we can use a subselect or approximation
            $query->orderBy('is_pinned', 'desc')
                ->orderByRaw('(views + (select count(*) from forum_comments where thread_id = forum_threads.id) * 3 + (select coalesce(sum(value), 0) from forum_votes where voteable_type = "App\\\\Models\\\\ForumThread" and voteable_id = forum_threads.id) * 2) desc')
                ->orderBy('id', 'desc');
        } elseif ($sort === 'oldest') {
            $query->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'asc');
        } else {
            // Default: newest
            $query->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'desc');
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/forum/threads/{id}
     * Retrieve a specific thread.
     */
    public function show($id)
    {
        $thread = ForumThread::with(['user', 'category', 'solutionComment.user'])->findOrFail($id);

        // Increment view count
        $thread->increment('views');

        return response()->json($thread);
    }

    /**
     * POST /api/forum/threads
     * Create a new thread.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'required|exists:forum_categories,id',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:4096',
            'is_spoiler' => 'nullable',
            'is_redacted' => 'nullable',
        ]);

        $imagesPaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = ImageOptimizer::optimize($file, 'forum');
                $imagesPaths[] = '/storage/'.$path;
            }
        }

        $thread = ForumThread::create([
            'title' => $validated['title'],
            'content' => $this->sanitizeHtml($validated['content']),
            'category_id' => $validated['category_id'],
            'user_id' => $request->user()->id,
            'views' => 0,
            'is_pinned' => false,
            'is_solved' => false,
            'is_closed' => false,
            'is_spoiler' => filter_var($request->input('is_spoiler'), FILTER_VALIDATE_BOOLEAN),
            'is_redacted' => filter_var($request->input('is_redacted'), FILTER_VALIDATE_BOOLEAN),
            'images' => ! empty($imagesPaths) ? $imagesPaths : null,
        ]);

        return response()->json($thread->load(['user', 'category']), 201);
    }

    /**
     * PUT /api/forum/threads/{id}
     * Update an existing thread.
     */
    public function update(Request $request, $id)
    {
        $thread = ForumThread::findOrFail($id);

        $user = $request->user();
        if ($thread->user_id !== $user->id && ! in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['error' => 'Forbidden. You do not own this thread.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'required|exists:forum_categories,id',
        ]);

        $thread->update([
            'title' => $validated['title'],
            'content' => $this->sanitizeHtml($validated['content']),
            'category_id' => $validated['category_id'],
        ]);

        return response()->json($thread->load(['user', 'category']));
    }

    /**
     * DELETE /api/forum/threads/{id}
     * Delete a thread.
     */
    public function destroy(Request $request, $id)
    {
        $thread = ForumThread::findOrFail($id);

        $user = $request->user();
        if ($thread->user_id !== $user->id && ! in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['error' => 'Forbidden. You do not own this thread.'], 403);
        }

        $thread->delete();

        return response()->json(['success' => true]);
    }

    /**
     * PUT /api/forum/threads/{id}/pin
     * Toggle pinned status (Admin only).
     */
    public function togglePin(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['error' => 'Forbidden. Admin credentials required.'], 403);
        }

        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_pinned' => ! $thread->is_pinned]);

        return response()->json($thread->load(['user', 'category']));
    }

    /**
     * PUT /api/forum/threads/{id}/close
     * Toggle closed status (Admin only).
     */
    public function toggleClose(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['error' => 'Forbidden. Admin credentials required.'], 403);
        }

        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_closed' => ! $thread->is_closed]);

        return response()->json($thread->load(['user', 'category']));
    }

    /**
     * PUT /api/forum/threads/{id}/solve
     * Toggle solved and select/clear the solution comment (Owner only).
     */
    public function toggleSolve(Request $request, $id)
    {
        $thread = ForumThread::findOrFail($id);
        $user = $request->user();

        // Check ownership
        if ($thread->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden. Only the post author can mark this as solved.'], 403);
        }

        // Verify category type is support
        $category = ForumCategory::findOrFail($thread->category_id);
        if ($category->type !== 'support') {
            return response()->json(['error' => 'Invalid action. Solved status is restricted to support categories.'], 422);
        }

        $validated = $request->validate([
            'comment_id' => 'nullable|integer',
        ]);

        $commentId = $validated['comment_id'];

        if ($commentId) {
            // Verify comment belongs to this thread
            $comment = ForumComment::where('thread_id', $thread->id)->findOrFail($commentId);
            $thread->update([
                'solution_comment_id' => $comment->id,
                'is_solved' => true,
            ]);
        } else {
            // Clear solution
            $thread->update([
                'solution_comment_id' => null,
                'is_solved' => false,
            ]);
        }

        return response()->json($thread->load(['user', 'category', 'solutionComment.user']));
    }
}
