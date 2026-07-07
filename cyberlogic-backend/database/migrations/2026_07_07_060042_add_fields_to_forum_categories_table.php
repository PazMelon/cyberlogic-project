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
        Schema::table('forum_categories', function (Blueprint $table) {
            $table->string('icon', 50)->nullable()->after('color');
            $table->boolean('is_visible')->default(true)->after('icon');
            $table->boolean('allow_solved')->default(true)->after('is_visible');
            $table->text('rules')->nullable()->after('allow_solved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('forum_categories', function (Blueprint $table) {
            $table->dropColumn(['icon', 'is_visible', 'allow_solved', 'rules']);
        });
    }
};
