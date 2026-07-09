<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    /**
     * Get all public site settings.
     */
    public function index(): JsonResponse
    {
        $settings = SiteSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update site settings (Admin/Superadmin only).
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->hasPermission('manage_settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            SiteSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        AuditLogger::log('updated', 'SiteSetting', null, 'Site Settings Config', [
            'updated_keys' => array_keys($validated['settings'])
        ], $request);

        $settings = SiteSetting::all()->pluck('value', 'key');
        return response()->json([
            'message' => 'Site settings updated successfully',
            'settings' => $settings
        ]);
    }

    /**
     * GET /api/club-stats
     * Retrieve cached statistics.
     */
    public function getClubStats(): JsonResponse
    {
        $cachedAtSetting = SiteSetting::where('key', 'metrics_cached_at')->first();
        $cachedAt = $cachedAtSetting ? (int) $cachedAtSetting->value : 0;
        $now = time();

        // 15 minutes cache (900 seconds)
        if (!$cachedAtSetting || ($now - $cachedAt) > 900) {
            $membersCount = \App\Models\User::where('status', 'approved')->count();
            $eventsCount = \App\Models\Event::count();
            $projectsCount = \App\Models\Resource::count();
            
            $awardsSetting = SiteSetting::where('key', 'metrics_awards')->first();
            $awardsCount = $awardsSetting ? (int) $awardsSetting->value : 8;

            SiteSetting::updateOrCreate(['key' => 'metrics_members'], ['value' => (string) $membersCount]);
            SiteSetting::updateOrCreate(['key' => 'metrics_events'], ['value' => (string) $eventsCount]);
            SiteSetting::updateOrCreate(['key' => 'metrics_projects'], ['value' => (string) $projectsCount]);
            SiteSetting::updateOrCreate(['key' => 'metrics_awards'], ['value' => (string) $awardsCount]);
            SiteSetting::updateOrCreate(['key' => 'metrics_cached_at'], ['value' => (string) $now]);
        }

        $members = (int) SiteSetting::where('key', 'metrics_members')->value('value') ?: 0;
        $events = (int) SiteSetting::where('key', 'metrics_events')->value('value') ?: 0;
        $projects = (int) SiteSetting::where('key', 'metrics_projects')->value('value') ?: 0;
        $awards = (int) SiteSetting::where('key', 'metrics_awards')->value('value') ?: 8;

        return response()->json([
            'members' => $members,
            'events' => $events,
            'projects' => $projects,
            'awards' => $awards,
        ]);
    }
}
