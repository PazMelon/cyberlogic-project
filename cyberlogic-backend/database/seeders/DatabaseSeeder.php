<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\User;
use App\Models\SiteSetting;
use App\Models\Officer;
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
        Announcement::create([
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
                    'html' => '<p>Cyberlogic offers a comprehensive pathway to practical cybersecurity competencies, hands-on vulnerability assessments, and capture-the-flag competitions. Joining the club grants you access to exclusive CTF labs, hardware toolsets, and mentorship from industry specialists.</p>',
                ],
            ],
        ]);

        $this->call(ForumSeeder::class);
        $this->call(ChatChannelSeeder::class);

        // Seed site settings defaults
        SiteSetting::updateOrCreate(
            ['key' => 'default_theme'],
            ['value' => 'cyberpunk']
        );

        SiteSetting::updateOrCreate(
            ['key' => 'about_mission'],
            ['value' => 'To empower students with practical tech and digital skills through hands-on workshops in hardware, software, and creative digital arts.']
        );

        SiteSetting::updateOrCreate(
            ['key' => 'about_vision'],
            ['value' => 'To be the leading student technology hub, fostering creative problem-solvers and builders of the digital future.']
        );

        SiteSetting::updateOrCreate(
            ['key' => 'about_values'],
            ['value' => 'Curiosity, collaboration, integrity, and continuous learning. We believe in open knowledge sharing and supporting each other\'s growth.']
        );

        $defaultHistory = [
            [
                'year' => '2020',
                'title' => 'Club Founded',
                'desc' => 'Cyberlogic Club was established by a group of technology-passionate students to bridge the gap between classroom theory and real-world application.'
            ],
            [
                'year' => '2021',
                'title' => 'First Bootcamp',
                'desc' => 'Hosted our first inter-departmental digital design showcase and hardware troubleshooting bootcamp.'
            ],
            [
                'year' => '2022',
                'title' => 'Innovation Hub Inauguration',
                'desc' => 'Opened our dedicated computer servicing and digital design hub with custom workspace tools.'
            ],
            [
                'year' => '2023',
                'title' => '100+ Members',
                'desc' => 'Reached over 100 active members and launched our online learning platform.'
            ],
            [
                'year' => '2024',
                'title' => 'Campus Recognition',
                'desc' => 'Recognized as one of the most innovative and active student organizations at St. Rita\'s College.'
            ],
            [
                'year' => '2026',
                'title' => 'Portal Launch',
                'desc' => 'Launched the Cyberlogic Club Portal — a centralized hub for members and resources.'
            ]
        ];

        SiteSetting::updateOrCreate(
            ['key' => 'about_history'],
            ['value' => json_encode($defaultHistory)]
        );

        // Fetch users to link
        $moderator = User::where('email', 'clubmoderator@srcb.edu.ph')->first();
        if ($moderator) {
            $moderator->update(['admin_position' => 'Club Adviser', 'bio' => 'Faculty member and adviser guiding the next generation of cybersecurity experts.']);
            Officer::updateOrCreate(
                ['user_id' => $moderator->id],
                [
                    'use_profile_info' => true,
                    'sort_order' => 0
                ]
            );
        }

        $odemil = User::where('email', 'odemiluyan@srcb.edu.ph')->first();
        if ($odemil) {
            $odemil->update(['admin_position' => 'Tech Lead', 'bio' => 'IT Faculty member specializing in cybersecurity audits and full-stack development.']);
            Officer::updateOrCreate(
                ['user_id' => $odemil->id],
                [
                    'use_profile_info' => true,
                    'sort_order' => 1
                ]
            );
        }

        // Seed mock officers as custom officers
        $mockOfficers = [
            [
                'display_name' => 'Alex Reyes',
                'display_role' => 'President',
                'display_avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=alex',
                'display_bio' => '4th year CS student passionate about hardware servicing and open-source software.',
                'use_profile_info' => false,
                'sort_order' => 2
            ],
            [
                'display_name' => 'Samantha Cruz',
                'display_role' => 'Vice President',
                'display_avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=samantha',
                'display_bio' => 'Specializes in UI/UX design and leads our digital creative projects.',
                'use_profile_info' => false,
                'sort_order' => 3
            ],
            [
                'display_name' => 'Miguel Torres',
                'display_role' => 'Secretary',
                'display_avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=miguel',
                'display_bio' => 'Keeps everything organized and manages club communications.',
                'use_profile_info' => false,
                'sort_order' => 4
            ],
            [
                'display_name' => 'Jessica Lim',
                'display_role' => 'Treasurer',
                'display_avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=jessica',
                'display_bio' => 'Handles club finances and sponsors for events.',
                'use_profile_info' => false,
                'sort_order' => 5
            ]
        ];

        foreach ($mockOfficers as $officerData) {
            Officer::updateOrCreate(
                ['display_name' => $officerData['display_name']],
                $officerData
            );
        }
    }
}
