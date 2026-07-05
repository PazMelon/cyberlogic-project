<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Requested Super Admin Accounts
        User::create([
            'first_name' => 'Club',
            'last_name' => 'Moderator',
            'middle_name' => null,
            'email' => 'clubmoderator@srcb.edu.ph',
            'password' => bcrypt('Password1234!'),
            'school_id' => 'MOD-SRCB-0001',
            'year_level' => 'Faculty',
            'department' => 'Information Technology',
            'address' => 'Cyberlogic Admin Office',
            'birthday' => '1990-01-01',
            'role' => 'superadmin',
            'status' => 'approved',
        ]);

        User::create([
            'first_name' => 'Odemil',
            'last_name' => 'Uyan',
            'middle_name' => 'Achas',
            'email' => 'odemiluyan@srcb.edu.ph',
            'password' => bcrypt('Password1234!'),
            'school_id' => 'HED-2025-UYA001',
            'year_level' => 'Faculty',
            'department' => 'Information Technology',
            'address' => 'TBA',
            'birthday' => '1997-04-02',
            'role' => 'superadmin',
            'status' => 'approved',
        ]);

        // Seed Default announcements
        \App\Models\Announcement::create([
            'title' => 'Cyberlogic Club Recruitment — Now Open!',
            'subtitle' => 'Join the premier student cyber security force and secure your digital future.',
            'excerpt' => "We're looking for passionate students who want to explore cybersecurity, programming, and tech innovation. Apply before July 15!",
            'content' => 'Our organization is gearing up for a brand new semester. Whether you are an experienced script kiddie or just getting started with network commands, we have a place for you.',
            'category' => 'General',
            'author' => 'System Admin',
            'author_avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=admin',
            'date' => 'Jul 1, 2026',
            'pinned' => true,
            'sections' => [
                [
                    'type' => 'text',
                    'id' => 'sec-1',
                    'title' => 'Why Join Cyberlogic?',
                    'html' => '<p>Cyberlogic offers a comprehensive pathway to practical cybersecurity competencies, hands-on vulnerability assessments, and capture-the-flag competitions. Joining the club grants you access to exclusive CTF labs, hardware toolsets, and mentorship from industry specialists.</p>'
                ]
            ]
        ]);
    }
}
