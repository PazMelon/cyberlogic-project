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
            $table->boolean('enable_third_place_match')->default(true)->after('type');
        });

        Schema::table('chess_tournament_matches', function (Blueprint $table) {
            $table->boolean('is_third_place')->default(false)->after('match_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chess_tournament_matches', function (Blueprint $table) {
            $table->dropColumn('is_third_place');
        });

        Schema::table('chess_tournaments', function (Blueprint $table) {
            $table->dropColumn('enable_third_place_match');
        });
    }
};
