<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Services\ImageOptimizer;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BlogPostController extends Controller
{
    /**
     * RBAC Protection Gate
     * Aborts request with 403 if user lacks required admin/officer credentials.
     */
    private function authorizeRbac(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_blogs')) {
            abort(response()->json([
                'error' => 'Forbidden. You do not have permission to manage blog posts.'
            ], 403));
        }
    }

    /**
     * XSS Scrubber
     * Sanitizes HTML contentEditable nodes to remove script blocks, event listeners, and javascript links.
     */
    private function sanitizeHtml(?string $html): string
    {
        if (empty($html)) {
            return '';
        }
        // 1. Scrub script tags and inner contents
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        // 2. Scrub event hooks (onclick, onerror, onload, onmouseover, etc.)
        $html = preg_replace('/on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
        $html = preg_replace('/on\w+\s*=\s*\S+/i', '', $html);
        // 3. Scrub javascript: link handlers
        $html = preg_replace('/href\s*=\s*["\']\s*javascript:[^"\']*["\']/i', '', $html);
        
        return $html;
    }

    /**
     * GET /api/blogs
     * Retrieve all blog posts.
     */
    public function index(Request $request)
    {
        $query = BlogPost::with('user')
            ->orderBy('featured', 'desc')
            ->orderBy('id', 'desc');

        $user = $request->user();
        if ($request->query('status') === 'all' && $user && $user->hasPermission('manage_blogs')) {
            // Return all posts for authorized users
        } elseif ($request->has('status') && in_array($request->query('status'), ['published', 'draft', 'pending', 'rejected']) && $user && $user->hasPermission('manage_blogs')) {
            $query->where('status', $request->query('status'));
        } else {
            $query->where('status', 'published');
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/blogs/{id}
     * Retrieve a specific blog post.
     */
    public function show($id)
    {
        $blog = BlogPost::with('user')->findOrFail($id);
        return response()->json($blog);
    }

    /**
     * POST /api/blogs
     * Create a new blog post.
     */
    public function store(Request $request)
    {
        $this->authorizeRbac($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'excerpt' => 'required|string|max:1000',
            'content' => 'nullable|string',
            'category' => 'required|string|in:Tech,Tutorial,News,Lifestyle,General,Academic',
            'user_id' => 'nullable|integer|exists:users,id',
            'featured' => 'nullable|boolean',
            'status' => 'nullable|string|in:published,draft,pending,rejected',
            'sections' => 'nullable|array',
            'tags' => 'nullable|array',
            'image' => 'nullable|string|max:2048',
            'read_time' => 'nullable|string|max:50',
        ]);

        // Process sections: sanitize html nodes for XSS protection
        $sections = $request->input('sections', []);
        if (is_array($sections)) {
            foreach ($sections as &$section) {
                if (isset($section['type']) && $section['type'] === 'text' && isset($section['html'])) {
                    $section['html'] = $this->sanitizeHtml($section['html']);
                }
            }
        }

        $currentUser = $request->user();
        if ($currentUser->role === 'superadmin') {
            $targetUserId = $validated['user_id'] ?? $currentUser->id;
            $targetUser = \App\Models\User::find($targetUserId) ?: $currentUser;
            $authorName = $targetUser->name;
            $authorAvatar = $targetUser->avatar;
        } else {
            $targetUserId = $currentUser->id;
            $authorName = $currentUser->name;
            $authorAvatar = $currentUser->avatar;
        }

        // Map values
        $blog = BlogPost::create([
            'user_id' => $targetUserId,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'excerpt' => $validated['excerpt'],
            'content' => $validated['content'] ?? '',
            'category' => $validated['category'],
            'author' => $authorName,
            'author_avatar' => $authorAvatar,
            'date' => now()->format('M j, Y'),
            'tags' => $validated['tags'] ?? [],
            'featured' => $validated['featured'] ?? false,
            'status' => $validated['status'] ?? 'published',
            'sections' => $sections,
            'image' => $validated['image'] ?? null,
            'read_time' => $validated['read_time'] ?? '5 min',
        ]);

        AuditLogger::log('created', 'BlogPost', $blog->id, $blog->title, null, $request);

        return response()->json($blog, 201); // Created
    }

    /**
     * PUT /api/blogs/{id}
     * Update a blog post.
     */
    public function update(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $blog = BlogPost::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'excerpt' => 'required|string|max:1000',
            'content' => 'nullable|string',
            'category' => 'required|string|in:Tech,Tutorial,News,Lifestyle,General,Academic',
            'user_id' => 'nullable|integer|exists:users,id',
            'featured' => 'nullable|boolean',
            'status' => 'nullable|string|in:published,draft,pending,rejected',
            'sections' => 'nullable|array',
            'tags' => 'nullable|array',
            'image' => 'nullable|string|max:2048',
            'read_time' => 'nullable|string|max:50',
        ]);

        // Process sections: sanitize html nodes for XSS protection
        $sections = $request->input('sections', []);
        if (is_array($sections)) {
            foreach ($sections as &$section) {
                if (isset($section['type']) && $section['type'] === 'text' && isset($section['html'])) {
                    $section['html'] = $this->sanitizeHtml($section['html']);
                }
            }
        }

        $currentUser = $request->user();
        if ($currentUser->role === 'superadmin') {
            $targetUserId = $validated['user_id'] ?? ($blog->user_id ?? $currentUser->id);
            $targetUser = \App\Models\User::find($targetUserId) ?: $currentUser;
            $authorName = $targetUser->name;
            $authorAvatar = $targetUser->avatar;
        } else {
            $targetUserId = $blog->user_id ?: $currentUser->id;
            $authorName = $blog->author;
            $authorAvatar = $blog->author_avatar;
        }

        $blog->update([
            'user_id' => $targetUserId,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'excerpt' => $validated['excerpt'],
            'content' => $validated['content'] ?? '',
            'category' => $validated['category'],
            'author' => $authorName,
            'author_avatar' => $authorAvatar,
            'tags' => $validated['tags'] ?? $blog->tags,
            'featured' => $validated['featured'] ?? false,
            'status' => $validated['status'] ?? $blog->status,
            'sections' => $sections,
            'image' => $validated['image'] ?? $blog->image,
            'read_time' => $validated['read_time'] ?? $blog->read_time,
        ]);

        AuditLogger::log('updated', 'BlogPost', $blog->id, $blog->title, null, $request);

        return response()->json($blog);
    }

    /**
     * DELETE /api/blogs/{id}
     * Delete a blog post.
     */
    public function destroy(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $blog = BlogPost::findOrFail($id);
        $blogId = $blog->id;
        $blogTitle = $blog->title;
        $blog->delete();

        AuditLogger::log('deleted', 'BlogPost', $blogId, $blogTitle, null, $request);

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/blogs/upload-image
     * Securely store an image file under public assets.
     */
    public function uploadImage(Request $request)
    {
        $this->authorizeRbac($request);

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,jpg,gif|max:5120',
        ]);

        if ($request->file('image')->isValid()) {
            $path = ImageOptimizer::optimize($request->file('image'), 'blogs');
            
            AuditLogger::log('uploaded', 'BlogPost', null, 'BlogPost Image', ['path' => $path], $request);

            return response()->json([
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['error' => 'Failed to upload image.'], 400);
    }

    /**
     * GET /api/my-blogs
     * Retrieve all blog posts authored by the authenticated user.
     */
    public function myBlogs(Request $request)
    {
        $blogs = BlogPost::where('user_id', $request->user()->id)
            ->with('user')
            ->orderBy('id', 'desc')
            ->get();
        return response()->json($blogs);
    }

    /**
     * POST /api/member/blogs
     * Create a new blog post submission (pending or draft).
     */
    public function memberStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'excerpt' => 'required|string|max:1000',
            'content' => 'nullable|string',
            'category' => 'required|string|in:Tech,Tutorial,News,Lifestyle,General,Academic',
            'status' => 'required|string|in:pending,draft',
            'sections' => 'nullable|array',
            'tags' => 'nullable|array',
            'image' => 'nullable|string|max:2048',
            'read_time' => 'nullable|string|max:50',
        ]);

        $sections = $request->input('sections', []);
        if (is_array($sections)) {
            foreach ($sections as &$section) {
                if (isset($section['type']) && $section['type'] === 'text' && isset($section['html'])) {
                    $section['html'] = $this->sanitizeHtml($section['html']);
                }
            }
        }

        $currentUser = $request->user();

        $blog = BlogPost::create([
            'user_id' => $currentUser->id,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'excerpt' => $validated['excerpt'],
            'content' => $validated['content'] ?? '',
            'category' => $validated['category'],
            'author' => $currentUser->name,
            'author_avatar' => $currentUser->avatar_path ? asset('storage/' . $currentUser->avatar_path) : 'https://api.dicebear.com/9.x/avataaars/svg?seed=' . urlencode($currentUser->first_name),
            'date' => now()->format('M j, Y'),
            'tags' => $validated['tags'] ?? [],
            'featured' => false,
            'status' => $validated['status'],
            'sections' => $sections,
            'image' => $validated['image'] ?? null,
            'read_time' => $validated['read_time'] ?? '5 min',
        ]);

        AuditLogger::log('submitted', 'BlogPost', $blog->id, $blog->title, ['status' => $blog->status], $request);

        if ($blog->status === 'pending') {
            \App\Services\NotificationService::notifyAdmins(
                'blog_submission',
                'New Blog Submission',
                "{$currentUser->name} submitted a blog post: \"{$blog->title}\" for approval.",
                ['blog_id' => $blog->id],
                'file-text',
                '/admin/blogs'
            );
        }

        return response()->json($blog, 201);
    }

    /**
     * PUT /api/member/blogs/{id}
     * Update an existing member-owned blog post (only if status is pending, rejected, or draft).
     */
    public function memberUpdate(Request $request, $id)
    {
        $blog = BlogPost::findOrFail($id);

        if ($blog->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized. You do not own this blog post.'], 403);
        }

        if ($blog->status === 'published') {
            return response()->json(['error' => 'Forbidden. Published blog posts cannot be modified by members directly.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'excerpt' => 'required|string|max:1000',
            'content' => 'nullable|string',
            'category' => 'required|string|in:Tech,Tutorial,News,Lifestyle,General,Academic',
            'status' => 'required|string|in:pending,draft',
            'sections' => 'nullable|array',
            'tags' => 'nullable|array',
            'image' => 'nullable|string|max:2048',
            'read_time' => 'nullable|string|max:50',
        ]);

        $sections = $request->input('sections', []);
        if (is_array($sections)) {
            foreach ($sections as &$section) {
                if (isset($section['type']) && $section['type'] === 'text' && isset($section['html'])) {
                    $section['html'] = $this->sanitizeHtml($section['html']);
                }
            }
        }

        $oldStatus = $blog->status;

        $blog->update([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'excerpt' => $validated['excerpt'],
            'content' => $validated['content'] ?? '',
            'category' => $validated['category'],
            'status' => $validated['status'],
            'sections' => $sections,
            'tags' => $validated['tags'] ?? $blog->tags,
            'image' => $validated['image'] ?? $blog->image,
            'read_time' => $validated['read_time'] ?? $blog->read_time,
        ]);

        AuditLogger::log('updated', 'BlogPost', $blog->id, $blog->title, ['status' => $blog->status], $request);

        if ($blog->status === 'pending' && $oldStatus !== 'pending') {
            \App\Services\NotificationService::notifyAdmins(
                'blog_submission',
                'New Blog Submission',
                "{$request->user()->name} submitted a blog post: \"{$blog->title}\" for approval.",
                ['blog_id' => $blog->id],
                'file-text',
                '/admin/blogs'
            );
        }

        return response()->json($blog);
    }

    /**
     * DELETE /api/member/blogs/{id}
     * Delete an existing member-owned blog post (only if status is pending, rejected, or draft).
     */
    public function memberDestroy(Request $request, $id)
    {
        $blog = BlogPost::findOrFail($id);

        if ($blog->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized. You do not own this blog post.'], 403);
        }

        if ($blog->status === 'published') {
            return response()->json(['error' => 'Forbidden. Published blog posts cannot be deleted by members directly.'], 403);
        }

        $blogId = $blog->id;
        $blogTitle = $blog->title;
        $blog->delete();

        AuditLogger::log('deleted', 'BlogPost', $blogId, $blogTitle, null, $request);

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/member/blogs/upload-image
     * Securely store an image file for regular members.
     */
    public function memberUploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,jpg,gif|max:5120',
        ]);

        if ($request->file('image')->isValid()) {
            $path = ImageOptimizer::optimize($request->file('image'), 'blogs');
            
            AuditLogger::log('uploaded', 'BlogPost', null, 'Member BlogPost Image', ['path' => $path], $request);

            return response()->json([
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['error' => 'Failed to upload image.'], 400);
    }

    /**
     * PUT /api/admin/blogs/{id}/approve
     * Approve a pending blog post to publish it.
     */
    public function approveBlog(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $blog = BlogPost::findOrFail($id);
        $blog->update([
            'status' => 'published',
            'date' => now()->format('M j, Y'),
        ]);

        AuditLogger::log('approved', 'BlogPost', $blog->id, $blog->title, null, $request);

        if ($blog->user_id) {
            \App\Services\NotificationService::notifyUser(
                $blog->user_id,
                'blog_approved',
                'Blog Approved & Published!',
                "Your blog post \"{$blog->title}\" has been approved by the administrators.",
                ['blog_id' => $blog->id],
                'check-circle',
                "/blogs/{$blog->id}"
            );
        }

        return response()->json($blog);
    }

    /**
     * PUT /api/admin/blogs/{id}/reject
     * Reject a pending blog post.
     */
    public function rejectBlog(Request $request, $id)
    {
        $this->authorizeRbac($request);

        $blog = BlogPost::findOrFail($id);
        $blog->update([
            'status' => 'rejected',
        ]);

        AuditLogger::log('rejected', 'BlogPost', $blog->id, $blog->title, null, $request);

        if ($blog->user_id) {
            \App\Services\NotificationService::notifyUser(
                $blog->user_id,
                'blog_rejected',
                'Blog Post Rejected',
                "Your blog post \"{$blog->title}\" was rejected during review.",
                ['blog_id' => $blog->id],
                'x-circle',
                "/app/blogs"
            );
        }

        return response()->json($blog);
    }
}
