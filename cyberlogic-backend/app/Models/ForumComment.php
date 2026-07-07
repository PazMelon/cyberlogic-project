<?php

namespace App\Models;

use Database\Factories\ForumCommentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumComment extends Model
{
    /** @use HasFactory<ForumCommentFactory> */
    use HasFactory;

    protected $fillable = [
        'thread_id',
        'user_id',
        'parent_id',
        'content',
        'is_best_answer',
    ];

    protected $casts = [
        'is_best_answer' => 'boolean',
    ];

    protected $appends = ['voteScore', 'userVote'];

    /**
     * Get the user who made the comment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the thread for the comment.
     */
    public function thread()
    {
        return $this->belongsTo(ForumThread::class, 'thread_id');
    }

    /**
     * Get the parent comment.
     */
    public function parent()
    {
        return $this->belongsTo(ForumComment::class, 'parent_id');
    }

    /**
     * Get the child replies.
     */
    public function replies()
    {
        return $this->hasMany(ForumComment::class, 'parent_id');
    }

    /**
     * Get the votes for the comment.
     */
    public function votes()
    {
        return $this->morphMany(ForumVote::class, 'voteable');
    }

    /**
     * Get the comment vote score.
     */
    public function getVoteScoreAttribute(): int
    {
        return (int) $this->votes()->sum('value');
    }

    /**
     * Get the authenticated user's vote on this comment.
     */
    public function getUserVoteAttribute(): ?int
    {
        if (auth()->check()) {
            $vote = $this->votes()->where('user_id', auth()->id())->first();

            return $vote ? (int) $vote->value : null;
        }

        return null;
    }
}
