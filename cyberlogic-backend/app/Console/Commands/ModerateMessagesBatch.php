<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChatMessage;
use App\Services\GeminiService;
use Illuminate\Support\Facades\Log;

class ModerateMessagesBatch extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chat:moderate-batch';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate and moderate unprocessed chat messages in batches using Gemini AI';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fetching unprocessed messages...');

        // Fetch messages where moderation_status is 'none', limit to 50
        $messages = ChatMessage::where('moderation_status', 'none')
            ->where('type', 'text')
            ->where(function($query) {
                $query->whereNull('user_id')
                      ->orWhereHas('user', function($q) {
                          $q->where('role', '!=', 'bot');
                      });
            })
            ->where('is_deleted', false)
            ->limit(50)
            ->get();

        if ($messages->isEmpty()) {
            $this->info('No unprocessed messages found.');
            return 0;
        }

        $this->info('Processing ' . $messages->count() . ' messages...');

        $payload = $messages->map(fn($m) => [
            'id' => $m->id,
            'content' => $m->content
        ])->toArray();

        $results = GeminiService::moderateBatch($payload);

        if (empty($results)) {
            $this->error('Failed to receive or parse AI moderation evaluation.');
            return 1;
        }

        $flaggedCount = 0;
        $approvedCount = 0;

        foreach ($results as $item) {
            $msgId = $item['id'] ?? null;
            $isHarmful = filter_var($item['is_harmful'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $reason = $item['reason'] ?? null;

            $message = ChatMessage::find($msgId);
            if ($message) {
                $message->update([
                    'is_flagged' => $isHarmful,
                    'flagged_reason' => $reason,
                    'moderation_status' => $isHarmful ? 'flagged' : 'approved',
                ]);

                if ($isHarmful) {
                    $flaggedCount++;
                } else {
                    $approvedCount++;
                }
            }
        }

        $this->info("Evaluation finished. Approved: {$approvedCount}, Flagged: {$flaggedCount}.");
        Log::info("Artisan batch moderation complete. Processed {$messages->count()} messages. Approved: {$approvedCount}, Flagged: {$flaggedCount}.");

        return 0;
    }
}
