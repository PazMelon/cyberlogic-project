<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CyberboardChatMessage extends Model
{
    use HasFactory;

    protected $table = 'cyberboard_chat_messages';

    protected $fillable = [
        'board_id',
        'user_id',
        'content',
        'reply_to_id',
        'is_pinned',
        'pinned_at',
        'pinned_by',
        'reactions',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'pinned_at' => 'datetime',
        'reactions' => 'array',
    ];

    public function board()
    {
        return $this->belongsTo(CyberboardBoard::class, 'board_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function replyTo()
    {
        return $this->belongsTo(CyberboardChatMessage::class, 'reply_to_id');
    }

    public function pinnedByUser()
    {
        return $this->belongsTo(User::class, 'pinned_by');
    }
}
