<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProject extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'link',
        'images',
        'sort_order',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    protected $appends = ['image_urls'];

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::deleting(function ($project) {
            if ($project->images && is_array($project->images)) {
                foreach ($project->images as $path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
                }
            }
        });
    }

    /**
     * Get the user that owns the project.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URLs for all project images.
     */
    public function getImageUrlsAttribute(): array
    {
        if (!$this->images || !is_array($this->images)) {
            return [];
        }

        return array_map(fn($path) => asset('storage/' . $path), $this->images);
    }
}
