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
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->boolean('is_deleted')->default(false)->after('type');
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete()->after('is_deleted');
            $table->string('deletion_reason')->nullable()->after('deleted_by');
            $table->timestamp('deleted_at_timestamp')->nullable()->after('deletion_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropColumn(['is_deleted', 'deleted_by', 'deletion_reason', 'deleted_at_timestamp']);
        });
    }
};
