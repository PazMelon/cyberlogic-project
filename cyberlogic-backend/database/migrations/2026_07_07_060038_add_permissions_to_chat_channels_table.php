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
            $table->json('allowed_roles')->nullable()->after('type');
            $table->json('write_roles')->nullable()->after('allowed_roles');
            $table->boolean('is_archived')->default(false)->after('write_roles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_channels', function (Blueprint $table) {
            $table->dropColumn(['allowed_roles', 'write_roles', 'is_archived']);
        });
    }
};
