<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserGalleryPhoto extends Model
{
    protected $fillable = [
        'user_id',
        'image_path',
        'caption',
        'sort_order',
    ];

    protected $appends = ['image_url'];

    /**
     * Get the user that owns the gallery photo.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL of the gallery photo.
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }
}
