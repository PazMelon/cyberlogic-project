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
        Schema::table('chess_tournaments', function (Blueprint $table) {
            $table->string('elimination_mode')->default('single')->after('type'); // 'single' or 'double'
        });

        Schema::table('chess_tournament_matches', function (Blueprint $table) {
            $table->string('bracket_type')->default('winners')->after('is_third_place'); // 'winners' or 'losers'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chess_tournament_matches', function (Blueprint $table) {
            $table->dropColumn('bracket_type');
        });

        Schema::table('chess_tournaments', function (Blueprint $table) {
            $table->dropColumn('elimination_mode');
        });
    }
};
