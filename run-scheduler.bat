@echo off
title Laravel Scheduler Loop (Self-Healing)
cd /d "%~dp0cyberlogic-backend"
echo Starting self-healing Laravel scheduler loop...
echo PHP process will be spawned every 60 seconds to prevent memory bloat.

:loop
echo [%date% %time%] Running scheduler...
php artisan schedule:run
echo [%date% %time%] Sleeping for 60 seconds...
timeout /t 60 /nobreak >nul
goto loop
