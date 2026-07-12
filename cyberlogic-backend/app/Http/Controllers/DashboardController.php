<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ForumThread;
use App\Models\ChatMessage;
use App\Models\Event;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get statistics for the member dashboard.
     */
    public function getMemberStats(Request $request)
    {
        $forumThreads = ForumThread::count();
        
        // Count chat messages from today
        $chatMessagesToday = ChatMessage::where('created_at', '>=', Carbon::today())->count();
        
        // Count active members (approved users)
        $activeMembers = User::where('status', 'approved')->count();
        
        // Calculate upcoming events
        $todayStr = Carbon::today()->toDateString();
        $upcomingEventsCount = Event::where('date', '>=', $todayStr)->count();
        
        $nextEvent = Event::where('date', '>=', $todayStr)
            ->orderBy('date', 'asc')
            ->first();
            
        $nextEventDateStr = "None scheduled";
        if ($nextEvent) {
            $nextDate = Carbon::parse($nextEvent->date);
            $nextEventDateStr = "Next: " . $nextDate->format('M j');
        }

        return response()->json([
            'forum_threads' => $forumThreads,
            'chat_messages_today' => $chatMessagesToday,
            'active_members' => $activeMembers,
            'upcoming_events' => $upcomingEventsCount,
            'next_event_date' => $nextEventDateStr,
        ]);
    }

    /**
     * Get statistics for the admin dashboard.
     */
    public function getAdminStats(Request $request)
    {
        // Total approved/active members
        $totalMembers = User::where('status', 'approved')->count();
        
        // Pending approval queue count
        $pendingMembers = User::where('status', 'pending')->count();
        
        // Active threads
        $activeThreads = ForumThread::count();
        
        // Threads created this week
        $threadsThisWeek = ForumThread::where('created_at', '>=', Carbon::now()->startOfWeek())->count();
        
        // Upcoming events count
        $todayStr = Carbon::today()->toDateString();
        $upcomingEventsCount = Event::where('date', '>=', $todayStr)->count();
        
        $nextEvent = Event::where('date', '>=', $todayStr)
            ->orderBy('date', 'asc')
            ->first();
            
        $nextEventDateStr = "None scheduled";
        if ($nextEvent) {
            $nextDate = Carbon::parse($nextEvent->date);
            $nextEventDateStr = "Next: " . $nextDate->format('M j');
        }

        return response()->json([
            'total_members' => $totalMembers,
            'pending_members' => $pendingMembers,
            'active_threads' => $activeThreads,
            'threads_this_week' => $threadsThisWeek,
            'upcoming_events' => $upcomingEventsCount,
            'next_event_date' => $nextEventDateStr,
        ]);
    }
}
