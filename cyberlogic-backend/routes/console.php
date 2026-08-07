<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Models\Event;

Schedule::call(function () {
    Event::where('status', 'upcoming')
        ->where('date', '<', now()->toDateString())
        ->update(['status' => 'completed']);
})->daily()->name('auto-complete-events');

Schedule::command('chat:moderate-batch')->hourly()->name('batch-chat-moderation');

Schedule::command('chess:tournament-watchdog')->everyMinute()->name('tournament-failsafe-watchdog');

Schedule::call(function () {
    $enabled = \App\Models\SiteSetting::where('key', 'auto_backup_enabled')->value('value') !== 'false';
    if (!$enabled) return;

    $scheduledTime = \App\Models\SiteSetting::where('key', 'auto_backup_time')->value('value') ?: '02:00';
    $lastRun = \App\Models\SiteSetting::where('key', 'auto_backup_last_run')->value('value') ?: '';
    $todayStr = date('Y-m-d');

    if ($lastRun === $todayStr) return;

    if (date('H:i') >= $scheduledTime) {
        $controller = new \App\Http\Controllers\DatabaseBackupController();
        $controller->runAutoBackupJob();
    }
})->everyMinute()->name('auto-database-backup-and-prune');
