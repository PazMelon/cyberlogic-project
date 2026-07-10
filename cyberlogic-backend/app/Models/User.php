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

#[Fillable(['username', 'first_name', 'middle_name', 'last_name', 'email', 'password', 'school_id', 'year_level', 'department', 'address', 'birthday', 'role', 'admin_position', 'bio', 'expertise', 'avatar_path', 'status', 'suspended_at', 'suspended_until', 'suspension_reason'])]
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
    protected $appends = ['name', 'avatar', 'joinedDate', 'permission_keys', 'reputation'];

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

    /**
     * Get the resources uploaded by the user.
     */
    public function resources()
    {
        return $this->hasMany(Resource::class);
    }

    /**
     * Calculate reputation score based on starting date.
     */
    public function calculateReputationScore(?\Carbon\Carbon $startDate = null): int
    {
        $threadIds = $this->forumThreads()->pluck('id');
        $commentIds = $this->forumComments()->pluck('id');
        $resourceIds = $this->resources()->pluck('id');

        $threadRep = 0;
        if ($threadIds->isNotEmpty()) {
            $query = \App\Models\ForumVote::where('voteable_type', \App\Models\ForumThread::class)
                ->whereIn('voteable_id', $threadIds);
            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }
            $threadRep = (int) $query->selectRaw('SUM(CASE WHEN value = 1 THEN 5 WHEN value = -1 THEN -2 ELSE 0 END) as score')->value('score');
        }

        $commentRep = 0;
        if ($commentIds->isNotEmpty()) {
            $query = \App\Models\ForumVote::where('voteable_type', \App\Models\ForumComment::class)
                ->whereIn('voteable_id', $commentIds);
            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }
            $commentRep = (int) $query->selectRaw('SUM(CASE WHEN value = 1 THEN 3 WHEN value = -1 THEN -1 ELSE 0 END) as score')->value('score');
        }

        $solutionRep = 0;
        if ($commentIds->isNotEmpty()) {
            $query = \App\Models\ForumThread::whereIn('solution_comment_id', $commentIds);
            if ($startDate) {
                $query->where('updated_at', '>=', $startDate);
            }
            $solutionRep = $query->count() * 25;
        }

        $resourceRep = 0;
        if ($resourceIds->isNotEmpty()) {
            $query = \App\Models\ResourceVote::whereIn('resource_id', $resourceIds);
            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }
            $resourceRep = (int) $query->selectRaw('SUM(CASE WHEN value = 1 THEN 3 WHEN value = -1 THEN -1 ELSE 0 END) as score')->value('score');
        }

        $resourceApprovalRep = 0;
        $resQuery = $this->resources()->where('status', 'approved');
        if ($startDate) {
            $resQuery->where('updated_at', '>=', $startDate);
        }
        $resourceApprovalRep = $resQuery->count() * 10;

        return $threadRep + $commentRep + $solutionRep + $resourceRep + $resourceApprovalRep;
    }

    /**
     * Get the user's reputation score structure.
     */
    public function getReputationAttribute(): array
    {
        return [
            'week' => $this->calculateReputationScore(now()->subWeek()),
            'month' => $this->calculateReputationScore(now()->subMonth()),
            'year' => $this->calculateReputationScore(now()->subYear()),
            'allTime' => $this->calculateReputationScore(),
        ];
    }
}
