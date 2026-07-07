<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'channel_id',
        'user_id',
        'content',
        'type',
    ];

    /**
     * Get the channel this message belongs to.
     */
    public function channel()
    {
        return $this->belongsTo(ChatChannel::class, 'channel_id');
    }

    /**
     * Get the user who sent this message.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
