<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
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
        if (! $user || ! in_array($user->role, ['admin', 'superadmin'])) {
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

        $settings = SiteSetting::all()->pluck('value', 'key');
        return response()->json([
            'message' => 'Site settings updated successfully',
            'settings' => $settings
        ]);
    }
}
