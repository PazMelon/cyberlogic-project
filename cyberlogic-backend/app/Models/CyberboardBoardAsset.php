<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CyberboardBoardAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'user_id',
        'type',
        'title',
        'url',
        'description',
    ];

    /**
     * Get the board that owns this asset.
     */
    public function board(): BelongsTo
    {
        return $this->belongsTo(CyberboardBoard::class, 'board_id');
    }

    /**
     * Get the user who uploaded / added this asset.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
