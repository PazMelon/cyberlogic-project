<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatChannelRead extends Model
{
    use HasFactory;

    protected $table = 'chat_channel_reads';

    protected $fillable = [
        'user_id',
        'channel_id',
        'last_seen_message_id',
    ];

    /**
     * Get the user this read receipt belongs to.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the channel this read receipt belongs to.
     */
    public function channel()
    {
        return $this->belongsTo(ChatChannel::class, 'channel_id');
    }
}
