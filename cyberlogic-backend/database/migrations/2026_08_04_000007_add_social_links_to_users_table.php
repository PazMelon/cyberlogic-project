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
        Schema::table('users', function (Blueprint $table) {
            $table->string('github')->nullable()->after('expertise');
            $table->string('linkedin')->nullable()->after('github');
            $table->string('facebook')->nullable()->after('linkedin');
            $table->string('instagram')->nullable()->after('facebook');
            $table->string('wechat')->nullable()->after('instagram');
            $table->string('tiktok')->nullable()->after('wechat');
            $table->string('twitter')->nullable()->after('tiktok'); // X
            $table->string('reddit')->nullable()->after('twitter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'github',
                'linkedin',
                'facebook',
                'instagram',
                'wechat',
                'tiktok',
                'twitter',
                'reddit',
            ]);
        });
    }
};
