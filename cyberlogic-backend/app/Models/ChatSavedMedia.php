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
    ];
}
