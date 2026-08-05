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
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (!Schema::hasColumn('cyberboard_cards', 'assigned_user_ids')) {
                $table->json('assigned_user_ids')->nullable()->after('assigned_user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (Schema::hasColumn('cyberboard_cards', 'assigned_user_ids')) {
                $table->dropColumn('assigned_user_ids');
            }
        });
    }
};
