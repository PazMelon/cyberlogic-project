<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    /**
     * Get a list of all approved directory members.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::where('status', 'approved')
            ->orderBy('first_name', 'asc')
            ->get();

        $directory = $users->map(function ($user) {
            // Parse expertise: if it is a comma-separated string, convert it to an array
            $expertiseArray = [];
            if ($user->expertise) {
                $expertiseArray = array_values(array_filter(array_map('trim', explode(',', $user->expertise))));
            }

            // Determine role: if role is member, use 'Member'. If admin/superadmin, use admin_position (default to capitalized role if admin_position is empty)
            $displayRole = 'Member';
            if ($user->role === 'admin' || $user->role === 'superadmin') {
                $displayRole = $user->admin_position ?: ucfirst($user->role);
            }

            // Badges: map roles and other metrics to badges
            $badges = [];
            if ($user->role === 'superadmin') {
                $badges[] = 'Staff';
            }
            if ($user->role === 'admin') {
                $badges[] = 'Officer';
            }
            if ($user->created_at && $user->created_at->year < 2026) {
                $badges[] = 'Veteran';
            }

            // Status: since we don't have real-time status in DB, set status based on ID to look dynamic and lively
            $statuses = ['online', 'offline', 'away'];
            $status = $statuses[$user->id % 3];

            return [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $displayRole,
                'department' => $user->department ?: 'N/A',
                'yearLevel' => $user->year_level ?: 'N/A',
                'expertise' => $expertiseArray,
                'badges' => $badges,
                'status' => 'offline',
                'reputation' => $user->reputation,
                'bio' => $user->bio ?: 'No bio provided.',
                'joinedDate' => $user->joinedDate,
            ];
        });

        return response()->json($directory);
    }

    /**
     * Get details of a single approved member.
     */
    public function show($id): JsonResponse
    {
        $user = User::where('status', 'approved')->findOrFail($id);

        $expertiseArray = [];
        if ($user->expertise) {
            $expertiseArray = array_values(array_filter(array_map('trim', explode(',', $user->expertise))));
        }

        $displayRole = 'Member';
        if ($user->role === 'admin' || $user->role === 'superadmin') {
            $displayRole = $user->admin_position ?: ucfirst($user->role);
        }

        $badges = [];
        if ($user->role === 'superadmin') {
            $badges[] = 'Staff';
        }
        if ($user->role === 'admin') {
            $badges[] = 'Officer';
        }
        if ($user->created_at && $user->created_at->year < 2026) {
            $badges[] = 'Veteran';
        }

        $statuses = ['online', 'offline', 'away'];
        $status = $statuses[$user->id % 3];

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $displayRole,
            'department' => $user->department ?: 'N/A',
            'yearLevel' => $user->year_level ?: 'N/A',
            'expertise' => $expertiseArray,
            'badges' => $badges,
            'status' => 'offline',
            'reputation' => $user->reputation,
            'bio' => $user->bio ?: 'No bio provided.',
            'joinedDate' => $user->joinedDate,
            'address' => $user->address,
            'birthday' => $user->birthday ? \Carbon\Carbon::parse($user->birthday)->format('Y-m-d') : null,
        ]);
    }

    /**
     * Get details of a single approved member by username.
     */
    public function showByUsername($username): JsonResponse
    {
        $user = User::where('status', 'approved')->where('username', $username)->firstOrFail();

        $expertiseArray = [];
        if ($user->expertise) {
            $expertiseArray = array_values(array_filter(array_map('trim', explode(',', $user->expertise))));
        }

        $displayRole = 'Member';
        if ($user->role === 'admin' || $user->role === 'superadmin') {
            $displayRole = $user->admin_position ?: ucfirst($user->role);
        }

        $badges = [];
        if ($user->role === 'superadmin') {
            $badges[] = 'Staff';
        }
        if ($user->role === 'admin') {
            $badges[] = 'Officer';
        }
        if ($user->created_at && $user->created_at->year < 2026) {
            $badges[] = 'Veteran';
        }

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $displayRole,
            'department' => $user->department ?: 'N/A',
            'yearLevel' => $user->year_level ?: 'N/A',
            'expertise' => $expertiseArray,
            'badges' => $badges,
            'status' => 'offline',
            'reputation' => $user->reputation,
            'bio' => $user->bio ?: 'No bio provided.',
            'joinedDate' => $user->joinedDate,
            'address' => $user->address,
            'birthday' => $user->birthday ? \Carbon\Carbon::parse($user->birthday)->format('Y-m-d') : null,
        ]);
    }

    /**
     * Get recent activities of a single member.
     */
    public function activity($id): JsonResponse
    {
        $threads = \App\Models\ForumThread::where('user_id', $id)
            ->with(['category', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $comments = \App\Models\ForumComment::where('user_id', $id)
            ->with(['thread.category', 'thread.user', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $activities = collect();

        foreach ($threads as $thread) {
            $activities->push([
                'type' => 'thread',
                'id' => $thread->id,
                'title' => $thread->title,
                'content' => $thread->content,
                'created_at' => $thread->created_at ? $thread->created_at->toIso8601String() : null,
                'category_name' => $thread->category ? $thread->category->name : 'General',
                'category_color' => $thread->category ? ($thread->category->color ?: 'primary') : 'primary',
                'category_slug' => $thread->category ? $thread->category->slug : 'general',
                'thread' => [
                    'id' => $thread->id,
                    'title' => $thread->title,
                    'category' => $thread->category ? [
                        'name' => $thread->category->name,
                        'color' => $thread->category->color ?: 'primary',
                        'slug' => $thread->category->slug,
                    ] : null,
                    'user' => $thread->user,
                ]
            ]);
        }

        foreach ($comments as $comment) {
            if (!$comment->thread) {
                continue;
            }
            $activities->push([
                'type' => 'comment',
                'id' => $comment->id,
                'title' => $comment->thread->title,
                'content' => $comment->content,
                'created_at' => $comment->created_at ? $comment->created_at->toIso8601String() : null,
                'category_name' => $comment->thread->category ? $comment->thread->category->name : 'General',
                'category_color' => $comment->thread->category ? ($comment->thread->category->color ?: 'primary') : 'primary',
                'category_slug' => $comment->thread->category ? $comment->thread->category->slug : 'general',
                'thread' => [
                    'id' => $comment->thread->id,
                    'title' => $comment->thread->title,
                    'category' => $comment->thread->category ? [
                        'name' => $comment->thread->category->name,
                        'color' => $comment->thread->category->color ?: 'primary',
                        'slug' => $comment->thread->category->slug,
                    ] : null,
                    'user' => $comment->thread->user,
                ]
            ]);
        }

        $sortedActivities = $activities->sortByDesc('created_at')->values()->all();

        return response()->json($sortedActivities);
    }
}
