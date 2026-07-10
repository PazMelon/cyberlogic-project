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
        Schema::table('resources', function (Blueprint $table) {
            $table->string('subtitle')->nullable()->after('title');
            $table->text('excerpt')->nullable()->after('description');
            $table->string('image')->nullable()->after('file_path');
            $table->json('sections')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn(['subtitle', 'excerpt', 'image', 'sections']);
        });
    }
};
