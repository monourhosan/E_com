<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Laravel Scheduler: Auto-cancel stale pending_payment orders and release stock every 10 minutes
Schedule::command('orders:cancel-stale --minutes=30')->everyTenMinutes();

// Laravel Scheduler: Hourly status poll for in-transit CarryBee packages
Schedule::command('delivery:poll-carrybee-status')->hourly();
