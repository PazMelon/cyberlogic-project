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
            if (!Schema::hasColumn('cyberboard_cards', 'attachments')) {
                $table->json('attachments')->nullable()->after('is_archived');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (Schema::hasColumn('cyberboard_cards', 'attachments')) {
                $table->dropColumn('attachments');
            }
        });
    }
};
