<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ForumThread;
use App\Models\ForumComment;
use App\Models\UserProject;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reportable_type' => 'required|string|in:thread,comment,project',
            'reportable_id' => 'required|integer',
            'reason' => 'required|string|max:255',
            'details' => 'nullable|string|max:1000',
        ]);

        $type = $request->input('reportable_type');
        $id = $request->input('reportable_id');

        $modelClass = null;
        $title = '';
        $ownerId = null;

        if ($type === 'thread') {
            $modelClass = ForumThread::class;
            $item = ForumThread::find($id);
            if (!$item) {
                return response()->json(['message' => 'Thread not found.'], 404);
            }
            $title = $item->title;
            $ownerId = $item->user_id;
        } elseif ($type === 'comment') {
            $modelClass = ForumComment::class;
            $item = ForumComment::find($id);
            if (!$item) {
                return response()->json(['message' => 'Comment not found.'], 404);
            }
            $title = Str::limit($item->content, 60);
            $ownerId = $item->user_id;
        } elseif ($type === 'project') {
            $modelClass = UserProject::class;
            $item = UserProject::find($id);
            if (!$item) {
                return response()->json(['message' => 'Project not found.'], 404);
            }
            $title = $item->title;
            $ownerId = $item->user_id;
        }

        // Prevent reporting own content
        if ($ownerId === $request->user()->id) {
            return response()->json(['message' => 'You cannot report your own content.'], 400);
        }

        $report = Report::create([
            'user_id' => $request->user()->id,
            'reportable_type' => $modelClass,
            'reportable_id' => $id,
            'reportable_title' => $title,
            'content_owner_id' => $ownerId,
            'reason' => $request->input('reason'),
            'details' => $request->input('details'),
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'report' => $report,
        ], 201);
    }

    /**
     * Display a listing of reports for admin review.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_forums')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reports = Report::with(['user', 'contentOwner', 'moderator', 'reportable'])
            ->orderBy('created_at', 'desc')
            ->get();

        $formatted = $reports->map(function ($report) {
            $typeLabel = 'project';
            if ($report->reportable_type === ForumThread::class) {
                $typeLabel = 'thread';
            } elseif ($report->reportable_type === ForumComment::class) {
                $typeLabel = 'comment';
            }

            $contentLink = null;
            if ($report->reportable) {
                if ($typeLabel === 'thread') {
                    $contentLink = "/app/forums/thread/{$report->reportable_id}";
                } elseif ($typeLabel === 'comment') {
                    $contentLink = "/app/forums/thread/{$report->reportable->thread_id}#comment-{$report->reportable_id}";
                } elseif ($typeLabel === 'project') {
                    $contentLink = "/app/profile/{$report->content_owner_id}?tab=showcase";
                }
            }

            return [
                'id' => $report->id,
                'reporter' => $report->user ? [
                    'id' => $report->user->id,
                    'name' => $report->user->name,
                ] : null,
                'content_owner' => $report->contentOwner ? [
                    'id' => $report->contentOwner->id,
                    'name' => $report->contentOwner->name,
                ] : null,
                'moderator' => $report->moderator ? [
                    'id' => $report->moderator->id,
                    'name' => $report->moderator->name,
                ] : null,
                'reportable_type' => $typeLabel,
                'reportable_id' => $report->reportable_id,
                'reportable_title' => $report->reportable_title,
                'reason' => $report->reason,
                'details' => $report->details,
                'status' => $report->status,
                'action_taken' => $report->action_taken,
                'created_at' => $report->created_at->toDateTimeString(),
                'content_exists' => $report->reportable !== null,
                'content_link' => $contentLink,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Update the specified report (moderator action).
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_forums')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'action' => 'required|string|in:remove,dismiss',
        ]);

        $report = Report::findOrFail($id);
        if ($report->status === 'resolved') {
            return response()->json(['message' => 'Report is already resolved.'], 400);
        }

        $action = $request->input('action');
        $contentTypeLabel = $report->reportable_type === ForumThread::class ? 'forum thread' :
                            ($report->reportable_type === ForumComment::class ? 'comment' : 'showcase project');
        if ($action === 'remove') {
            // Delete or redact actual content
            $content = $report->reportable;
            if ($content) {
                if ($report->reportable_type === ForumComment::class) {
                    $content->update([
                        'content' => '[This comment was removed by moderation for violating community rules: ' . $report->reason . ']',
                    ]);
                } else {
                    $content->delete();
                }
            }

            // Update report record
            $report->update([
                'status' => 'resolved',
                'action_taken' => 'removed',
                'moderator_id' => $user->id,
            ]);

            // Notify owner
            if ($report->content_owner_id) {
                NotificationService::notifyUser(
                    $report->content_owner_id,
                    'moderation',
                    'Content Removed',
                    "Your {$contentTypeLabel} '{$report->reportable_title}' has been removed by a moderator due to rules violations (Reason: {$report->reason}).",
                    null,
                    'ShieldAlert',
                    ''
                );
            }
        } elseif ($action === 'dismiss') {
            // Update report record
            $report->update([
                'status' => 'resolved',
                'action_taken' => 'dismissed',
                'moderator_id' => $user->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'report' => $report,
        ]);
    }

    /**
     * Remove the specified report from history.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasPermission('manage_forums')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $report = Report::findOrFail($id);
        $report->delete();

        return response()->json(['success' => true]);
    }
}
