<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CyberboardCard;
use App\Models\CyberboardColumn;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotifyCyberboardDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cyberboard:notify-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily 2:00 AM notifications to assigned members for overdue and imminent deadline tasks';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Evaluating task deadlines and notifying assigned members...');

        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // Fetch active, non-archived cards with an activity_end_date
        $cards = CyberboardCard::with(['column'])
            ->where('is_archived', false)
            ->whereNotNull('activity_end_date')
            ->get();

        $notifiedCount = 0;

        foreach ($cards as $card) {
            // Skip completed columns
            if ($card->column) {
                $statusType = strtolower($card->column->status_type ?? '');
                $colTitle = strtolower($card->column->title ?? '');
                if ($statusType === 'completed' || str_contains($colTitle, 'done') || str_contains($colTitle, 'completed')) {
                    continue;
                }
            }

            $endDate = Carbon::parse($card->activity_end_date)->startOfDay();
            $isOverdue = $endDate->lt($today);
            $isDueSoon = !$isOverdue && ($endDate->isToday() || $endDate->isSameDay($tomorrow));

            if (!$isOverdue && !$isDueSoon) {
                continue;
            }

            // Gather assigned user IDs
            $assignedIds = [];
            if (!empty($card->assigned_user_ids) && is_array($card->assigned_user_ids)) {
                $assignedIds = array_map('intval', $card->assigned_user_ids);
            } elseif ($card->assigned_user_id) {
                $assignedIds = [(int) $card->assigned_user_id];
            }

            if (empty($assignedIds)) {
                continue;
            }

            $boardId = $card->column ? $card->column->board_id : null;
            $link = $boardId ? "/app/cyberboard/{$boardId}?card={$card->id}" : "/app/cyberboard";

            foreach (array_unique($assignedIds) as $userId) {
                if ($isOverdue) {
                    $daysAgo = $today->diffInDays($endDate);
                    $daysText = $daysAgo === 0 ? 'today' : "{$daysAgo} day(s) ago";
                    $title = "⚠️ Overdue Task Alert: {$card->title}";
                    $body = "Task '{$card->title}' assigned to you was due on {$endDate->format('M d, Y')} ({$daysText}). Please update its status.";
                    $type = 'cyberboard_overdue';
                } else {
                    $dueText = $endDate->isToday() ? 'today' : 'tomorrow';
                    $title = "⏰ Approaching Deadline Alert: {$card->title}";
                    $body = "Task '{$card->title}' assigned to you is due {$dueText} ({$endDate->format('M d, Y')}). Please review your progress.";
                    $type = 'cyberboard_due_soon';
                }

                try {
                    NotificationService::notifyUser(
                        $userId,
                        $type,
                        $title,
                        $body,
                        [
                            'card_id' => $card->id,
                            'board_id' => $boardId,
                            'end_date' => $endDate->toIso8601String(),
                            'is_overdue' => $isOverdue,
                        ],
                        $isOverdue ? 'alert-triangle' : 'clock',
                        $link
                    );
                    $notifiedCount++;
                } catch (\Throwable $e) {
                    Log::error("[NotifyCyberboardDeadlines] Error notifying user {$userId} for card {$card->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Completed daily deadline evaluation. Sent {$notifiedCount} notifications.");
        return 0;
    }
}
