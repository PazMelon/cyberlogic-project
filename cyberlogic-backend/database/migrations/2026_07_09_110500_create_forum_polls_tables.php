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
        Schema::create('forum_polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('forum_threads')->onDelete('cascade');
            $table->string('question');
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
        });

        Schema::create('forum_poll_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('forum_polls')->onDelete('cascade');
            $table->string('option_text');
            $table->timestamps();
        });

        Schema::create('forum_poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('forum_polls')->onDelete('cascade');
            $table->foreignId('poll_option_id')->constrained('forum_poll_options')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['poll_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forum_poll_votes');
        Schema::dropIfExists('forum_poll_options');
        Schema::dropIfExists('forum_polls');
    }
};
