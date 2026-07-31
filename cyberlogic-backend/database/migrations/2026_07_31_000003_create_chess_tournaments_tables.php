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
        Schema::create('chess_tournaments', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->integer('max_players')->default(8);
            $table->integer('time_control')->default(5); // in minutes
            $table->enum('type', ['ranked', 'casual'])->default('ranked');
            $table->enum('status', ['registration', 'in_progress', 'completed', 'cancelled'])->default('registration');
            $table->foreignId('winner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('current_round')->default(1);
            $table->integer('total_rounds')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('chess_tournament_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained('chess_tournaments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('seed')->nullable();
            $table->enum('status', ['active', 'eliminated', 'champion'])->default('active');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tournament_id', 'user_id']);
        });

        Schema::create('chess_tournament_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained('chess_tournaments')->cascadeOnDelete();
            $table->integer('round_number');
            $table->integer('match_number');
            $table->foreignId('white_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('black_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('chess_game_id')->nullable()->constrained('chess_games')->nullOnDelete();
            $table->foreignId('winner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'bye'])->default('pending');
            $table->string('win_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chess_tournament_matches');
        Schema::dropIfExists('chess_tournament_participants');
        Schema::dropIfExists('chess_tournaments');
    }
};
