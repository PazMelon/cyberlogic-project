<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'type',
        'sort_order',
        'icon',
        'is_visible',
        'allow_solved',
        'rules',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'allow_solved' => 'boolean',
    ];

    protected $appends = ['threadCount', 'solvedThreadCount'];

    /**
     * Get the threads for the category.
     */
    public function threads()
    {
        return $this->hasMany(ForumThread::class, 'category_id');
    }

    /**
     * Get the total thread count.
     */
    public function getThreadCountAttribute(): int
    {
        return $this->threads()->count();
    }

    /**
     * Get the solved thread count.
     */
    public function getSolvedThreadCountAttribute(): int
    {
        return $this->threads()->where('is_solved', true)->count();
    }
}
