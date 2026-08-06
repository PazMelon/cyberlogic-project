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
        Schema::create('cyberboard_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained('cyberboard_boards')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('content');
            $table->foreignId('reply_to_id')->nullable()->constrained('cyberboard_chat_messages')->onDelete('set null');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('pinned_at')->nullable();
            $table->foreignId('pinned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->json('reactions')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cyberboard_chat_messages');
    }
};
