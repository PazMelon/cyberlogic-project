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
        Schema::create('officers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('use_profile_info')->default(true);
            $table->string('display_name')->nullable();
            $table->string('display_role')->nullable();
            $table->text('display_bio')->nullable();
            $table->string('display_avatar')->nullable();
            $table->string('display_email')->nullable();
            $table->string('display_github')->nullable();
            $table->string('display_linkedin')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('officers');
    }
};
