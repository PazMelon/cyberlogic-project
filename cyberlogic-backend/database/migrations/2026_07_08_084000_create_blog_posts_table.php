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
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->text('excerpt');
            $table->text('content')->nullable();
            $table->string('category');
            $table->string('author')->default('System Admin');
            $table->string('author_avatar')->nullable();
            $table->string('date');
            $table->json('tags')->nullable();
            $table->boolean('featured')->default(false);
            $table->string('status')->default('published'); // 'published' or 'draft'
            $table->json('sections')->nullable();
            $table->string('image')->nullable();
            $table->string('read_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
