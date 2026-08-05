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
        Schema::table('cyberboard_columns', function (Blueprint $table) {
            $table->string('status_type', 40)->nullable()->default('not_started')->after('color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_columns', function (Blueprint $table) {
            $table->dropColumn('status_type');
        });
    }
};
