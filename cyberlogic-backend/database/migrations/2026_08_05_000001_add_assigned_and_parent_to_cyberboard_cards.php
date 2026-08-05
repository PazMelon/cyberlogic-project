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
            if (!Schema::hasColumn('cyberboard_cards', 'assigned_user_id')) {
                $table->foreignId('assigned_user_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('users')
                    ->onDelete('set null');
            }

            if (!Schema::hasColumn('cyberboard_cards', 'parent_id')) {
                $table->foreignId('parent_id')
                    ->nullable()
                    ->after('column_id')
                    ->constrained('cyberboard_cards')
                    ->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (Schema::hasColumn('cyberboard_cards', 'assigned_user_id')) {
                $table->dropForeign(['assigned_user_id']);
                $table->dropColumn('assigned_user_id');
            }

            if (Schema::hasColumn('cyberboard_cards', 'parent_id')) {
                $table->dropForeign(['parent_id']);
                $table->dropColumn('parent_id');
            }
        });
    }
};
