<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->boolean('is_flagged')->default(false)->after('type');
            $table->string('flagged_reason')->nullable()->after('is_flagged');
            $table->string('moderation_status', 20)->default('none')->after('flagged_reason');
        });

        // Insert Freedom Wall channel if it does not exist
        if (!DB::table('chat_channels')->where('slug', 'freedom-wall')->exists()) {
            $maxSortOrder = DB::table('chat_channels')->max('sort_order') ?: 0;

            DB::table('chat_channels')->insert([
                'name' => 'Freedom Wall',
                'slug' => 'freedom-wall',
                'description' => 'Post anonymously. Max 5 posts per day. Messages are moderated by AI.',
                'type' => 'group',
                'icon' => 'Sparkles',
                'grouping' => 'General Discussions',
                'sort_order' => $maxSortOrder + 1,
                'allowed_roles' => json_encode(['member', 'admin', 'superadmin']),
                'write_roles' => json_encode(['member', 'admin', 'superadmin']),
                'is_archived' => false,
                'is_protected' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn(['is_flagged', 'flagged_reason', 'moderation_status']);
        });

        DB::table('chat_channels')->where('slug', 'freedom-wall')->delete();
    }
};
