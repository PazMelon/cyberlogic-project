<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Routes that should bypass maintenance mode checks for all users/guests.
     *
     * @var array<int, string>
     */
    protected array $exceptRoutes = [
        'api/csrf-cookie',
        'api/login',
        'api/logout',
        'api/user',
        'api/site-settings',
        'api/maintenance-status',
        'api/admin/maintenance-status',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->checkAndTriggerAutoBackup();

        $maintenanceSetting = SiteSetting::where('key', 'maintenance_mode')->first();
        $isMaintenanceActive = $maintenanceSetting && $maintenanceSetting->value === 'true';

        if (!$isMaintenanceActive) {
            return $next($request);
        }

        // Check if the current route is exempted (like auth or maintenance status APIs)
        foreach ($this->exceptRoutes as $except) {
            if ($request->is($except)) {
                return $next($request);
            }
        }

        // Resolve authenticated user from request session or Sanctum guard
        $user = $request->user();
        if (!$user && auth()->check()) {
            $user = auth()->user();
        }

        // Superadmin bypasses all lockdown restrictions
        if ($user && ($user->isSuperAdmin() || $user->role === 'superadmin')) {
            return $next($request);
        }

        $title = SiteSetting::where('key', 'maintenance_title')->value('value') ?: 'Website Lockdown / Maintenance';
        $reason = SiteSetting::where('key', 'maintenance_reason')->value('value') ?: 'System maintenance is currently in progress. Please check back later.';
        $template = SiteSetting::where('key', 'maintenance_template')->value('value') ?: 'scheduled_maintenance';
        $estimatedEnd = SiteSetting::where('key', 'maintenance_estimated_end')->value('value') ?: null;

        return response()->json([
            'in_maintenance' => true,
            'message' => $reason,
            'title' => $title,
            'template' => $template,
            'estimated_end' => $estimatedEnd,
        ], 503);
    }

    /**
     * Failsafe check for Laragon Windows environment:
     * Triggers daily automated backup & pruning if current time >= scheduled time and hasn't run today.
     */
    private function checkAndTriggerAutoBackup(): void
    {
        try {
            $enabled = SiteSetting::where('key', 'auto_backup_enabled')->value('value') !== 'false';
            if (!$enabled) return;

            $scheduledTime = SiteSetting::where('key', 'auto_backup_time')->value('value') ?: '02:00';
            $lastRun = SiteSetting::where('key', 'auto_backup_last_run')->value('value') ?: '';
            $todayStr = date('Y-m-d');

            if ($lastRun === $todayStr) return;

            $currentTime = date('H:i');
            if ($currentTime >= $scheduledTime) {
                $controller = new \App\Http\Controllers\DatabaseBackupController();
                $controller->runAutoBackupJob();
            }
        } catch (\Throwable $e) {
            // Ignore failsafe errors to avoid blocking HTTP requests
        }
    }
}
