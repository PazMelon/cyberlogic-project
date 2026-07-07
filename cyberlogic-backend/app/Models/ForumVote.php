<?php

namespace App\Models;

use Database\Factories\ForumVoteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumVote extends Model
{
    /** @use HasFactory<ForumVoteFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'voteable_id',
        'voteable_type',
        'value',
    ];

    /**
     * Get the owning voteable model (thread or comment).
     */
    public function voteable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who voted.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
