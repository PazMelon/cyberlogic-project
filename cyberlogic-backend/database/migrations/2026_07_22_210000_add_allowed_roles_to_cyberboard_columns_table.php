<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cyberboard_columns', function (Blueprint $table) {
            $table->text('allowed_roles')->nullable()->after('position'); // JSON array of allowed roles or null for all
            $table->text('allowed_users')->nullable()->after('allowed_roles'); // JSON array of allowed user IDs
        });
    }

    public function down(): void
    {
        Schema::table('cyberboard_columns', function (Blueprint $table) {
            $table->dropColumn(['allowed_roles', 'allowed_users']);
        });
    }
};
