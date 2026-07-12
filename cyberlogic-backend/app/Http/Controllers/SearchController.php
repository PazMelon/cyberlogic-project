<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\BlogPost;
use App\Models\Event;
use App\Models\ForumThread;
use App\Models\User;
use App\Models\Resource;
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

        return response()->json([
            'announcements' => ($type === 'all' || $type === 'announcements') ? $this->searchAnnouncements($q) : [],
            'forums' => ($type === 'all' || $type === 'forums') ? $this->searchForums($q) : [],
            'profiles' => ($type === 'all' || $type === 'profiles') ? $this->searchProfiles($q) : [],
            'blogs' => ($type === 'all' || $type === 'blogs') ? $this->searchBlogs($q) : [],
            'events' => ($type === 'all' || $type === 'events') ? $this->searchEvents($q) : [],
            'resources' => ($type === 'all' || $type === 'resources') ? $this->searchResources($q) : [],
        ]);
    }

    private function searchAnnouncements(string $q): array
    {
        $announcements = Announcement::where('title', 'like', "%{$q}%")
            ->orWhere('subtitle', 'like', "%{$q}%")
            ->orWhere('excerpt', 'like', "%{$q}%")
            ->orWhere('content', 'like', "%{$q}%")
            ->orderBy('pinned', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return $announcements->map(function ($a) {
            return [
                'id' => $a->id,
                'title' => $a->title,
                'excerpt' => $a->excerpt,
                'category' => $a->category,
                'date' => $a->date,
            ];
        })->toArray();
    }

    private function searchForums(string $q): array
    {
        $threads = ForumThread::with(['user', 'category'])
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('content', 'like', "%{$q}%");
            })
            ->orderBy('is_pinned', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return $threads->map(function ($t) {
            return [
                'id' => $t->id,
                'title' => $t->title,
                'author' => $t->user ? $t->user->name : 'Anonymous',
                'replyCount' => $t->commentCount,
                'likes' => $t->voteScore,
                'createdAt' => $t->created_at ? $t->created_at->diffForHumans() : '',
            ];
        })->toArray();
    }

    private function searchProfiles(string $q): array
    {
        $profiles = User::where('status', 'approved')
            ->where(function ($query) use ($q) {
                $query->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('username', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('department', 'like', "%{$q}%")
                    ->orWhere('expertise', 'like', "%{$q}%");
            })
            ->limit(5)
            ->get();

        return $profiles->map(function ($p) {
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
        })->toArray();
    }

    private function searchBlogs(string $q): array
    {
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

        return $blogs->map(function ($b) {
            return [
                'id' => $b->id,
                'title' => $b->title,
                'excerpt' => $b->excerpt,
                'category' => $b->category,
                'date' => $b->date,
            ];
        })->toArray();
    }

    private function searchEvents(string $q): array
    {
        $events = Event::where(function ($query) use ($q) {
            $query->where('title', 'like', "%{$q}%")
                ->orWhere('description', 'like', "%{$q}%")
                ->orWhere('location', 'like', "%{$q}%");
        })
            ->orderBy('date', 'desc')
            ->limit(5)
            ->get();

        return $events->map(function ($e) {
            return [
                'id' => $e->id,
                'title' => $e->title,
                'description' => $e->description,
                'date' => $e->date ? $e->date->format('Y-m-d') : '',
                'type' => $e->type,
            ];
        })->toArray();
    }

    private function searchResources(string $q): array
    {
        $resources = Resource::where('status', 'approved')
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            })
            ->limit(5)
            ->get();

        return $resources->map(function ($r) {
            return [
                'id' => $r->id,
                'title' => $r->title,
                'description' => $r->description,
                'category' => $r->category,
                'icon' => $r->icon,
                'link' => $r->link ?? ($r->file_path ? asset('storage/' . $r->file_path) : '#'),
                'downloadCount' => $r->download_count,
                'voteScore' => $r->voteScore,
            ];
        })->toArray();
    }
}
