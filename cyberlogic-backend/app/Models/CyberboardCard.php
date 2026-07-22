<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CyberboardCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'column_id',
        'user_id',
        'title',
        'description',
        'activity_date',
        'activity_end_date',
        'color_tag',
        'priority',
        'position',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'activity_date' => 'date:Y-m-d',
            'activity_end_date' => 'date:Y-m-d',
            'is_archived' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(CyberboardColumn::class, 'column_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(CyberboardCardVote::class, 'card_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CyberboardCardComment::class, 'card_id')->orderBy('created_at', 'asc');
    }
}
