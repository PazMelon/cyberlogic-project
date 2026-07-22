<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class CyberboardBoard extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'cover_color',
        'created_by',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function columns(): HasMany
    {
        return $this->hasMany(CyberboardColumn::class, 'board_id')->orderBy('position', 'asc');
    }

    public function cards(): HasManyThrough
    {
        return $this->hasManyThrough(CyberboardCard::class, CyberboardColumn::class, 'board_id', 'column_id');
    }
}
