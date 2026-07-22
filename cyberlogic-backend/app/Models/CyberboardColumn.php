<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CyberboardColumn extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'title',
        'icon',
        'color',
        'position',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(CyberboardBoard::class, 'board_id');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(CyberboardCard::class, 'column_id')
            ->where('is_archived', false)
            ->orderBy('position', 'asc');
    }
}
