<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLogger
{
    /**
     * Write an audit log entry.
     *
     * @param string $action
     * @param string $entityType
     * @param int|null $entityId
     * @param string|null $entityLabel
     * @param array|null $metadata
     * @param Request|null $request
     * @return void
     */
    public static function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?string $entityLabel = null,
        ?array $metadata = null,
        ?Request $request = null
    ): void {
        try {
            $user = null;
            $userId = null;
            $userName = 'System';
            $userRole = 'system';
            $ipAddress = null;

            if ($request) {
                $user = $request->user();
                $ipAddress = $request->ip();
            } else {
                $user = request()->user();
                $ipAddress = request()->ip();
            }

            if ($user) {
                $userId = $user->id;
                $userName = $user->name;
                $userRole = $user->role;
            }

            $log = AuditLog::create([
                'user_id' => $userId,
                'user_name' => $userName,
                'user_role' => $userRole,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'entity_label' => $entityLabel,
                'metadata' => $metadata,
                'ip_address' => $ipAddress,
            ]);

            \App\Services\RealtimeService::broadcast('admin:audit_logs', [
                'event' => 'log_created',
                'log' => $log
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to write audit log: " . $e->getMessage(), [
                'exception' => $e,
                'action' => $action,
                'entityType' => $entityType,
                'entityId' => $entityId,
            ]);
        }
    }
}
