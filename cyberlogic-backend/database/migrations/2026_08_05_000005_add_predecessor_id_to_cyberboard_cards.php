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
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            $table->foreignId('predecessor_id')->nullable()->after('parent_id')->constrained('cyberboard_cards')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            $table->dropForeign(['predecessor_id']);
            $table->dropColumn('predecessor_id');
        });
    }
};
