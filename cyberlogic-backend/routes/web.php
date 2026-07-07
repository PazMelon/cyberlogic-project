<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ForumCategoryController;
use App\Http\Controllers\ForumCommentController;
use App\Http\Controllers\ForumThreadController;
use App\Http\Controllers\ForumVoteController;
use App\Http\Controllers\SiteSettingController;
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
Route::get('/api/site-settings', [SiteSettingController::class, 'index']);

Route::get('/api/announcements', [AnnouncementController::class, 'index']);
Route::get('/api/announcements/{id}', [AnnouncementController::class, 'show']);

Route::get('/api/events', [EventController::class, 'index']);
Route::get('/api/events/{id}', [EventController::class, 'show']);

// Public Forum API endpoints
Route::get('/api/forum/categories', [ForumCategoryController::class, 'index']);
Route::get('/api/forum/threads', [ForumThreadController::class, 'index']);
Route::get('/api/forum/threads/{id}', [ForumThreadController::class, 'show']);
Route::get('/api/forum/threads/{threadId}/comments', [ForumCommentController::class, 'index']);

// Authenticated API endpoints
Route::middleware('auth')->group(function () {
    Route::post('/api/logout', [AuthController::class, 'logout']);
    Route::get('/api/user', [AuthController::class, 'user']);
    Route::put('/api/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/api/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/api/user/avatar', [AuthController::class, 'uploadAvatar']);

    // User Management actions (Admin/Super Admin only)
    Route::get('/api/users', [AuthController::class, 'index']);
    Route::put('/api/users/{id}/role', [AuthController::class, 'updateRole']);
    Route::put('/api/users/{id}/approve', [AuthController::class, 'approve']);
    Route::delete('/api/users/{id}', [AuthController::class, 'destroy']);

    // CMS Blog Builder Actions protected by session auth and throttle limiters
    Route::post('/api/announcements', [AnnouncementController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/announcements/{id}', [AnnouncementController::class, 'update'])->middleware('throttle:10,1');
    Route::delete('/api/announcements/{id}', [AnnouncementController::class, 'destroy']);
    Route::post('/api/announcements/upload-image', [AnnouncementController::class, 'uploadImage'])->middleware('throttle:15,1');

    // Secure Event actions
    Route::post('/api/events/{id}/register', [EventController::class, 'register']);
    Route::post('/api/events/{id}/unregister', [EventController::class, 'unregister']);
    Route::post('/api/events', [EventController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/events/{id}', [EventController::class, 'update'])->middleware('throttle:10,1');
    Route::delete('/api/events/{id}', [EventController::class, 'destroy']);

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

    // Chat Actions
    Route::get('/api/chat/channels', [ChatController::class, 'index']);
    Route::get('/api/chat/channels/{slug}/messages', [ChatController::class, 'messages']);
    Route::post('/api/chat/messages/{messageId}/reactions', [ChatController::class, 'toggleReaction']);
    Route::post('/api/chat/ticket', [ChatController::class, 'ticket']);

    // Admin Chat & Forum Category Actions
    Route::post('/api/admin/chat/channels', [ChatController::class, 'store']);
    Route::put('/api/admin/chat/channels/{id}', [ChatController::class, 'update']);
    Route::delete('/api/admin/chat/channels/{id}', [ChatController::class, 'destroy']);
    Route::put('/api/admin/chat/channels/reorder', [ChatController::class, 'reorder']);

    Route::post('/api/admin/forum/categories', [ForumCategoryController::class, 'store']);
    Route::put('/api/admin/forum/categories/{id}', [ForumCategoryController::class, 'update']);
    Route::delete('/api/admin/forum/categories/{id}', [ForumCategoryController::class, 'destroy']);
    Route::put('/api/admin/forum/categories/reorder', [ForumCategoryController::class, 'reorder']);

    Route::put('/api/admin/site-settings', [SiteSettingController::class, 'update']);
});

// Serve storage files programmatically if the symlink is broken/missing
Route::get('/storage/{path}', function ($path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }
    return Storage::disk('public')->response($path);
})->where('path', '.*');

// React SPA fallback handler
Route::fallback(function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return file_get_contents($indexPath);
    }

    return response('React frontend is not built yet. Please run "npm run build" in the frontend directory.', 404);
});
