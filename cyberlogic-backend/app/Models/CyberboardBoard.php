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
        'type',
        'category',
        'cover_color',
        'created_by',
        'is_archived',
        'is_pinned',
        'visibility',
        'allowed_members',
        'column_creation_policy',
        'allowed_column_creator_roles',
        'allowed_column_creator_users',
        'methodology',
        'phase_settings',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
            'is_pinned' => 'boolean',
            'allowed_members' => 'array',
            'allowed_column_creator_roles' => 'array',
            'allowed_column_creator_users' => 'array',
            'phase_settings' => 'array',
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
