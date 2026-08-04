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
        Schema::table('officers', function (Blueprint $table) {
            $table->string('display_facebook')->nullable()->after('display_email');
            $table->string('display_instagram')->nullable()->after('display_facebook');
            $table->string('display_wechat')->nullable()->after('display_instagram');
            $table->string('display_tiktok')->nullable()->after('display_wechat');
            $table->string('display_twitter')->nullable()->after('display_tiktok'); // X / Twitter
            $table->string('display_reddit')->nullable()->after('display_twitter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('officers', function (Blueprint $table) {
            $table->dropColumn([
                'display_facebook',
                'display_instagram',
                'display_wechat',
                'display_tiktok',
                'display_twitter',
                'display_reddit',
            ]);
        });
    }
};
