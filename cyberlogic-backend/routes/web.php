<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnnouncementController;

// Public API endpoints
Route::get('/api/csrf-cookie', function () {
    return response()->json([
        'csrf_token' => csrf_token()
    ]);
});

Route::post('/api/register', [AuthController::class, 'register']);
Route::post('/api/login', [AuthController::class, 'login']);

Route::get('/api/announcements', [AnnouncementController::class, 'index']);
Route::get('/api/announcements/{id}', [AnnouncementController::class, 'show']);

// Authenticated API endpoints
Route::middleware('auth')->group(function () {
    Route::post('/api/logout', [AuthController::class, 'logout']);
    Route::get('/api/user', [AuthController::class, 'user']);
    
    // User Management actions (Admin/Super Admin only)
    Route::get('/api/users', [AuthController::class, 'index']);
    Route::put('/api/users/{id}/role', [AuthController::class, 'updateRole']);
    
    // CMS Blog Builder Actions protected by session auth and throttle limiters
    Route::post('/api/announcements', [AnnouncementController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/api/announcements/{id}', [AnnouncementController::class, 'update'])->middleware('throttle:10,1');
    Route::delete('/api/announcements/{id}', [AnnouncementController::class, 'destroy']);
    Route::post('/api/announcements/upload-image', [AnnouncementController::class, 'uploadImage'])->middleware('throttle:15,1');
});

// React SPA fallback handler
Route::fallback(function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return file_get_contents($indexPath);
    }
    return response('React frontend is not built yet. Please run "npm run build" in the frontend directory.', 404);
});
