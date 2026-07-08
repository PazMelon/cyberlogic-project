<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BlogPost extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'subtitle',
        'excerpt',
        'content',
        'category',
        'author',
        'author_avatar',
        'date',
        'tags',
        'featured',
        'status',
        'sections',
        'image',
        'read_time',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'featured' => 'boolean',
            'sections' => 'array', // automatically serialize/deserialize JSON blocks
            'tags' => 'array',
        ];
    }
}
