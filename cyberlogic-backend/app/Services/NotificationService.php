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

    public static function notifyMentions(string $content, User $author, string $type, string $title, string $body, ?array $data = null, ?string $icon = null, ?string $link = null): void
    {
        $mentionTargetUserIds = [];

        // Group Mentions
        if (str_contains($content, '@everyone')) {
            $ids = User::where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@officers')) {
            $ids = User::whereIn('role', ['admin', 'superadmin'])->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@firstyear')) {
            $ids = User::where('year_level', '1st Year')->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@secondyear')) {
            $ids = User::where('year_level', '2nd Year')->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@thirdyear')) {
            $ids = User::where('year_level', '3rd Year')->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@fourthyear')) {
            $ids = User::where('year_level', '4th Year')->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@fifthyear')) {
            $ids = User::where('year_level', '5th Year')->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }
        if (str_contains($content, '@graduate')) {
            $ids = User::where('year_level', 'Graduate')->where('status', 'approved')->pluck('id')->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }

        // Individual Mentions
        preg_match_all('/@([a-zA-Z0-9_\-\.]+)/', $content, $matches);
        if (!empty($matches[1])) {
            $usernames = array_unique($matches[1]);
            $ids = User::whereIn('username', $usernames)
                ->where('status', 'approved')
                ->pluck('id')
                ->toArray();
            $mentionTargetUserIds = array_merge($mentionTargetUserIds, $ids);
        }

        // Exclude the author, deduplicate
        $mentionTargetUserIds = array_unique($mentionTargetUserIds);
        $mentionTargetUserIds = array_filter($mentionTargetUserIds, function($id) use ($author) {
            return $id != $author->id;
        });

        foreach ($mentionTargetUserIds as $userId) {
            self::notifyUser(
                $userId,
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
