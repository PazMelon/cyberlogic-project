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
        Schema::create('cyberboard_card_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained('cyberboard_cards')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // created, updated, moved, voted, unvoted
            $table->text('description');
            $table->json('changes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cyberboard_card_activities');
    }
};
