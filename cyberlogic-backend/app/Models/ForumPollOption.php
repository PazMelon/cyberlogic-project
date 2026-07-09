<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumPollOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'poll_id',
        'option_text',
    ];

    public function poll()
    {
        return $this->belongsTo(ForumPoll::class, 'poll_id');
    }

    public function votes()
    {
        return $this->hasMany(ForumPollVote::class, 'poll_option_id');
    }
}
