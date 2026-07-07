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
    ];

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
}
