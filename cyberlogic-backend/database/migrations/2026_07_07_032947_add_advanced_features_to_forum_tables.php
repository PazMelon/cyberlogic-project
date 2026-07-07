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
        Schema::table('forum_threads', function (Blueprint $table) {
            $table->json('images')->nullable()->after('content');
            $table->boolean('is_spoiler')->default(false)->after('is_closed');
            $table->boolean('is_redacted')->default(false)->after('is_spoiler');
        });

        Schema::table('forum_comments', function (Blueprint $table) {
            $table->boolean('is_spoiler')->default(false)->after('content');
            $table->boolean('is_redacted')->default(false)->after('is_spoiler');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('forum_threads', function (Blueprint $table) {
            $table->dropColumn(['images', 'is_spoiler', 'is_redacted']);
        });

        Schema::table('forum_comments', function (Blueprint $table) {
            $table->dropColumn(['is_spoiler', 'is_redacted']);
        });
    }
};
