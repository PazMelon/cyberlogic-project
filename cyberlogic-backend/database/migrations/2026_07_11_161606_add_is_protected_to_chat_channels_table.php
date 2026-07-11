<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chat_channels', function (Blueprint $table) {
            $table->boolean('is_protected')->default(false)->after('is_archived');
        });

        // Automatically seed/insert the protected Activity Log system channel
        Illuminate\Support\Facades\DB::table('chat_channels')->updateOrInsert(
            ['slug' => 'activity-log'],
            [
                'name' => 'Activity Log',
                'description' => 'Automated activity feed — tracks member logins, session durations, and presence.',
                'type' => 'group',
                'icon' => 'Activity',
                'grouping' => 'System',
                'sort_order' => 0,
                'allowed_roles' => json_encode(['member', 'officer', 'admin', 'superadmin']),
                'write_roles' => json_encode([]),
                'is_protected' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete the auto-created channel
        Illuminate\Support\Facades\DB::table('chat_channels')->where('slug', 'activity-log')->delete();

        Schema::table('chat_channels', function (Blueprint $table) {
            $table->dropColumn('is_protected');
        });
    }
};
