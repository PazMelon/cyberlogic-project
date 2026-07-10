<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get the notifications for the authenticated user with optional pagination.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->input('limit', 20);
        $cursor = $request->input('cursor');

        $query = Notification::where('user_id', Auth::id())
            ->orderBy('id', 'desc');

        if ($cursor) {
            $query->where('id', '<', $cursor);
        }

        $notifications = $query->limit($limit)->get();

        $nextCursor = null;
        if ($notifications->count() === $limit) {
            $nextCursor = $notifications->last()->id;
        }

        return response()->json([
            'data' => $notifications,
            'next_cursor' => $nextCursor
        ]);
    }

    /**
     * Get count of unread notifications for the authenticated user.
     */
    public function getUnreadCount(Request $request)
    {
        $count = Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete a single notification.
     */
    public function destroy($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Delete all notifications for the authenticated user.
     */
    public function destroyAll()
    {
        Notification::where('user_id', Auth::id())->delete();

        return response()->json(['success' => true]);
    }
}
