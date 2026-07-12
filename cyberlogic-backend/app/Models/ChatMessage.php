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
        'parent_id',
        'content',
        'type',
        'is_deleted',
        'deleted_by',
        'deletion_reason',
        'deleted_at_timestamp',
        'is_flagged',
        'flagged_reason',
        'moderation_status',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'is_flagged' => 'boolean',
        'deleted_at_timestamp' => 'datetime',
    ];

    /**
     * Get the parent message that this message replies to.
     */
    public function parent()
    {
        return $this->belongsTo(ChatMessage::class, 'parent_id');
    }

    /**
     * Get the admin who deleted this message (for audit purposes).
     */
    public function deletedByUser()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

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

    /**
     * Get the reactions for this message.
     */
    public function reactions()
    {
        return $this->hasMany(ChatMessageReaction::class, 'message_id');
    }
}
