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
        'display_department',
        'display_year_level',
        'display_bio',
        'display_avatar',
        'display_email',
        'display_github',
        'display_linkedin',
        'display_facebook',
        'display_instagram',
        'display_wechat',
        'display_tiktok',
        'display_twitter',
        'display_reddit',
        'sort_order',
    ];

    protected $casts = [
        'use_profile_info' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'name',
        'role',
        'department',
        'year_level',
        'bio',
        'expertise',
        'avatar',
        'email',
        'github',
        'linkedin',
        'facebook',
        'instagram',
        'wechat',
        'tiktok',
        'twitter',
        'reddit',
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

    public function getDepartmentAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->department ?? $this->display_department;
        }
        return $this->display_department ?: null;
    }

    public function getYearLevelAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user) {
            return $this->user->year_level ?? $this->display_year_level;
        }
        return $this->display_year_level ?: null;
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
        if (!empty($this->display_avatar)) {
            $avatar = trim($this->display_avatar);
            if (filter_var($avatar, FILTER_VALIDATE_URL) || str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
                return $avatar;
            }
            if (str_starts_with($avatar, '/storage/')) {
                return asset(ltrim($avatar, '/'));
            }
            if (str_starts_with($avatar, 'storage/')) {
                return asset($avatar);
            }
            return asset('storage/' . ltrim($avatar, '/'));
        }

        if ($this->use_profile_info && $this->user) {
            return $this->user->avatar;
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

    public function getExpertiseAttribute(): array
    {
        if ($this->use_profile_info && $this->user) {
            $val = $this->user->expertise;
            if (is_array($val)) return array_values(array_filter($val));
            if (is_string($val) && !empty(trim($val))) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    return array_values(array_filter($decoded));
                }
                return array_values(array_filter(array_map('trim', explode(',', $val))));
            }
        }
        return [];
    }

    public function getGithubAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->github) {
            return $this->user->github;
        }
        return $this->display_github ?: null;
    }

    public function getLinkedinAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->linkedin) {
            return $this->user->linkedin;
        }
        return $this->display_linkedin ?: null;
    }

    public function getFacebookAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->facebook) {
            return $this->user->facebook;
        }
        return $this->display_facebook ?: null;
    }

    public function getInstagramAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->instagram) {
            return $this->user->instagram;
        }
        return $this->display_instagram ?: null;
    }

    public function getWechatAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->wechat) {
            return $this->user->wechat;
        }
        return $this->display_wechat ?: null;
    }

    public function getTiktokAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->tiktok) {
            return $this->user->tiktok;
        }
        return $this->display_tiktok ?: null;
    }

    public function getTwitterAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->twitter) {
            return $this->user->twitter;
        }
        return $this->display_twitter ?: null;
    }

    public function getRedditAttribute(): ?string
    {
        if ($this->use_profile_info && $this->user && $this->user->reddit) {
            return $this->user->reddit;
        }
        return $this->display_reddit ?: null;
    }
}
