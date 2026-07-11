<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Services\RealtimeService;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Notify a single user.
     */
    public static function notifyUser(int $userId, string $type, string $title, string $body, ?array $data = null, ?string $icon = null, ?string $link = null): ?Notification
    {
        try {
            $notif = Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'icon' => $icon,
                'link' => $link,
                'data' => $data,
            ]);

            RealtimeService::broadcast(
                'notifications',
                $notif->toArray(),
                'new_notification',
                $userId
            );

            return $notif;
        } catch (\Throwable $e) {
            Log::error("Failed to notify user {$userId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Notify all approved members.
     */
    public static function notifyAllMembers(string $type, string $title, string $body, ?array $data = null, ?string $icon = null, ?string $link = null): void
    {
        try {
            $approvedUsers = User::where('status', 'approved')->get();
            foreach ($approvedUsers as $u) {
                self::notifyUser($u->id, $type, $title, $body, $data, $icon, $link);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to notify all members: " . $e->getMessage());
        }
    }

    /**
     * Notify admins/superadmins (depending on permission).
     */
    public static function notifyAdmins(string $type, string $title, string $body, ?array $data = null, ?string $icon = null, ?string $link = null, ?string $permissionKey = null): void
    {
        try {
            $admins = User::whereIn('role', ['admin', 'superadmin'])
                ->where('status', 'approved')
                ->get();

            foreach ($admins as $admin) {
                if ($permissionKey && !$admin->hasPermission($permissionKey)) {
                    continue;
                }
                self::notifyUser($admin->id, $type, $title, $body, $data, $icon, $link);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to notify admins: " . $e->getMessage());
        }
    }

    /**
     * Parse mentions from content and notify mentioned users.
     */
    public static function notifyMentions(string $content, User $author, string $type, string $title, string $body, ?array $data = null, ?string $icon = null, ?string $link = null): void
    {
        preg_match_all('/@([a-zA-Z0-9_\-\.]+)/', $content, $matches);
        if (!empty($matches[1])) {
            $usernames = array_unique($matches[1]);
            // Exclude author
            $mentionedUsers = User::whereIn('username', $usernames)
                ->where('id', '!=', $author->id)
                ->where('status', 'approved')
                ->get();

            foreach ($mentionedUsers as $user) {
                self::notifyUser(
                    $user->id,
                    $type,
                    $title,
                    $body,
                    $data,
                    $icon ?? 'at-sign',
                    $link
                );
            }
        }
    }
}
