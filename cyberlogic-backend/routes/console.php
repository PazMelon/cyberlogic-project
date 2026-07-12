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
