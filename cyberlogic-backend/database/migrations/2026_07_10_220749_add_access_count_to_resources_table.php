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
        if (!Schema::hasColumn('resources', 'access_count')) {
            Schema::table('resources', function (Blueprint $table) {
                $table->unsignedInteger('access_count')->default(0)->after('download_count');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('resources', 'access_count')) {
            Schema::table('resources', function (Blueprint $table) {
                $table->dropColumn('access_count');
            });
        }
    }
};
