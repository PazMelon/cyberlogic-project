<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Retrieve a paginated list of audit logs with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('view_audit_logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        // Filter by entity type
        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->input('entity_type'));
        }

        // Filter by user ID (actor)
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        // Search in entity_label, user_name or ip_address
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('entity_label', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('entity_type', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, $request->integer('per_page', 25));
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Retrieve summary statistics for audit logs.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('view_audit_logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalCount = AuditLog::count();
        $todayCount = AuditLog::whereDate('created_at', today())->count();
        
        $topActor = AuditLog::select('user_name', DB::raw('count(*) as total'))
            ->whereNotNull('user_id')
            ->groupBy('user_name')
            ->orderBy('total', 'desc')
            ->first();

        $actionSummary = AuditLog::select('action', DB::raw('count(*) as total'))
            ->groupBy('action')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_logs' => $totalCount,
            'logs_today' => $todayCount,
            'top_actor' => $topActor ? $topActor->user_name : 'N/A',
            'top_actor_count' => $topActor ? $topActor->total : 0,
            'action_summary' => $actionSummary
        ]);
    }
}
