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
        // 1. Boards table
        Schema::create('cyberboard_boards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('cover_color')->nullable()->default('#06b6d4');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
        });

        // 2. Columns table
        Schema::create('cyberboard_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained('cyberboard_boards')->onDelete('cascade');
            $table->string('title');
            $table->string('icon')->nullable(); // emoji or icon string
            $table->string('color')->nullable(); // column accent color
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 3. Cards table
        Schema::create('cyberboard_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('column_id')->constrained('cyberboard_columns')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Idea owner / submitter
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('activity_date')->nullable();
            $table->date('activity_end_date')->nullable();
            $table->string('color_tag')->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->integer('position')->default(0);
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
        });

        // 4. Card Upvotes
        Schema::create('cyberboard_card_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained('cyberboard_cards')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['card_id', 'user_id']);
        });

        // 5. Card Comments
        Schema::create('cyberboard_card_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained('cyberboard_cards')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cyberboard_card_comments');
        Schema::dropIfExists('cyberboard_card_votes');
        Schema::dropIfExists('cyberboard_cards');
        Schema::dropIfExists('cyberboard_columns');
        Schema::dropIfExists('cyberboard_boards');
    }
};
