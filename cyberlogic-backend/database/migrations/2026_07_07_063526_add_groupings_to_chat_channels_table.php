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
        Schema::table('chat_channels', function (Blueprint $table) {
            $table->string('icon', 50)->nullable()->after('type');
            $table->string('grouping', 100)->default('General')->after('icon');
            $table->integer('sort_order')->default(0)->after('grouping');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_channels', function (Blueprint $table) {
            $table->dropColumn(['icon', 'grouping', 'sort_order']);
        });
    }
};
