<?php

namespace App\Http\Controllers;

use App\Models\ForumCategory;
use App\Models\ForumComment;
use App\Models\ForumThread;
use App\Services\ImageOptimizer;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
        $query = ForumThread::with(['user', 'category', 'poll']);

        // Filter by category slug
        if ($request->has('category') && $request->input('category') !== 'all') {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->input('category'));
            });
        }

        // Filter by user ID
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
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
            // Default to newest: pinned first, then sorted by newest created_at desc
            $query->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'desc');
        }

        if ($request->has('page') || $request->has('limit')) {
            $limit = (int) $request->input('limit', 10);
            $page = (int) $request->input('page', 1);
            $offset = ($page - 1) * $limit;
            $total = $query->count();
            $items = $query->skip($offset)->take($limit)->get();
            return response()->json([
                'data' => $items,
                'current_page' => $page,
                'last_page' => (int) ceil($total / $limit),
                'total' => $total,
                'has_more' => $page < ceil($total / $limit)
            ]);
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/forum/threads/{id}
     * Retrieve a specific thread.
     */
    public function show($id)
    {
        $thread = ForumThread::with([
            'user',
            'category',
            'solutionComment.user',
            'poll.options.votes',
        ])->findOrFail($id);

        // Increment view count with 6-hour cooldown (using User ID or Session ID to avoid CGNAT issues)
        $identifier = auth()->check() ? auth()->id() : session()->getId();
        $cacheKey = "thread_view:{$id}:{$identifier}";

        if (!Cache::has($cacheKey)) {
            $thread->increment('views');
            Cache::put($cacheKey, true, now()->addHours(6));
        }

        // Let's add user_voted_option_id if user is authenticated
        if (auth()->check() && $thread->poll) {
            $userVote = \App\Models\ForumPollVote::where('poll_id', $thread->poll->id)
                ->where('user_id', auth()->id())
                ->first();
            $thread->poll->user_voted_option_id = $userVote ? $userVote->poll_option_id : null;
        } elseif ($thread->poll) {
            $thread->poll->user_voted_option_id = null;
        }

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
            'poll_question' => 'nullable|string|max:255',
        ]);

        $pollOptions = [];
        if ($request->has('poll_question') && !empty($request->input('poll_question'))) {
            $optionsInput = $request->input('poll_options');
            if (is_string($optionsInput)) {
                $decoded = json_decode($optionsInput, true);
                if (is_array($decoded)) {
                    $pollOptions = $decoded;
                }
            } elseif (is_array($optionsInput)) {
                $pollOptions = $optionsInput;
            }
        }

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

        if (!empty($validated['poll_question']) && count($pollOptions) >= 2) {
            $poll = \App\Models\ForumPoll::create([
                'thread_id' => $thread->id,
                'question' => $validated['poll_question'],
                'is_closed' => false,
            ]);

            foreach ($pollOptions as $optText) {
                if (!empty(trim($optText))) {
                    \App\Models\ForumPollOption::create([
                        'poll_id' => $poll->id,
                        'option_text' => trim($optText),
                    ]);
                }
            }
        }

        AuditLogger::log('created', 'ForumThread', $thread->id, $thread->title, null, $request);

        return response()->json($thread->load(['user', 'category', 'poll.options']), 201);
    }

    /**
     * PUT /api/forum/threads/{id}
     * Update an existing thread.
     */
    public function update(Request $request, $id)
    {
        $thread = ForumThread::findOrFail($id);

        $user = $request->user();
        if ($thread->user_id !== $user->id && ! $user->hasPermission('manage_forums')) {
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

        AuditLogger::log('updated', 'ForumThread', $thread->id, $thread->title, null, $request);

        return response()->json($thread->load(['user', 'category']));
    }

    /**
     * DELETE /api/forum/threads/{id}
     * Delete a thread.
     */
    public function destroy(Request $request, $id)
    {
        $thread = ForumThread::findOrFail($id);
        $threadId = $thread->id;
        $threadTitle = $thread->title;
        
        $user = $request->user();
        if ($thread->user_id !== $user->id && ! $user->hasPermission('manage_forums')) {
            return response()->json(['error' => 'Forbidden. You do not own this thread.'], 403);
        }

        $thread->delete();

        AuditLogger::log('deleted', 'ForumThread', $threadId, $threadTitle, null, $request);

        return response()->json(['success' => true]);
    }

    /**
     * PUT /api/forum/threads/{id}/pin
     * Toggle pinned status (Admin only).
     */
    public function togglePin(Request $request, $id)
    {
        $user = $request->user();
        if (! $user->hasPermission('manage_forums')) {
            return response()->json(['error' => 'Forbidden. Admin credentials required.'], 403);
        }

        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_pinned' => ! $thread->is_pinned]);

        AuditLogger::log($thread->is_pinned ? 'pinned' : 'unpinned', 'ForumThread', $thread->id, $thread->title, null, $request);

        return response()->json($thread->load(['user', 'category']));
    }

    /**
     * PUT /api/forum/threads/{id}/close
     * Toggle closed status (Admin only).
     */
    public function toggleClose(Request $request, $id)
    {
        $user = $request->user();
        if (! $user->hasPermission('manage_forums')) {
            return response()->json(['error' => 'Forbidden. Admin credentials required.'], 403);
        }

        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_closed' => ! $thread->is_closed]);

        AuditLogger::log($thread->is_closed ? 'closed' : 'reopened', 'ForumThread', $thread->id, $thread->title, null, $request);

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

            AuditLogger::log('solved', 'ForumThread', $thread->id, $thread->title, ['comment_id' => $commentId], $request);
        } else {
            // Clear solution
            $thread->update([
                'solution_comment_id' => null,
                'is_solved' => false,
            ]);

            AuditLogger::log('unsolved', 'ForumThread', $thread->id, $thread->title, null, $request);
        }

        \App\Services\RealtimeService::broadcast("forums:thread:{$thread->id}", [
            'event' => 'thread_solved',
            'solved' => (bool)$thread->is_solved,
            'solutionCommentId' => $thread->solution_comment_id
        ]);

        return response()->json($thread->load(['user', 'category', 'solutionComment.user']));
    }
}
