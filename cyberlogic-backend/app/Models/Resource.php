<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Resource extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'icon',
        'link',
        'file_path',
        'status',
        'download_count',
    ];

    protected $appends = ['voteScore', 'userVote', 'filePathUrl'];

    /**
     * Get the user who uploaded the resource.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the votes for the resource.
     */
    public function votes(): HasMany
    {
        return $this->hasMany(ResourceVote::class);
    }

    /**
     * Get the resource vote score.
     */
    public function getVoteScoreAttribute(): int
    {
        return (int) $this->votes()->sum('value');
    }

    /**
     * Get the authenticated user's vote on this resource.
     */
    public function getUserVoteAttribute(): ?int
    {
        if (auth()->check()) {
            $vote = $this->votes()->where('user_id', auth()->id())->first();
            return $vote ? (int) $vote->value : null;
        }

        return null;
    }

    /**
     * Get the full URL of the uploaded file.
     */
    public function getFilePathUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }
}
