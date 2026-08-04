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
        Schema::table('cyberboard_boards', function (Blueprint $table) {
            $table->string('visibility')->default('public'); // public, private
            $table->json('allowed_members')->nullable(); // user IDs permitted to view private board
            $table->string('column_creation_policy')->default('everyone'); // host_admin_only, specific_roles, everyone
            $table->json('allowed_column_creator_roles')->nullable(); // roles permitted to create columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cyberboard_boards', function (Blueprint $table) {
            $table->dropColumn([
                'visibility',
                'allowed_members',
                'column_creation_policy',
                'allowed_column_creator_roles',
            ]);
        });
    }
};
