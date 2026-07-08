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
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'registration_start',
                'registration_end',
                'attendance_start',
                'attendance_end',
            ]);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->time('registration_start')->nullable()->after('attendance_capacity');
            $table->time('registration_end')->nullable()->after('registration_start');
            $table->time('attendance_start')->nullable()->after('registration_end');
            $table->time('attendance_end')->nullable()->after('attendance_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'registration_start',
                'registration_end',
                'attendance_start',
                'attendance_end',
            ]);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dateTime('registration_start')->nullable()->after('attendance_capacity');
            $table->dateTime('registration_end')->nullable()->after('registration_start');
            $table->dateTime('attendance_start')->nullable()->after('registration_end');
            $table->dateTime('attendance_end')->nullable()->after('attendance_start');
        });
    }
};
