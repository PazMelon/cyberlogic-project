<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumPollVote extends Model
{
    use HasFactory;

    protected $fillable = [
        'poll_id',
        'poll_option_id',
        'user_id',
    ];

    public function poll()
    {
        return $this->belongsTo(ForumPoll::class, 'poll_id');
    }

    public function option()
    {
        return $this->belongsTo(ForumPollOption::class, 'poll_option_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
