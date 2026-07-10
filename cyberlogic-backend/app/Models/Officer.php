<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Officer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'use_profile_info',
        'display_name',
        'display_role',
        'display_bio',
        'display_avatar',
        'display_email',
        'display_github',
        'display_linkedin',
        'sort_order',
    ];

    protected $casts = [
        'use_profile_info' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'name',
        'role',
        'bio',
        'avatar',
        'email',
        'github',
        'linkedin',
        'username',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUsernameAttribute(): ?string
    {
        return $this->user ? $this->user->username : null;
    }

    public function getNameAttribute(): string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->name;
        }
        return $this->display_name ?? '';
    }

    public function getRoleAttribute(): string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->admin_position ?? 'Officer';
        }
        return $this->display_role ?? '';
    }

    public function getBioAttribute(): string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->bio ?? '';
        }
        return $this->display_bio ?? '';
    }

    public function getAvatarAttribute(): string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->avatar;
        }

        if ($this->display_avatar) {
            if (filter_var($this->display_avatar, FILTER_VALIDATE_URL)) {
                return $this->display_avatar;
            }
            return asset('storage/' . $this->display_avatar);
        }

        $seedName = $this->display_name ?: 'Officer';
        return 'https://api.dicebear.com/9.x/avataaars/svg?seed=' . urlencode($seedName);
    }

    public function getEmailAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->email;
        }
        return $this->display_email ?: null;
    }

    public function getGithubAttribute(): ?string
    {
        return $this->display_github ?: null;
    }

    public function getLinkedinAttribute(): ?string
    {
        return $this->display_linkedin ?: null;
    }
}
