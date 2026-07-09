<?php

namespace App\Models;

use Database\Factories\ForumThreadFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumThread extends Model
{
    /** @use HasFactory<ForumThreadFactory> */
    use HasFactory;

    protected $fillable = [
        'category_id',
        'user_id',
        'title',
        'content',
        'views',
        'is_pinned',
        'is_solved',
        'is_closed',
        'solution_comment_id',
        'images',
        'is_spoiler',
        'is_redacted',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_solved' => 'boolean',
        'is_closed' => 'boolean',
        'is_spoiler' => 'boolean',
        'is_redacted' => 'boolean',
        'images' => 'array',
    ];

    protected $appends = ['voteScore', 'commentCount', 'userVote'];

    /**
     * Get the user who created the thread.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category for the thread.
     */
    public function category()
    {
        return $this->belongsTo(ForumCategory::class, 'category_id');
    }

    /**
     * Get the comments for the thread.
     */
    public function comments()
    {
        return $this->hasMany(ForumComment::class, 'thread_id');
    }

    /**
     * Get the votes for the thread.
     */
    public function votes()
    {
        return $this->morphMany(ForumVote::class, 'voteable');
    }

    /**
     * Get the solution comment for the thread.
     */
    public function solutionComment()
    {
        return $this->belongsTo(ForumComment::class, 'solution_comment_id');
    }

    /**
     * Get the poll associated with the thread.
     */
    public function poll()
    {
        return $this->hasOne(ForumPoll::class, 'thread_id');
    }

    /**
     * Get the thread vote score.
     */
    public function getVoteScoreAttribute(): int
    {
        return (int) $this->votes()->sum('value');
    }

    /**
     * Get the thread comment count.
     */
    public function getCommentCountAttribute(): int
    {
        return $this->comments()->count();
    }

    /**
     * Get the authenticated user's vote on this thread.
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
