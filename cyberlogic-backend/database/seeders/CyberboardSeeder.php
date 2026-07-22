<?php

namespace Database\Seeders;

use App\Models\CyberboardBoard;
use App\Models\CyberboardCard;
use App\Models\CyberboardColumn;
use App\Models\User;
use Illuminate\Database\Seeder;

class CyberboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::whereIn('role', ['admin', 'superadmin'])->first() ?? User::first();

        if (!$admin) {
            return;
        }

        // 1. Create a flagship demo board
        $board = CyberboardBoard::create([
            'title' => 'Cybersecurity Week 2026',
            'description' => 'Official activity planner and idea submission board for Cyberlogic Week & Tech Summit.',
            'cover_color' => '#06b6d4',
            'created_by' => $admin->id,
            'is_archived' => false,
        ]);

        // 2. Create standard columns
        $columns = [
            $board->columns()->create(['title' => 'Ideas', 'icon' => '💡', 'color' => '#06b6d4', 'position' => 0]),
            $board->columns()->create(['title' => 'Under Review', 'icon' => '📋', 'color' => '#f59e0b', 'position' => 1]),
            $board->columns()->create(['title' => 'Approved', 'icon' => '✅', 'color' => '#10b981', 'position' => 2]),
            $board->columns()->create(['title' => 'In Progress', 'icon' => '🚀', 'color' => '#8b5cf6', 'position' => 3]),
            $board->columns()->create(['title' => 'Completed', 'icon' => '🎉', 'color' => '#ec4899', 'position' => 4]),
        ];

        // 3. Seed initial activity cards with dates, priority, owner
        CyberboardCard::create([
            'column_id' => $columns[0]->id,
            'user_id' => $admin->id,
            'title' => 'Capture The Flag (CTF) Competition',
            'description' => 'Organize a 24-hour online Jeopardy-style CTF with web, crypto, and reverse engineering challenges.',
            'activity_date' => '2026-08-15',
            'activity_end_date' => '2026-08-16',
            'priority' => 'high',
            'color_tag' => '#06b6d4',
            'position' => 0,
        ]);

        CyberboardCard::create([
            'column_id' => $columns[0]->id,
            'user_id' => $admin->id,
            'title' => 'Hardware Repair & Servicing Booth',
            'description' => 'Free laptop cleaning, thermal paste re-application, and diagnostics service for all club members.',
            'activity_date' => '2026-08-18',
            'priority' => 'medium',
            'color_tag' => '#10b981',
            'position' => 1,
        ]);

        CyberboardCard::create([
            'column_id' => $columns[1]->id,
            'user_id' => $admin->id,
            'title' => 'Guest Speaker: Ethically Hacking Smart Devices',
            'description' => 'Invite an industry professional to conduct a live IoT security demonstration.',
            'activity_date' => '2026-08-20',
            'priority' => 'high',
            'color_tag' => '#f59e0b',
            'position' => 0,
        ]);

        CyberboardCard::create([
            'column_id' => $columns[2]->id,
            'user_id' => $admin->id,
            'title' => 'Cyberlogic Merch & Sticker Design Drive',
            'description' => 'Design submission contest for official 2026 hoodies, lanyards, and laptop stickers.',
            'activity_date' => '2026-08-10',
            'priority' => 'low',
            'color_tag' => '#ec4899',
            'position' => 0,
        ]);
    }
}
