<?php

namespace App\Http\Controllers;

use App\Models\ForumPoll;
use App\Models\ForumPollOption;
use App\Models\ForumPollVote;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumPollController extends Controller
{
    /**
     * POST /api/forum/polls/{pollId}/vote
     * Vote in a poll.
     */
    public function vote(Request $request, $pollId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $poll = ForumPoll::findOrFail($pollId);

        if ($poll->is_closed) {
            return response()->json(['error' => 'This poll has been closed.'], 400);
        }

        $validated = $request->validate([
            'option_id' => 'required|integer|exists:forum_poll_options,id',
        ]);

        $option = ForumPollOption::where('id', $validated['option_id'])
            ->where('poll_id', $poll->id)
            ->firstOrFail();

        // Create or update vote
        ForumPollVote::updateOrCreate(
            [
                'poll_id' => $poll->id,
                'user_id' => $user->id,
            ],
            [
                'poll_option_id' => $option->id,
            ]
        );

        AuditLogger::log('voted', 'ForumPoll', $poll->id, "Voted in poll: {$poll->question}", null, $request);

        // Fetch refreshed thread/poll details (or just refreshed poll structure)
        return response()->json($this->getRefreshedPoll($poll->id, $user->id));
    }

    /**
     * PUT /api/forum/polls/{pollId}/close
     * Close a poll.
     */
    public function close(Request $request, $pollId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $poll = ForumPoll::with('thread')->findOrFail($pollId);

        // Verify if user is owner of the thread or has admin permissions
        if ($poll->thread->user_id !== $user->id && !$user->hasPermission('manage_forums')) {
            return response()->json(['error' => 'Forbidden. You do not have permission to close this poll.'], 403);
        }

        $poll->update(['is_closed' => true]);

        AuditLogger::log('closed', 'ForumPoll', $poll->id, "Closed poll: {$poll->question}", null, $request);

        return response()->json($this->getRefreshedPoll($poll->id, $user->id));
    }

    /**
     * Helper to return formatted poll response
     */
    private function getRefreshedPoll(int $pollId, ?int $userId): array
    {
        $poll = ForumPoll::with(['options.votes'])->findOrFail($pollId);
        $totalVotes = $poll->votes()->count();

        $options = $poll->options->map(function ($opt) {
            return [
                'id' => $opt->id,
                'option_text' => $opt->option_text,
                'votes_count' => $opt->votes->count(),
            ];
        });

        $userVotedOptionId = null;
        if ($userId) {
            $userVote = ForumPollVote::where('poll_id', $pollId)->where('user_id', $userId)->first();
            $userVotedOptionId = $userVote ? $userVote->poll_option_id : null;
        }

        return [
            'id' => $poll->id,
            'question' => $poll->question,
            'is_closed' => $poll->is_closed,
            'total_votes' => $totalVotes,
            'user_voted_option_id' => $userVotedOptionId,
            'options' => $options,
        ];
    }
}
