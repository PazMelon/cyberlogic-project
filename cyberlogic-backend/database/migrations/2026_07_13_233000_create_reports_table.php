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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reportable_type');
            $table->unsignedBigInteger('reportable_id');
            $table->string('reportable_title');
            $table->unsignedBigInteger('content_owner_id')->nullable();
            $table->unsignedBigInteger('moderator_id')->nullable();
            $table->string('reason');
            $table->text('details')->nullable();
            $table->string('status')->default('pending'); // pending, resolved
            $table->string('action_taken')->nullable(); // removed, dismissed
            $table->timestamps();

            $table->foreign('content_owner_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('moderator_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['reportable_type', 'reportable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
