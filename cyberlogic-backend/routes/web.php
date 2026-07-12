<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\BlogPostController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ForumCategoryController;
use App\Http\Controllers\ForumCommentController;
use App\Http\Controllers\ForumThreadController;
use App\Http\Controllers\ForumVoteController;
use App\Http\Controllers\ForumPollController;
use App\Http\Controllers\SiteSettingController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\OfficerController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ReputationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Public API endpoints
Route::get('/api/csrf-cookie', function () {
    return response()->json([
        'csrf_token' => csrf_token(),
    ]);
});

Route::post('/api/register', [AuthController::class, 'register']);
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/api/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/api/site-settings', [SiteSettingController::class, 'index']);
Route::get('/api/club-stats', [SiteSettingController::class, 'getClubStats']);
Route::get('/api/officers', [OfficerController::class, 'index']);
Route::get('/api/officers/{id}', [OfficerController::class, 'show']);

Route::post('/api/internal/chat/messages/moderate', [ChatController::class, 'moderateMessage']);
Route::post('/api/internal/chat/messages/moderate-batch', [ChatController::class, 'moderateBatchMessages']);

Route::get('/api/announcements', [AnnouncementController::class, 'index']);
Route::get('/api/announcements/{id}', [AnnouncementController::class, 'show']);

Route::get('/api/blogs', [BlogPostController::class, 'index']);
Route::get('/api/blogs/{id}', [BlogPostController::class, 'show']);

Route::get('/api/events', [EventController::class, 'index']);
Route::get('/api/events/{id}', [EventController::class, 'show']);

// Public Forum API endpoints
Route::get('/api/forum/categories', [ForumCategoryController::class, 'index']);
Route::get('/api/forum/threads', [ForumThreadController::class, 'index']);
Route::get('/api/forum/threads/{id}', [ForumThreadController::class, 'show']);
Route::get('/api/forum/threads/{threadId}/comments', [ForumCommentController::class, 'index']);

// Public Resource API endpoints
Route::get('/api/resources', [ResourceController::class, 'index']);
Route::get('/api/resources/{id}', [ResourceController::class, 'show']);
Route::get('/api/resources/{id}/download', [ResourceController::class, 'download']);

// Authenticated API endpoints
Route::middleware('auth')->group(function () {
    Route::post('/api/logout', [AuthController::class, 'logout']);
    Route::get('/api/user', [AuthController::class, 'user']);
    Route::put('/api/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/api/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/api/user/avatar', [AuthController::class, 'uploadAvatar']);

    // Directory endpoints
    Route::get('/api/directory', [DirectoryController::class, 'index']);
    Route::get('/api/directory/{id}', [DirectoryController::class, 'show']);
    Route::get('/api/directory/username/{username}', [DirectoryController::class, 'showByUsername']);
    Route::get('/api/directory/{id}/activity', [DirectoryController::class, 'activity']);

    // Global Search endpoint
    Route::get('/api/search', [SearchController::class, 'search']);

    // User Management actions (Admin/Super Admin only)
    Route::get('/api/users', [AuthController::class, 'index']);
    Route::put('/api/users/{id}/role', [AuthController::class, 'updateRole']);
    Route::put('/api/users/{id}/approve', [AuthController::class, 'approve']);
    Route::put('/api/users/{id}/suspend', [AuthController::class, 'suspend']);
    Route::put('/api/users/{id}/unsuspend', [AuthController::class, 'unsuspend']);
    Route::delete('/api/users/{id}', [AuthController::class, 'destroy']);

    // CMS Blog Builder Actions protected by session auth and throttle limiters
    Route::post('/api/announcements', [AnnouncementController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/announcements/{id}', [AnnouncementController::class, 'update'])->middleware('throttle:10,1');
    Route::delete('/api/announcements/{id}', [AnnouncementController::class, 'destroy']);
    Route::post('/api/announcements/upload-image', [AnnouncementController::class, 'uploadImage'])->middleware('throttle:15,1');

    Route::post('/api/blogs', [BlogPostController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/blogs/{id}', [BlogPostController::class, 'update'])->middleware('throttle:10,1');
    Route::delete('/api/blogs/{id}', [BlogPostController::class, 'destroy']);
    Route::post('/api/blogs/upload-image', [BlogPostController::class, 'uploadImage'])->middleware('throttle:15,1');

    // Secure Event actions
    Route::post('/api/events/{id}/register', [EventController::class, 'register']);
    Route::post('/api/events/{id}/unregister', [EventController::class, 'unregister']);
    Route::post('/api/events', [EventController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/events/{id}', [EventController::class, 'update'])->middleware('throttle:10,1');
    Route::delete('/api/events/{id}', [EventController::class, 'destroy']);
    Route::get('/api/events/{id}/attendance-qr', [EventController::class, 'generateQr']);
    Route::post('/api/events/{id}/check-in', [EventController::class, 'checkIn']);
    Route::get('/api/events/{id}/attendees', [EventController::class, 'attendees']);
    Route::put('/api/events/{id}/status', [EventController::class, 'updateStatus']);

    // Secure Forum actions
    Route::post('/api/forum/threads', [ForumThreadController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/forum/threads/{id}', [ForumThreadController::class, 'update']);
    Route::delete('/api/forum/threads/{id}', [ForumThreadController::class, 'destroy']);
    Route::put('/api/forum/threads/{id}/pin', [ForumThreadController::class, 'togglePin']);
    Route::put('/api/forum/threads/{id}/close', [ForumThreadController::class, 'toggleClose']);
    Route::put('/api/forum/threads/{id}/solve', [ForumThreadController::class, 'toggleSolve']);
    Route::post('/api/forum/threads/{threadId}/comments', [ForumCommentController::class, 'store'])->middleware('throttle:30,1');
    Route::put('/api/forum/comments/{id}', [ForumCommentController::class, 'update']);
    Route::delete('/api/forum/comments/{id}', [ForumCommentController::class, 'destroy']);
    Route::post('/api/forum/threads/{id}/vote', [ForumVoteController::class, 'voteThread']);
    Route::post('/api/forum/comments/{id}/vote', [ForumVoteController::class, 'voteComment']);
    Route::post('/api/forum/polls/{pollId}/vote', [ForumPollController::class, 'vote']);
    Route::put('/api/forum/polls/{pollId}/close', [ForumPollController::class, 'close']);

    // Chat Actions
    Route::get('/api/chat/channels', [ChatController::class, 'index']);
    Route::get('/api/chat/channels/{slug}/messages', [ChatController::class, 'messages']);
    Route::post('/api/chat/channels/{slug}/read', [ChatController::class, 'markAsRead']);
    Route::post('/api/chat/messages/{messageId}/reactions', [ChatController::class, 'toggleReaction']);
    Route::delete('/api/chat/messages/{id}', [ChatController::class, 'deleteMessage']);
    Route::post('/api/chat/ticket', [ChatController::class, 'ticket']);
    Route::get('/api/chat/gifs', [ChatController::class, 'getGifs']);
    Route::post('/api/chat/gifs', [ChatController::class, 'storeGif']);

    // Admin Chat & Forum Category Actions
    Route::post('/api/admin/chat/channels', [ChatController::class, 'store']);
    Route::put('/api/admin/chat/channels/{id}', [ChatController::class, 'update']);
    Route::delete('/api/admin/chat/channels/{id}', [ChatController::class, 'destroy']);
    Route::put('/api/admin/chat/channels/reorder', [ChatController::class, 'reorder']);
    Route::post('/api/admin/chat/gifs', [ChatController::class, 'storeGif']);
    Route::delete('/api/admin/chat/gifs/{id}', [ChatController::class, 'destroyGif']);

    // Freedom Wall Moderation
    Route::get('/api/admin/chat/flagged', [ChatController::class, 'flaggedMessages']);
    Route::get('/api/admin/chat/moderation-stats', [ChatController::class, 'moderationStats']);
    Route::post('/api/admin/chat/messages/{id}/approve', [ChatController::class, 'approveFlaggedMessage']);
    Route::post('/api/admin/chat/messages/{id}/reject', [ChatController::class, 'rejectFlaggedMessage']);

    Route::post('/api/admin/forum/categories', [ForumCategoryController::class, 'store']);
    Route::put('/api/admin/forum/categories/{id}', [ForumCategoryController::class, 'update']);
    Route::delete('/api/admin/forum/categories/{id}', [ForumCategoryController::class, 'destroy']);
    Route::put('/api/admin/forum/categories/reorder', [ForumCategoryController::class, 'reorder']);

    Route::put('/api/admin/site-settings', [SiteSettingController::class, 'update']);
    Route::get('/api/admin/officers', [OfficerController::class, 'adminIndex']);
    Route::post('/api/admin/officers', [OfficerController::class, 'store']);
    Route::put('/api/admin/officers/reorder', [OfficerController::class, 'reorder']);
    Route::put('/api/admin/officers/{id}', [OfficerController::class, 'update']);
    Route::delete('/api/admin/officers/{id}', [OfficerController::class, 'destroy']);
    Route::post('/api/admin/officers/upload-avatar', [OfficerController::class, 'uploadAvatar']);
    Route::get('/api/admin/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/api/admin/audit-logs/stats', [AuditLogController::class, 'stats']);

    // Permission Management (Superadmin only)
    Route::get('/api/permissions', [AuthController::class, 'listPermissions']);
    Route::put('/api/users/{id}/position', [AuthController::class, 'updatePosition']);
    Route::put('/api/users/{id}/permissions', [AuthController::class, 'updatePermissions']);

    // Resource endpoints
    Route::get('/api/my-resources', [ResourceController::class, 'userIndex']);
    Route::post('/api/resources', [ResourceController::class, 'store']);
    Route::put('/api/resources/{id}', [ResourceController::class, 'update']);
    Route::delete('/api/resources/{id}', [ResourceController::class, 'destroy']);
    Route::post('/api/resources/{id}/vote', [ResourceController::class, 'vote']);

    // Admin resource moderation
    Route::put('/api/admin/resources/{id}/approve', [ResourceController::class, 'approve']);
    Route::put('/api/admin/resources/{id}/reject', [ResourceController::class, 'reject']);

    // Dashboard stats
    Route::get('/api/dashboard/stats', [DashboardController::class, 'getMemberStats']);
    Route::get('/api/admin/dashboard/stats', [DashboardController::class, 'getAdminStats']);

    // Notifications
    Route::get('/api/notifications', [NotificationController::class, 'index']);
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/api/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/api/notifications', [NotificationController::class, 'destroyAll']);

    // Reputation endpoints
    Route::get('/api/reputation/leaderboard', [ReputationController::class, 'leaderboard']);
    Route::get('/api/reputation/{id}', [ReputationController::class, 'show']);
});

Route::get('/storage/{path}', function ($path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }
    return response()->file(Storage::disk('public')->path($path));
})->where('path', '.*');

// React SPA fallback handler with dynamic SEO injection
Route::fallback(function (\Illuminate\Http\Request $request) {
    $indexPath = public_path('index.html');
    if (!file_exists($indexPath)) {
        return response('React frontend is not built yet. Please run "npm run build" in the frontend directory.', 404);
    }

    $html = file_get_contents($indexPath);

    // Default SEO values
    $title = "Cyberlogic Club Portal";
    $description = "Cyberlogic Club Portal — The premier student cybersecurity and technology club. Learn, compete, collaborate, and grow.";
    $keywords = ["cybersecurity", "coding", "programming", "student club", "tech portal", "tutorials", "bootcamps"];
    $image = asset('favicon.svg'); // Fallback image
    $type = "website";
    $url = $request->fullUrl();

    // Parse the path segments
    $path = trim($request->getPathInfo(), '/');
    
    // Ignore internal app routing paths that require authentication/portal context
    if (!str_starts_with($path, 'app/') && !str_starts_with($path, 'admin/') && !str_starts_with($path, 'portal/')) {
        $segments = explode('/', $path);
        
        if (count($segments) > 0 && !empty($segments[0])) {
            if ($segments[0] === 'blogs') {
                if (isset($segments[1]) && is_numeric($segments[1])) {
                    $post = \App\Models\BlogPost::find($segments[1]);
                    if ($post) {
                        $title = $post->title . " | Cyberlogic Club";
                        $description = $post->excerpt ?: substr(strip_tags($post->content), 0, 160);
                        if ($post->image) {
                            $image = asset('storage/' . $post->image);
                        }
                        $keywords = array_merge([$post->category, "Blog", "Cyberlogic Blog"], $post->tags ?: []);
                        $type = "article";
                    }
                } else {
                    $title = "Blogs & Tech Insights | Cyberlogic Club";
                    $description = "Read coding guides, hardware tips, cyber-security writeups, and academic news published by club officers and members.";
                }
            } elseif ($segments[0] === 'announcements') {
                if (isset($segments[1]) && is_numeric($segments[1])) {
                    $ann = \App\Models\Announcement::find($segments[1]);
                    if ($ann) {
                        $title = $ann->title . " | Cyberlogic Club";
                        $description = $ann->excerpt ?: substr(strip_tags($ann->content), 0, 160);
                        if ($ann->image) {
                            $image = asset('storage/' . $ann->image);
                        }
                        $keywords = [$ann->category, "Announcement", "Cyberlogic News", "Club Alert"];
                        $type = "article";
                    }
                } else {
                    $title = "Club Announcements | Cyberlogic Club";
                    $description = "Stay informed with the latest news, announcements, recruitment drives, and alerts from the Cyberlogic Club.";
                }
            } elseif ($segments[0] === 'events') {
                if (isset($segments[1]) && is_numeric($segments[1])) {
                    $event = \App\Models\Event::find($segments[1]);
                    if ($event) {
                        $title = $event->title . " | Cyberlogic Club";
                        $description = $event->description ? substr(strip_tags($event->description), 0, 160) : "Join us for " . $event->title;
                        if ($event->image) {
                            $image = asset('storage/' . $event->image);
                        }
                        $keywords = [$event->type, "Event", "Workshop", "Seminar", "Cyberlogic Event"];
                        $type = "event";
                    }
                } else {
                    $title = "Upcoming Events & Bootcamps | Cyberlogic Club";
                    $description = "Discover and join our workshops, seminars, competitions, hardware servicing meetups, and social gatherings.";
                }
            } elseif ($segments[0] === 'resources') {
                if (isset($segments[1]) && is_numeric($segments[1])) {
                    $res = \App\Models\Resource::find($segments[1]);
                    if ($res && $res->status === 'approved') {
                        $title = $res->title . " | Cyberlogic Club";
                        $description = $res->description ? substr(strip_tags($res->description), 0, 160) : "Download resource: " . $res->title;
                        $keywords = [$res->category, "Resource", "Tool", "Tutorial", "Cyberlogic Resource"];
                        $type = "object";
                    }
                } else {
                    $title = "Learning Resources & Tools | Cyberlogic Club";
                    $description = "Access templates, cheat sheets, guidelines, setup instructions, cybersecurity tools, and tutorials curated by Cyberlogic.";
                }
            } elseif ($segments[0] === 'about') {
                if (isset($segments[1]) && $segments[1] === 'officers' && isset($segments[2]) && is_numeric($segments[2])) {
                    $officer = \App\Models\Officer::with('user')->find($segments[2]);
                    if ($officer) {
                        $title = $officer->name . " — " . $officer->role . " | Cyberlogic Club";
                        $description = $officer->bio ?: "Meet " . $officer->name . ", " . $officer->role . " at Cyberlogic Club.";
                        $image = $officer->avatar;
                        $keywords = [$officer->role, "Officer Profile", "Cyberlogic Officer", "Team Member"];
                        $type = "profile";
                    }
                } else {
                    $title = "About Us & Club History | Cyberlogic Club";
                    
                    // Fetch dynamic settings from database for About description
                    $mission = \App\Models\SiteSetting::where('key', 'about_mission')->value('value');
                    $vision = \App\Models\SiteSetting::where('key', 'about_vision')->value('value');
                    if ($mission && $vision) {
                        $description = substr(strip_tags("Mission: " . $mission . " | Vision: " . $vision), 0, 160);
                    } else {
                        $description = "Learn about the history, mission, vision, values, and leadership team of Cyberlogic Club.";
                    }
                    $keywords = ["about us", "club history", "officers", "organization mission", "student organization"];
                }
            }
        } else {
            // Landing page default description can also be customized by site settings mission
            $mission = \App\Models\SiteSetting::where('key', 'about_mission')->value('value');
            if ($mission) {
                $description = substr(strip_tags($mission), 0, 160);
            }
        }
    }

    // Escape variables
    $title = e($title);
    $description = e($description);
    $image = e($image);
    $url = e($url);
    $keywordsStr = e(implode(', ', $keywords));

    // Replace Title
    $html = preg_replace('/<title>.*?<\/title>/i', "<title>{$title}</title>", $html);

    // Replace Description
    $html = preg_replace(
        '/<meta name="description" content=".*?"\s*\/?>/i',
        "<meta name=\"description\" content=\"{$description}\" />",
        $html
    );

    // Replace or Inject Keywords (check if exists first)
    if (preg_match('/<meta name="keywords" content=".*?"\s*\/?>/i', $html)) {
        $html = preg_replace(
            '/<meta name="keywords" content=".*?"\s*\/?>/i',
            "<meta name=\"keywords\" content=\"{$keywordsStr}\" />",
            $html
        );
    } else {
        $keywordsMeta = "<meta name=\"keywords\" content=\"{$keywordsStr}\" />";
        $html = str_replace('</head>', $keywordsMeta . "\n</head>", $html);
    }

    // Construct social meta tags
    $seoTags = "
    <!-- Dynamic SEO Optimization (Antigravity Agent) -->
    <meta property=\"og:title\" content=\"{$title}\" />
    <meta property=\"og:description\" content=\"{$description}\" />
    <meta property=\"og:image\" content=\"{$image}\" />
    <meta property=\"og:type\" content=\"{$type}\" />
    <meta property=\"og:url\" content=\"{$url}\" />
    <meta property=\"og:site_name\" content=\"Cyberlogic Club\" />
    <meta name=\"twitter:card\" content=\"summary_large_image\" />
    <meta name=\"twitter:title\" content=\"{$title}\" />
    <meta name=\"twitter:description\" content=\"{$description}\" />
    <meta name=\"twitter:image\" content=\"{$image}\" />
    ";

    // Inject tags right before </head>
    $html = str_replace('</head>', $seoTags . "\n</head>", $html);

    return response($html);
});
