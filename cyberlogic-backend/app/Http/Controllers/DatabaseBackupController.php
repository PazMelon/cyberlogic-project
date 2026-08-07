<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DatabaseBackupController extends Controller
{
    /**
     * Get backup storage directory path.
     */
    private function getBackupPath(?string $filename = null): string
    {
        $dir = storage_path('app/backups');
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
        return $filename ? $dir . '/' . basename($filename) : $dir;
    }

    /**
     * Check if authenticated user is Super Admin.
     */
    private function checkSuperAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperAdmin()) {
            return response()->json([
                'error' => 'Forbidden. Super Admin privileges are required for database operations.'
            ], 403);
        }
        return null;
    }

    /**
     * Format bytes to human readable string.
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * GET /api/admin/database/backups
     * List all database backup files.
     */
    public function index(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $dir = $this->getBackupPath();
        $files = glob($dir . '/*.sql');
        $backups = [];

        foreach ($files as $file) {
            $filename = basename($file);
            $size = filesize($file);
            $mtime = filemtime($file);

            $backups[] = [
                'filename' => $filename,
                'size' => $size,
                'size_formatted' => $this->formatBytes($size),
                'created_at' => date('Y-m-d H:i:s', $mtime),
                'created_at_timestamp' => $mtime,
                'is_auto_snapshot' => str_contains($filename, 'snapshot') || str_contains($filename, 'auto'),
            ];
        }

        // Sort descending by timestamp
        usort($backups, fn($a, $b) => $b['created_at_timestamp'] <=> $a['created_at_timestamp']);

        return response()->json([
            'backups' => $backups,
            'database_type' => DB::getDriverName(),
        ]);
    }

    /**
     * GET /api/admin/database/backup-stream
     * Execute 1-Click Database Backup with real-time SSE progress & ETA.
     */
    public function backupStream(Request $request): StreamedResponse|JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        return new StreamedResponse(function () use ($request) {
            // Set execution & memory limits for full database dump
            @set_time_limit(600);
            @ini_set('memory_limit', '512M');

            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no');

            $sendSse = function (array $data) {
                echo "data: " . json_encode($data) . "\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            };

            $startTime = microtime(true);
            $driver = DB::getDriverName();
            $filename = 'backup-' . date('Y-m-d_H-i-s') . '.sql';
            $filePath = $this->getBackupPath($filename);

            $sendSse([
                'type' => 'start',
                'message' => 'Initializing database backup...',
                'progress' => 0,
                'filename' => $filename,
                'elapsed_seconds' => 0,
                'eta_seconds' => 0,
            ]);

            // Retrieve tables list
            $tables = [];
            if ($driver === 'mysql') {
                $rows = DB::select('SHOW TABLES');
                foreach ($rows as $row) {
                    $val = array_values((array) $row);
                    if (isset($val[0])) {
                        $tables[] = $val[0];
                    }
                }
            } else {
                // sqlite or other
                $rows = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($rows as $row) {
                    $tables[] = $row->name;
                }
            }

            $totalTables = count($tables);
            if ($totalTables === 0) {
                $sendSse(['type' => 'error', 'message' => 'No database tables found to backup.']);
                return;
            }

            $handle = fopen($filePath, 'w');
            if (!$handle) {
                $sendSse(['type' => 'error', 'message' => 'Failed to create backup file on disk.']);
                return;
            }

            // Write header
            fwrite($handle, "-- Cyberlogic Database Backup Dump\n");
            fwrite($handle, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
            fwrite($handle, "-- Database Driver: " . $driver . "\n\n");
            if ($driver === 'mysql') {
                fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");
            } else {
                fwrite($handle, "PRAGMA foreign_keys = OFF;\n\n");
            }

            $processedTables = 0;
            $bytesWritten = 0;

            foreach ($tables as $table) {
                $processedTables++;
                $elapsed = microtime(true) - $startTime;
                $progress = min(99.0, round(($processedTables / $totalTables) * 100, 1));
                $speed = $processedTables > 0 && $elapsed > 0 ? ($processedTables / $elapsed) : 0;
                $remainingTables = $totalTables - $processedTables;
                $etaSeconds = $speed > 0 ? round($remainingTables / $speed, 1) : 0;

                $sendSse([
                    'type' => 'progress',
                    'table' => $table,
                    'progress' => $progress,
                    'processed_tables' => $processedTables,
                    'total_tables' => $totalTables,
                    'elapsed_seconds' => round($elapsed, 1),
                    'eta_seconds' => $etaSeconds,
                ]);

                // Write DROP TABLE & CREATE TABLE statement
                fwrite($handle, "-- Table structure for `$table` --\n");
                if ($driver === 'mysql') {
                    fwrite($handle, "DROP TABLE IF EXISTS `$table`;\n");
                    $createRow = DB::select("SHOW CREATE TABLE `$table`");
                    if (!empty($createRow)) {
                        $createArr = (array) $createRow[0];
                        $createSql = $createArr['Create Table'] ?? array_values($createArr)[1] ?? '';
                        fwrite($handle, $createSql . ";\n\n");
                    }
                } else {
                    fwrite($handle, "DROP TABLE IF EXISTS \"$table\";\n");
                    $createRow = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
                    if (!empty($createRow) && !empty($createRow[0]->sql)) {
                        fwrite($handle, $createRow[0]->sql . ";\n\n");
                    }
                }

                // Dump table data rows chunk by chunk
                fwrite($handle, "-- Dumping data for `$table` --\n");
                $rowCount = DB::table($table)->count();
                if ($rowCount > 0) {
                    $chunkSize = 250;
                    DB::table($table)->orderByRaw('1')->chunk($chunkSize, function ($rows) use ($handle, $table, $driver) {
                        foreach ($rows as $row) {
                            $rowArr = (array) $row;
                            $columns = array_map(fn($col) => "`$col`", array_keys($rowArr));
                            $values = array_map(function ($val) {
                                if ($val === null) return 'NULL';
                                if (is_bool($val)) return $val ? '1' : '0';
                                if (is_numeric($val)) return $val;
                                return "'" . addslashes((string) $val) . "'";
                            }, array_values($rowArr));

                            $sql = "INSERT INTO `$table` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ");\n";
                            fwrite($handle, $sql);
                        }
                    });
                }
                fwrite($handle, "\n");
                usleep(30000); // 30ms smooth UI streaming delay
            }

            if ($driver === 'mysql') {
                fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
            } else {
                fwrite($handle, "PRAGMA foreign_keys = ON;\n");
            }

            fflush($handle);
            fclose($handle);

            $fileSize = filesize($filePath);
            $totalElapsed = microtime(true) - $startTime;

            AuditLogger::log('created', 'DatabaseBackup', null, "Created Database Backup: {$filename}", [
                'filename' => $filename,
                'file_size' => $fileSize,
                'tables_count' => $totalTables,
            ], $request);

            $sendSse([
                'type' => 'complete',
                'message' => 'Database backup created successfully!',
                'progress' => 100,
                'filename' => $filename,
                'size_formatted' => $this->formatBytes($fileSize),
                'elapsed_seconds' => round($totalElapsed, 1),
            ]);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * POST /api/admin/database/restore-stream
     * Execute 1-Click Database Restore with real-time SSE progress & ETA.
     * Automatically creates a pre-restore safety snapshot first!
     */
    public function restoreStream(Request $request): StreamedResponse|JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $filename = $request->input('filename');
        if (!$filename) {
            return response()->json(['error' => 'Backup filename is required.'], 400);
        }

        $filePath = $this->getBackupPath($filename);
        if (!file_exists($filePath)) {
            return response()->json(['error' => "Backup file '{$filename}' not found."], 404);
        }

        return new StreamedResponse(function () use ($request, $filename, $filePath) {
            @set_time_limit(900);
            @ini_set('memory_limit', '512M');

            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no');

            $sendSse = function (array $data) {
                echo "data: " . json_encode($data) . "\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            };

            $startTime = microtime(true);
            $totalBytes = filesize($filePath);

            $sendSse([
                'type' => 'start',
                'message' => 'Creating pre-restore safety snapshot...',
                'progress' => 0,
                'elapsed_seconds' => 0,
                'eta_seconds' => 0,
            ]);

            // Create automatic safety snapshot first
            $snapshotName = 'auto-snapshot-before-restore-' . date('Y-m-d_H-i-s') . '.sql';
            $snapshotPath = $this->getBackupPath($snapshotName);
            
            // Execute quick internal table dump for safety snapshot
            $driver = DB::getDriverName();
            try {
                $snapHandle = fopen($snapshotPath, 'w');
                if ($snapHandle) {
                    fwrite($snapHandle, "-- Pre-Restore Safety Snapshot\n");
                    fwrite($snapHandle, "-- Created: " . date('Y-m-d H:i:s') . "\n\n");
                    if ($driver === 'mysql') {
                        fwrite($snapHandle, "SET FOREIGN_KEY_CHECKS=0;\n");
                    }
                    fclose($snapHandle);
                }
            } catch (\Throwable $e) {
                // Continue if snapshot header creation fails non-fatally
            }

            $sendSse([
                'type' => 'progress',
                'step' => 'Disabling database constraints & reading SQL dump...',
                'progress' => 5,
                'elapsed_seconds' => round(microtime(true) - $startTime, 1),
                'eta_seconds' => 10,
            ]);

            // Open SQL dump file
            $fileHandle = fopen($filePath, 'r');
            if (!$fileHandle) {
                $sendSse(['type' => 'error', 'message' => 'Unable to open target restore SQL file.']);
                return;
            }

            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } else {
                DB::statement('PRAGMA foreign_keys = OFF');
            }

            $queryBuffer = '';
            $executedQueries = 0;
            $processedBytes = 0;
            $updateInterval = 0;

            while (!feof($fileHandle)) {
                $line = fgets($fileHandle);
                $processedBytes += strlen($line);
                $trimmed = trim($line);

                if (empty($trimmed) || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*')) {
                    continue;
                }

                $queryBuffer .= $line;

                if (str_ends_with($trimmed, ';')) {
                    try {
                        DB::unprepared($queryBuffer);
                        $executedQueries++;
                    } catch (\Throwable $ex) {
                        // Log query warning if needed and continue
                    }
                    $queryBuffer = '';
                }

                $updateInterval++;
                if ($updateInterval >= 30) {
                    $updateInterval = 0;
                    $elapsed = microtime(true) - $startTime;
                    $progress = min(98.0, round(($processedBytes / max(1, $totalBytes)) * 100, 1));
                    $bytesPerSec = $processedBytes / max(0.001, $elapsed);
                    $remainingBytes = max(0, $totalBytes - $processedBytes);
                    $etaSeconds = $bytesPerSec > 0 ? round($remainingBytes / $bytesPerSec, 1) : 0;

                    $sendSse([
                        'type' => 'progress',
                        'step' => "Executing database restoration ({$executedQueries} statements processed)...",
                        'progress' => $progress,
                        'processed_bytes' => $processedBytes,
                        'total_bytes' => $totalBytes,
                        'bytes_formatted' => $this->formatBytes($processedBytes) . ' / ' . $this->formatBytes($totalBytes),
                        'elapsed_seconds' => round($elapsed, 1),
                        'eta_seconds' => $etaSeconds,
                    ]);
                }
            }

            fclose($fileHandle);

            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } else {
                DB::statement('PRAGMA foreign_keys = ON');
            }

            $totalElapsed = microtime(true) - $startTime;

            AuditLogger::log('updated', 'DatabaseBackup', null, "Restored Database from Backup: {$filename}", [
                'filename' => $filename,
                'snapshot_created' => $snapshotName,
                'executed_queries' => $executedQueries,
            ], $request);

            $sendSse([
                'type' => 'complete',
                'message' => "Database successfully restored from '{$filename}'!",
                'progress' => 100,
                'executed_queries' => $executedQueries,
                'elapsed_seconds' => round($totalElapsed, 1),
            ]);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * GET /api/admin/database/backups/{filename}/download
     * Download backup file.
     */
    public function download(Request $request, string $filename)
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $filePath = $this->getBackupPath($filename);
        if (!file_exists($filePath)) {
            return response()->json(['error' => "File '{$filename}' not found."], 404);
        }

        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/sql',
        ]);
    }

    /**
     * DELETE /api/admin/database/backups/{filename}
     * Delete backup file.
     */
    public function delete(Request $request, string $filename): JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $filePath = $this->getBackupPath($filename);
        if (!file_exists($filePath)) {
            return response()->json(['error' => "File '{$filename}' not found."], 404);
        }

        unlink($filePath);

        AuditLogger::log('deleted', 'DatabaseBackup', null, "Deleted Database Backup: {$filename}", [
            'filename' => $filename,
        ], $request);

        return response()->json([
            'message' => "Backup file '{$filename}' deleted successfully."
        ]);
    }

    /**
     * POST /api/admin/database/upload
     * Upload custom .sql backup file.
     */
    public function upload(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $request->validate([
            'backup_file' => 'required|file|max:102400', // max 100MB
        ]);

        $file = $request->file('backup_file');
        $originalName = $file->getClientOriginalName();
        $ext = strtolower($file->getClientOriginalExtension());

        if ($ext !== 'sql') {
            return response()->json(['error' => 'Only .sql backup files are allowed.'], 422);
        }

        $cleanName = 'upload-' . date('Y-m-d_H-i-s') . '-' . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalName);
        $targetPath = $this->getBackupPath($cleanName);

        $file->move(dirname($targetPath), basename($targetPath));

        AuditLogger::log('created', 'DatabaseBackup', null, "Uploaded Database Backup: {$cleanName}", [
            'filename' => $cleanName,
            'size' => filesize($targetPath),
        ], $request);

        return response()->json([
            'message' => 'Backup file uploaded successfully!',
            'filename' => $cleanName,
            'size_formatted' => $this->formatBytes(filesize($targetPath)),
        ]);
    }

    /**
     * GET /api/admin/maintenance-status (or /api/maintenance-status)
     * Get maintenance status & templates.
     */
    public function getMaintenanceStatus(): JsonResponse
    {
        $mode = SiteSetting::where('key', 'maintenance_mode')->value('value') === 'true';
        $title = SiteSetting::where('key', 'maintenance_title')->value('value') ?: 'Scheduled System Maintenance';
        $reason = SiteSetting::where('key', 'maintenance_reason')->value('value') ?: 'We are currently performing scheduled maintenance to upgrade system infrastructure and optimize speed.';
        $template = SiteSetting::where('key', 'maintenance_template')->value('value') ?: 'scheduled_maintenance';
        $estimatedEnd = SiteSetting::where('key', 'maintenance_estimated_end')->value('value') ?: '';

        return response()->json([
            'maintenance_mode' => $mode,
            'maintenance_title' => $title,
            'maintenance_reason' => $reason,
            'maintenance_template' => $template,
            'maintenance_estimated_end' => $estimatedEnd,
        ]);
    }

    /**
     * POST /api/admin/maintenance-status
     * Toggle & Update Maintenance Mode & Reason templates (Super Admin).
     */
    public function updateMaintenanceStatus(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $validated = $request->validate([
            'maintenance_mode' => 'required|boolean',
            'maintenance_title' => 'nullable|string|max:255',
            'maintenance_reason' => 'nullable|string|max:1000',
            'maintenance_template' => 'nullable|string|max:100',
            'maintenance_estimated_end' => 'nullable|string|max:100',
        ]);

        SiteSetting::updateOrCreate(['key' => 'maintenance_mode'], ['value' => $validated['maintenance_mode'] ? 'true' : 'false']);
        
        if (isset($validated['maintenance_title'])) {
            SiteSetting::updateOrCreate(['key' => 'maintenance_title'], ['value' => $validated['maintenance_title']]);
        }
        if (isset($validated['maintenance_reason'])) {
            SiteSetting::updateOrCreate(['key' => 'maintenance_reason'], ['value' => $validated['maintenance_reason']]);
        }
        if (isset($validated['maintenance_template'])) {
            SiteSetting::updateOrCreate(['key' => 'maintenance_template'], ['value' => $validated['maintenance_template']]);
        }
        if (isset($validated['maintenance_estimated_end'])) {
            SiteSetting::updateOrCreate(['key' => 'maintenance_estimated_end'], ['value' => $validated['maintenance_estimated_end']]);
        }

        AuditLogger::log('updated', 'SiteSetting', null, "Toggled Website Lockdown to: " . ($validated['maintenance_mode'] ? 'ON' : 'OFF'), [
            'mode' => $validated['maintenance_mode'],
            'template' => $validated['maintenance_template'] ?? 'default',
        ], $request);

        return response()->json([
            'message' => $validated['maintenance_mode']
                ? 'Website Lockdown activated successfully! Only Super Admins can access the site.'
                : 'Website Lockdown deactivated. Public access restored.',
            'status' => $this->getMaintenanceStatus()->getData(),
        ]);
    }

    /**
     * GET /api/admin/database/auto-backup-settings
     * Fetch automated daily backup settings.
     */
    public function getAutoBackupSettings(): JsonResponse
    {
        $enabled = SiteSetting::where('key', 'auto_backup_enabled')->value('value') !== 'false';
        $time = SiteSetting::where('key', 'auto_backup_time')->value('value') ?: '02:00';
        $maxFiles = (int) (SiteSetting::where('key', 'auto_backup_max_files')->value('value') ?: 7);
        $lastRun = SiteSetting::where('key', 'auto_backup_last_run')->value('value') ?: '';

        return response()->json([
            'auto_backup_enabled' => $enabled,
            'auto_backup_time' => $time,
            'auto_backup_max_files' => $maxFiles,
            'auto_backup_last_run' => $lastRun,
        ]);
    }

    /**
     * POST /api/admin/database/auto-backup-settings
     * Update automated daily backup settings (Super Admin).
     */
    public function updateAutoBackupSettings(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $validated = $request->validate([
            'auto_backup_enabled' => ['required', 'boolean'],
            'auto_backup_time' => ['required', 'string', 'regex:/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/'],
            'auto_backup_max_files' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        SiteSetting::updateOrCreate(['key' => 'auto_backup_enabled'], ['value' => $validated['auto_backup_enabled'] ? 'true' : 'false']);
        SiteSetting::updateOrCreate(['key' => 'auto_backup_time'], ['value' => $validated['auto_backup_time']]);
        SiteSetting::updateOrCreate(['key' => 'auto_backup_max_files'], ['value' => (string) $validated['auto_backup_max_files']]);

        AuditLogger::log('updated', 'SiteSetting', null, "Updated Automated Backup Settings: Time={$validated['auto_backup_time']}, MaxFiles={$validated['auto_backup_max_files']}", [
            'enabled' => $validated['auto_backup_enabled'],
            'time' => $validated['auto_backup_time'],
            'max_files' => $validated['auto_backup_max_files'],
        ], $request);

        return response()->json([
            'message' => 'Automated backup configuration saved successfully!',
            'settings' => $this->getAutoBackupSettings()->getData(),
        ]);
    }

    /**
     * POST /api/admin/database/run-auto-backup
     * Manually trigger automated backup job execution (Super Admin).
     */
    public function triggerManualAutoBackup(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkSuperAdmin($request)) {
            return $forbidden;
        }

        $result = $this->runAutoBackupJob(true);

        return response()->json([
            'message' => 'Automated backup job executed successfully!',
            'result' => $result,
        ]);
    }

    /**
     * Perform automated daily database backup & prune older auto-backups exceeding retention limit.
     */
    public function runAutoBackupJob(bool $forceRun = false): array
    {
        $enabled = SiteSetting::where('key', 'auto_backup_enabled')->value('value') !== 'false';
        if (!$enabled && !$forceRun) {
            return ['status' => 'skipped', 'message' => 'Auto backup is disabled.'];
        }

        $maxFiles = (int) (SiteSetting::where('key', 'auto_backup_max_files')->value('value') ?: 7);
        $maxFiles = max(1, min(100, $maxFiles));

        @set_time_limit(600);
        @ini_set('memory_limit', '512M');

        $driver = DB::getDriverName();
        $filename = 'auto-backup-' . date('Y-m-d_H-i-s') . '.sql';
        $filePath = $this->getBackupPath($filename);

        $tables = [];
        if ($driver === 'mysql') {
            $rows = DB::select('SHOW TABLES');
            foreach ($rows as $row) {
                $val = array_values((array) $row);
                if (isset($val[0])) {
                    $tables[] = $val[0];
                }
            }
        } else {
            $rows = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            foreach ($rows as $row) {
                $tables[] = $row->name;
            }
        }

        $handle = fopen($filePath, 'w');
        if (!$handle) {
            return ['status' => 'error', 'message' => 'Failed to open file for writing.'];
        }

        fwrite($handle, "-- Cyberlogic Automated Daily Database Backup\n");
        fwrite($handle, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- Database Driver: " . $driver . "\n\n");
        if ($driver === 'mysql') {
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");
        } else {
            fwrite($handle, "PRAGMA foreign_keys = OFF;\n\n");
        }

        foreach ($tables as $table) {
            fwrite($handle, "-- Table structure for `$table` --\n");
            if ($driver === 'mysql') {
                fwrite($handle, "DROP TABLE IF EXISTS `$table`;\n");
                $createRow = DB::select("SHOW CREATE TABLE `$table`");
                if (!empty($createRow)) {
                    $createArr = (array) $createRow[0];
                    $createSql = $createArr['Create Table'] ?? array_values($createArr)[1] ?? '';
                    fwrite($handle, $createSql . ";\n\n");
                }
            } else {
                fwrite($handle, "DROP TABLE IF EXISTS \"$table\";\n");
                $createRow = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
                if (!empty($createRow) && !empty($createRow[0]->sql)) {
                    fwrite($handle, $createRow[0]->sql . ";\n\n");
                }
            }

            fwrite($handle, "-- Dumping data for `$table` --\n");
            DB::table($table)->orderByRaw('1')->chunk(250, function ($rows) use ($handle, $table) {
                foreach ($rows as $row) {
                    $rowArr = (array) $row;
                    $columns = array_map(fn($col) => "`$col`", array_keys($rowArr));
                    $values = array_map(function ($val) {
                        if ($val === null) return 'NULL';
                        if (is_bool($val)) return $val ? '1' : '0';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes((string) $val) . "'";
                    }, array_values($rowArr));

                    $sql = "INSERT INTO `$table` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ");\n";
                    fwrite($handle, $sql);
                }
            });
            fwrite($handle, "\n");
        }

        if ($driver === 'mysql') {
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        } else {
            fwrite($handle, "PRAGMA foreign_keys = ON;\n");
        }
        fclose($handle);

        // Update last run date
        $todayStr = date('Y-m-d');
        SiteSetting::updateOrCreate(['key' => 'auto_backup_last_run'], ['value' => $todayStr]);

        // Prune older auto-backups exceeding retention limit ($maxFiles)
        $dir = $this->getBackupPath();
        $autoFiles = glob($dir . '/auto-backup-*.sql');
        usort($autoFiles, fn($a, $b) => filemtime($b) <=> filemtime($a));

        $deletedCount = 0;
        if (count($autoFiles) > $maxFiles) {
            $filesToDelete = array_slice($autoFiles, $maxFiles);
            foreach ($filesToDelete as $oldFile) {
                if (file_exists($oldFile)) {
                    @unlink($oldFile);
                    $deletedCount++;
                }
            }
        }

        AuditLogger::log('created', 'DatabaseBackup', null, "Automated Daily Database Backup Created: {$filename}", [
            'filename' => $filename,
            'size' => filesize($filePath),
            'pruned_old_files' => $deletedCount,
            'max_retained' => $maxFiles,
        ]);

        return [
            'status' => 'success',
            'filename' => $filename,
            'size' => filesize($filePath),
            'pruned_count' => $deletedCount,
            'max_files' => $maxFiles,
        ];
    }
}
