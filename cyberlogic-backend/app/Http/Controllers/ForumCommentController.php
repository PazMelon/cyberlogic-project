<?php

namespace App\Http\Controllers;

use App\Models\ForumComment;
use App\Models\ForumThread;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class ForumCommentController extends Controller
{
    /**
     * GET /api/forum/threads/{threadId}/comments
     * Retrieve all comments for a thread as a flat list.
     */
    public function index($threadId)
    {
        $comments = ForumComment::with('user')
            ->where('thread_id', $threadId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($comments);
    }

    /**
     * POST /api/forum/threads/{threadId}/comments
     * Post a comment or a reply to a comment.
     */
    public function store(Request $request, $threadId)
    {
        $thread = ForumThread::findOrFail($threadId);

        if ($thread->is_closed) {
            return response()->json(['error' => 'Forbidden. This thread is closed and no longer accepting comments.'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|integer|exists:forum_comments,id',
            'is_spoiler' => 'nullable|boolean',
            'is_redacted' => 'nullable|boolean',
        ]);

        // If parent_id is provided, verify it belongs to the same thread
        if (! empty($validated['parent_id'])) {
            $parent = ForumComment::where('thread_id', $threadId)->findOrFail($validated['parent_id']);
        }

        $comment = ForumComment::create([
            'thread_id' => $threadId,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
            'is_best_answer' => false,
            'is_spoiler' => filter_var($request->input('is_spoiler'), FILTER_VALIDATE_BOOLEAN),
            'is_redacted' => filter_var($request->input('is_redacted'), FILTER_VALIDATE_BOOLEAN),
        ]);

        AuditLogger::log('created', 'ForumComment', $comment->id, substr($comment->content, 0, 50), [
            'thread_id' => $threadId
        ], $request);

        return response()->json($comment->load('user'), 201);
    }

    /**
     * PUT /api/forum/comments/{id}
     * Update an existing comment.
     */
    public function update(Request $request, $id)
    {
        $comment = ForumComment::findOrFail($id);

        $user = $request->user();
        if ($comment->user_id !== $user->id && ! $user->hasPermission('manage_forums')) {
            return response()->json(['error' => 'Forbidden. You do not own this comment.'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
            'is_spoiler' => 'nullable|boolean',
            'is_redacted' => 'nullable|boolean',
        ]);

        $comment->update([
            'content' => $validated['content'],
            'is_spoiler' => filter_var($request->input('is_spoiler'), FILTER_VALIDATE_BOOLEAN),
            'is_redacted' => filter_var($request->input('is_redacted'), FILTER_VALIDATE_BOOLEAN),
        ]);

        AuditLogger::log('updated', 'ForumComment', $comment->id, substr($comment->content, 0, 50), [
            'thread_id' => $comment->thread_id
        ], $request);

        return response()->json($comment->load('user'));
    }

    /**
     * DELETE /api/forum/comments/{id}
     * Delete a comment (cascades to replies).
     */
    public function destroy(Request $request, $id)
    {
        $comment = ForumComment::findOrFail($id);
        $commentId = $comment->id;
        $commentSnippet = substr($comment->content, 0, 50);
        $threadId = $comment->thread_id;

        $user = $request->user();
        if ($comment->user_id !== $user->id && ! $user->hasPermission('manage_forums')) {
            return response()->json(['error' => 'Forbidden. You do not own this comment.'], 403);
        }

        // If this comment was the accepted solution for a thread, clear the solved status
        $thread = ForumThread::where('solution_comment_id', $comment->id)->first();
        if ($thread) {
            $thread->update([
                'solution_comment_id' => null,
                'is_solved' => false,
            ]);
        }

        $comment->delete();

        AuditLogger::log('deleted', 'ForumComment', $commentId, $commentSnippet, [
            'thread_id' => $threadId
        ], $request);

        return response()->json(['success' => true]);
    }
}
