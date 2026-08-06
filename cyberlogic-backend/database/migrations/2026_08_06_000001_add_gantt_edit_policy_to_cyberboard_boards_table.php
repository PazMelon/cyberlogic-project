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
        Schema::table('cyberboard_boards', function (Blueprint $table) {
            if (!Schema::hasColumn('cyberboard_boards', 'gantt_edit_policy')) {
                $table->string('gantt_edit_policy')->default('everyone')->after('column_creation_policy');
            }
            if (!Schema::hasColumn('cyberboard_boards', 'allowed_gantt_editor_roles')) {
                $table->json('allowed_gantt_editor_roles')->nullable()->after('gantt_edit_policy');
            }
            if (!Schema::hasColumn('cyberboard_boards', 'allowed_gantt_editor_users')) {
                $table->json('allowed_gantt_editor_users')->nullable()->after('allowed_gantt_editor_roles');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_boards', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('cyberboard_boards', 'gantt_edit_policy')) {
                $columnsToDrop[] = 'gantt_edit_policy';
            }
            if (Schema::hasColumn('cyberboard_boards', 'allowed_gantt_editor_roles')) {
                $columnsToDrop[] = 'allowed_gantt_editor_roles';
            }
            if (Schema::hasColumn('cyberboard_boards', 'allowed_gantt_editor_users')) {
                $columnsToDrop[] = 'allowed_gantt_editor_users';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
