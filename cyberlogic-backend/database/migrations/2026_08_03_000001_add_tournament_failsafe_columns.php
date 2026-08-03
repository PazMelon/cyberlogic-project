<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tournament Fail-Safe Columns:
     * - Match check-in timer fields (10-minute window)
     * - Disconnect pause system fields (3-minute, 3x max)
     */
    public function up(): void
    {
        Schema::table('chess_tournament_matches', function (Blueprint $table) {
            // Check-in timer fields
            $table->timestamp('match_ready_at')->nullable()->after('win_reason');
            $table->timestamp('first_checkin_at')->nullable()->after('match_ready_at');
            $table->boolean('white_checked_in')->default(false)->after('first_checkin_at');
            $table->boolean('black_checked_in')->default(false)->after('white_checked_in');

            // Disconnect pause system fields
            $table->unsignedTinyInteger('pause_count_white')->default(0)->after('black_checked_in');
            $table->unsignedTinyInteger('pause_count_black')->default(0)->after('pause_count_white');
            $table->timestamp('paused_at')->nullable()->after('pause_count_black');
            $table->unsignedInteger('pause_remaining_ms')->default(180000)->after('paused_at');
            $table->string('paused_by_color', 10)->nullable()->after('pause_remaining_ms');
        });

        Schema::table('chess_tournaments', function (Blueprint $table) {
            $table->unsignedTinyInteger('match_checkin_minutes')->default(10)->after('time_control');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chess_tournament_matches', function (Blueprint $table) {
            $table->dropColumn([
                'match_ready_at',
                'first_checkin_at',
                'white_checked_in',
                'black_checked_in',
                'pause_count_white',
                'pause_count_black',
                'paused_at',
                'pause_remaining_ms',
                'paused_by_color',
            ]);
        });

        Schema::table('chess_tournaments', function (Blueprint $table) {
            $table->dropColumn('match_checkin_minutes');
        });
    }
};
