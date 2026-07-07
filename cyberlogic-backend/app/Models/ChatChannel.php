<?php

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatChannel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'created_by',
        'allowed_roles',
        'write_roles',
        'is_archived',
    ];

    protected $casts = [
        'allowed_roles' => 'array',
        'write_roles' => 'array',
        'is_archived' => 'boolean',
    ];

    protected $appends = ['messageCount'];

    /**
     * Get the messages for this channel.
     */
    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'channel_id');
    }

    /**
     * Get the user who created the channel.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get message count for this channel.
     */
    public function getMessageCountAttribute(): int
    {
        return $this->messages()->count();
    }
}
