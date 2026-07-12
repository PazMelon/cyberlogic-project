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
        $now = now();
        
        // 1. Insert new permission
        DB::table('permissions')->insertOrIgnore([
            'key' => 'modify_welcome_info_messages',
            'label' => 'Modify Welcome & Info Messages',
            'group' => 'Chat',
            'description' => 'Allowed to edit/modify messages in any channel under the Welcome & Info category.',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 2. Protect existing Welcome & Info channels
        DB::table('chat_channels')
            ->where('grouping', 'Welcome & Info')
            ->update(['is_protected' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('permissions')->where('key', 'modify_welcome_info_messages')->delete();
    }
};
