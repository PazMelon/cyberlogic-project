<?php

namespace App\Console\Commands;

use App\Services\ChessTournamentService;
use Illuminate\Console\Command;

class ChessTournamentWatchdog extends Command
{
    protected $signature = 'chess:tournament-watchdog';

    protected $description = 'Enforce tournament fail-safe timers: auto-forfeit expired check-ins and auto-resume expired pauses.';

    public function handle(ChessTournamentService $service): int
    {
        $actionsCount = $service->checkExpiredTimers();

        if ($actionsCount > 0) {
            $this->info("[TournamentWatchdog] Enforced {$actionsCount} timer action(s).");
        }

        return self::SUCCESS;
    }
}
