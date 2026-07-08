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
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'closed', 'postponed'])->default('upcoming')->after('type');
            $table->enum('event_mode', ['registration_and_attendance', 'attendance_only', 'registration_only'])->default('registration_and_attendance')->after('status');
            $table->integer('attendance_capacity')->nullable()->after('capacity');
            $table->dateTime('registration_start')->nullable()->after('attendance_capacity');
            $table->dateTime('registration_end')->nullable()->after('registration_start');
            $table->dateTime('attendance_start')->nullable()->after('registration_end');
            $table->dateTime('attendance_end')->nullable()->after('attendance_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'event_mode',
                'attendance_capacity',
                'registration_start',
                'registration_end',
                'attendance_start',
                'attendance_end',
            ]);
        });
    }
};
