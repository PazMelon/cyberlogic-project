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
        Schema::create('chess_player_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->integer('elo_rating')->default(1200);
            $table->integer('peak_elo')->default(1200);
            $table->integer('ranked_wins')->default(0);
            $table->integer('ranked_losses')->default(0);
            $table->integer('ranked_draws')->default(0);
            $table->integer('casual_wins')->default(0);
            $table->integer('casual_losses')->default(0);
            $table->integer('casual_draws')->default(0);
            $table->integer('chess_reputation_points')->default(0);
            $table->timestamps();
        });

        Schema::create('chess_games', function (Blueprint $table) {
            $table->id();
            $table->string('game_code', 16)->unique();
            $table->foreignId('host_player_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('white_player_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('black_player_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['ranked', 'casual'])->default('ranked');
            $table->integer('time_control')->nullable(); // in minutes
            $table->bigInteger('white_time_left_ms')->nullable();
            $table->bigInteger('black_time_left_ms')->nullable();
            $table->boolean('allow_spectators')->default(true);
            $table->enum('status', ['waiting', 'in_progress', 'completed', 'aborted', 'draw_offered'])->default('waiting');
            $table->string('fen', 255)->default('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            $table->text('pgn')->nullable();
            $table->enum('current_turn', ['white', 'black'])->default('white');
            $table->timestamp('last_move_at')->nullable();
            $table->foreignId('winner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('win_reason')->nullable();
            $table->boolean('is_draw')->default(false);
            $table->integer('white_elo_change')->nullable();
            $table->integer('black_elo_change')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chess_games');
        Schema::dropIfExists('chess_player_stats');
    }
};
