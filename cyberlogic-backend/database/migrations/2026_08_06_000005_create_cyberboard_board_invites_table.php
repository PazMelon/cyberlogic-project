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
        Schema::create('cyberboard_board_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained('cyberboard_boards')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->foreignId('used_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cyberboard_board_invites');
    }
};
