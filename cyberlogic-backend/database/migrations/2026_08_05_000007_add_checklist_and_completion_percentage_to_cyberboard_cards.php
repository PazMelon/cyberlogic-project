<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (!Schema::hasColumn('cyberboard_cards', 'checklist')) {
                $table->json('checklist')->nullable()->after('attachments');
            }
            if (!Schema::hasColumn('cyberboard_cards', 'completion_percentage')) {
                $table->integer('completion_percentage')->default(0)->after('checklist');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cyberboard_cards', function (Blueprint $table) {
            if (Schema::hasColumn('cyberboard_cards', 'checklist')) {
                $table->dropColumn('checklist');
            }
            if (Schema::hasColumn('cyberboard_cards', 'completion_percentage')) {
                $table->dropColumn('completion_percentage');
            }
        });
    }
};
