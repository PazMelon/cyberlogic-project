<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Announcement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'subtitle',
        'excerpt',
        'content',
        'category',
        'author',
        'author_avatar',
        'date',
        'pinned',
        'sections',
        'image',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pinned' => 'boolean',
            'sections' => 'array', // automatically serialize/deserialize JSON blocks
        ];
    }

    /**
     * Get the user who authored this announcement.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
