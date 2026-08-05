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
            if (!Schema::hasColumn('cyberboard_boards', 'methodology')) {
                $table->string('methodology', 30)->default('waterfall')->nullable()->after('type');
            }
            if (!Schema::hasColumn('cyberboard_boards', 'phase_settings')) {
                $table->json('phase_settings')->nullable()->after('methodology');
            }
        });

        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (!Schema::hasColumn('cyberboard_cards', 'phase')) {
                $table->string('phase', 100)->nullable()->after('priority');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_boards', function (Blueprint $table) {
            if (Schema::hasColumn('cyberboard_boards', 'phase_settings')) {
                $table->dropColumn('phase_settings');
            }
            if (Schema::hasColumn('cyberboard_boards', 'methodology')) {
                $table->dropColumn('methodology');
            }
        });

        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (Schema::hasColumn('cyberboard_cards', 'phase')) {
                $table->dropColumn('phase');
            }
        });
    }
};
