<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\BlogPost;
use App\Models\Event;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Perform global search across all entities.
     */
    public function search(Request $request): JsonResponse
    {
        $q = $request->query('q', '');
        $type = $request->query('type', 'all');

        if (trim($q) === '') {
            return response()->json([
                'announcements' => [],
                'forums' => [],
                'profiles' => [],
                'blogs' => [],
                'events' => [],
                'resources' => [],
            ]);
        }

        $results = [];

        // 1. Announcements
        if ($type === 'all' || $type === 'announcements') {
            $announcements = Announcement::where('title', 'like', "%{$q}%")
                ->orWhere('subtitle', 'like', "%{$q}%")
                ->orWhere('excerpt', 'like', "%{$q}%")
                ->orWhere('content', 'like', "%{$q}%")
                ->orderBy('pinned', 'desc')
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();
            $results['announcements'] = $announcements->map(function ($a) {
                return [
                    'id' => $a->id,
                    'title' => $a->title,
                    'excerpt' => $a->excerpt,
                    'category' => $a->category,
                    'date' => $a->date,
                ];
            });
        } else {
            $results['announcements'] = [];
        }

        // 2. Forums (ForumThreads)
        if ($type === 'all' || $type === 'forums') {
            // Note: OR conditions should be grouped to prevent logic leakage
            $threads = ForumThread::with(['user', 'category'])
                ->where(function ($query) use ($q) {
                    $query->where('title', 'like', "%{$q}%")
                        ->orWhere('content', 'like', "%{$q}%");
                })
                ->orderBy('is_pinned', 'desc')
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();
            $results['forums'] = $threads->map(function ($t) {
                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'author' => $t->user ? $t->user->name : 'Anonymous',
                    'replyCount' => $t->commentCount,
                    'likes' => $t->voteScore,
                    'createdAt' => $t->created_at ? $t->created_at->diffForHumans() : '',
                ];
            });
        } else {
            $results['forums'] = [];
        }

        // 3. Profiles (Approved Users)
        if ($type === 'all' || $type === 'profiles') {
            $profiles = User::where('status', 'approved')
                ->where(function ($query) use ($q) {
                    $query->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('department', 'like', "%{$q}%")
                        ->orWhere('expertise', 'like', "%{$q}%");
                })
                ->limit(5)
                ->get();
            $results['profiles'] = $profiles->map(function ($p) {
                $displayRole = 'Member';
                if ($p->role === 'admin' || $p->role === 'superadmin') {
                    $displayRole = $p->admin_position ?: ucfirst($p->role);
                }
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'avatar' => $p->avatar,
                    'role' => $displayRole,
                    'department' => $p->department ?: 'N/A',
                ];
            });
        } else {
            $results['profiles'] = [];
        }

        // 4. Blogs (BlogPost)
        if ($type === 'all' || $type === 'blogs') {
            $blogs = BlogPost::where('status', 'published')
                ->where(function ($query) use ($q) {
                    $query->where('title', 'like', "%{$q}%")
                        ->orWhere('subtitle', 'like', "%{$q}%")
                        ->orWhere('excerpt', 'like', "%{$q}%")
                        ->orWhere('content', 'like', "%{$q}%");
                })
                ->orderBy('featured', 'desc')
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();
            $results['blogs'] = $blogs->map(function ($b) {
                return [
                    'id' => $b->id,
                    'title' => $b->title,
                    'excerpt' => $b->excerpt,
                    'category' => $b->category,
                    'date' => $b->date,
                ];
            });
        } else {
            $results['blogs'] = [];
        }

        // 5. Events (Event)
        if ($type === 'all' || $type === 'events') {
            $events = Event::where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            })
                ->orderBy('date', 'desc')
                ->limit(5)
                ->get();
            $results['events'] = $events->map(function ($e) {
                return [
                    'id' => $e->id,
                    'title' => $e->title,
                    'description' => $e->description,
                    'date' => $e->date ? $e->date->format('Y-m-d') : '',
                    'type' => $e->type,
                ];
            });
        } else {
            $results['events'] = [];
        }

        // Resources are filtered on frontend client-side
        $results['resources'] = [];

        return response()->json($results);
    }
}
