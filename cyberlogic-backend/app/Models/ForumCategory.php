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
    ];

    protected $appends = ['threadCount'];

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
}
