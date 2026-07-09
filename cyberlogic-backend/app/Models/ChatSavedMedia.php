<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatSavedMedia extends Model
{
    use HasFactory;

    protected $table = 'chat_saved_media';

    protected $fillable = [
        'title',
        'url',
        'category',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
