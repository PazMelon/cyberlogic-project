<?php

namespace App\Http\Controllers;

use App\Models\ForumComment;
use App\Models\ForumThread;
use App\Models\ForumVote;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class ForumVoteController extends Controller
{
    private function handleVote($model, $value, $userId)
    {
        $existingVote = ForumVote::where('user_id', $userId)
            ->where('voteable_type', get_class($model))
            ->where('voteable_id', $model->id)
            ->first();

        if ($existingVote) {
            if ($existingVote->value === (int) $value) {
                // If user clicks the same vote option, remove their vote (toggle off)
                $existingVote->delete();
                $userVote = null;
            } else {
                // If user clicks the opposite vote option, update the vote
                $existingVote->update(['value' => $value]);
                $userVote = (int) $value;
            }
        } else {
            // Create a new vote
            ForumVote::create([
                'user_id' => $userId,
                'voteable_type' => get_class($model),
                'voteable_id' => $model->id,
                'value' => $value,
            ]);
            $userVote = (int) $value;
        }

        // Return updated vote score & user's current vote
        return [
            'vote_score' => (int) $model->votes()->sum('value'),
            'user_vote' => $userVote,
        ];
    }

    public function voteThread(Request $request, $id)
    {
        $validated = $request->validate([
            'value' => 'required|integer|in:-1,1',
        ]);

        $thread = ForumThread::findOrFail($id);
        $result = $this->handleVote($thread, $validated['value'], $request->user()->id);

        AuditLogger::log('voted', 'ForumThread', $thread->id, $thread->title, [
            'value' => $validated['value'],
            'vote_score' => $result['vote_score'],
            'user_vote' => $result['user_vote']
        ], $request);

        \App\Services\RealtimeService::broadcast("forums:thread:{$thread->id}", [
            'event' => 'thread_voted',
            'likes' => $result['vote_score']
        ]);

        return response()->json($result);
    }

    public function voteComment(Request $request, $id)
    {
        $validated = $request->validate([
            'value' => 'required|integer|in:-1,1',
        ]);

        $comment = ForumComment::findOrFail($id);
        $result = $this->handleVote($comment, $validated['value'], $request->user()->id);

        AuditLogger::log('voted', 'ForumComment', $comment->id, substr($comment->content, 0, 50), [
            'value' => $validated['value'],
            'vote_score' => $result['vote_score'],
            'user_vote' => $result['user_vote']
        ], $request);

        \App\Services\RealtimeService::broadcast("forums:thread:{$comment->thread_id}", [
            'event' => 'comment_voted',
            'commentId' => $comment->id,
            'likes' => $result['vote_score']
        ]);

        return response()->json($result);
    }
}
