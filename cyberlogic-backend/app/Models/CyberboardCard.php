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
        'parent_id',
        'user_id',
        'assigned_user_id',
        'assigned_user_ids',
        'title',
        'description',
        'activity_date',
        'activity_end_date',
        'color_tag',
        'priority',
        'phase',
        'position',
        'is_archived',
    ];

    protected $appends = ['assigned_users'];

    protected function casts(): array
    {
        return [
            'activity_date' => 'date:Y-m-d',
            'activity_end_date' => 'date:Y-m-d',
            'is_archived' => 'boolean',
            'position' => 'integer',
            'assigned_user_id' => 'integer',
            'assigned_user_ids' => 'array',
            'parent_id' => 'integer',
        ];
    }

    public function getAssignedUsersAttribute()
    {
        $ids = $this->assigned_user_ids;
        if (empty($ids) && $this->assigned_user_id) {
            $ids = [$this->assigned_user_id];
        }
        if (empty($ids)) {
            return [];
        }
        return User::whereIn('id', $ids)->get(['id', 'first_name', 'last_name', 'username', 'avatar_path']);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(CyberboardColumn::class, 'column_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CyberboardCard::class, 'parent_id');
    }

    public function subCards(): HasMany
    {
        return $this->hasMany(CyberboardCard::class, 'parent_id')->orderBy('position', 'asc');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(CyberboardCardVote::class, 'card_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CyberboardCardComment::class, 'card_id')->orderBy('created_at', 'asc');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CyberboardCardActivity::class, 'card_id')->orderBy('created_at', 'desc');
    }
}
