<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['first_name', 'middle_name', 'last_name', 'email', 'password', 'school_id', 'year_level', 'department', 'address', 'birthday', 'role', 'admin_position', 'bio', 'expertise', 'avatar_path', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['name', 'avatar', 'joinedDate', 'permission_keys'];

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} ".($this->middle_name ? "{$this->middle_name} " : '').$this->last_name);
    }

    /**
     * Get the user's avatar URL.
     */
    public function getAvatarAttribute(): string
    {
        if ($this->avatar_path) {
            return asset('storage/'.$this->avatar_path);
        }

        return 'https://api.dicebear.com/9.x/avataaars/svg?seed='.urlencode($this->first_name);
    }

    /**
     * Get the user's joined date.
     */
    public function getJoinedDateAttribute(): string
    {
        return $this->created_at ? $this->created_at->format('Y-m-d') : now()->format('Y-m-d');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birthday' => 'date',
        ];
    }

    /**
     * Get the permissions assigned to this user.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_user');
    }

    /**
     * Check if the user has a specific permission.
     * Superadmin always returns true (full access bypass).
     */
    public function hasPermission(string $key): bool
    {
        if ($this->role === 'superadmin') {
            return true;
        }

        return $this->permissions()->where('key', $key)->exists();
    }

    /**
     * Check if the user is an admin (admin or superadmin).
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }

    /**
     * Check if the user is the superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Get the user's permission keys as an array (appended to JSON).
     */
    public function getPermissionKeysAttribute(): array
    {
        if ($this->role === 'superadmin') {
            return Permission::pluck('key')->toArray();
        }

        return $this->permissions()->pluck('key')->toArray();
    }

    /**
     * Get the forum threads for the user.
     */
    public function forumThreads()
    {
        return $this->hasMany(ForumThread::class);
    }

    /**
     * Get the forum comments for the user.
     */
    public function forumComments()
    {
        return $this->hasMany(ForumComment::class);
    }

    /**
     * Get the forum votes for the user.
     */
    public function forumVotes()
    {
        return $this->hasMany(ForumVote::class);
    }

    /**
     * Get the chat messages for the user.
     */
    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    /**
     * Get the notifications for the user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
