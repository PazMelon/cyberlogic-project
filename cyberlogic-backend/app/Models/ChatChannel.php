<?php

namespace App\Models;

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
        'is_protected',
        'icon',
        'grouping',
        'sort_order',
    ];

    protected $casts = [
        'allowed_roles' => 'array',
        'write_roles' => 'array',
        'is_archived' => 'boolean',
        'is_protected' => 'boolean',
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
     * Get the members of this private channel/DM.
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'chat_channel_members', 'channel_id', 'user_id');
    }

    /**
     * Get message count for this channel.
     */
    public function getMessageCountAttribute(): int
    {
        return $this->messages()->count();
    }
}
