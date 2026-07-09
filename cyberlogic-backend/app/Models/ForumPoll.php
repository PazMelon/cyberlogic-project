<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumPoll extends Model
{
    use HasFactory;

    protected $fillable = [
        'thread_id',
        'question',
        'is_closed',
    ];

    protected $casts = [
        'is_closed' => 'boolean',
    ];

    public function thread()
    {
        return $this->belongsTo(ForumThread::class, 'thread_id');
    }

    public function options()
    {
        return $this->hasMany(ForumPollOption::class, 'poll_id');
    }

    public function votes()
    {
        return $this->hasMany(ForumPollVote::class, 'poll_id');
    }
}
