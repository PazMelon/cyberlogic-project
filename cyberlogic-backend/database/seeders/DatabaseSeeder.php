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
        // User::factory(10)->create();

        // Seed Super Admin (Club Moderator)
        User::create([
            'first_name' => 'Club',
            'last_name' => 'Moderator',
            'middle_name' => null,
            'email' => 'moderator@uni.edu',
            'password' => bcrypt('moderatorpassword1234!'),
            'school_id' => 'MOD-2026-0001',
            'year_level' => 'Faculty',
            'department' => 'Information Technology',
            'address' => 'Cyberlogic Admin Office, Room 402',
            'birthday' => '1985-05-15',
            'role' => 'superadmin',
        ]);

        // Seed Admin/Officer
        User::create([
            'first_name' => 'Alex',
            'last_name' => 'Reyes',
            'middle_name' => null,
            'email' => 'alex.reyes@uni.edu',
            'password' => bcrypt('password123'),
            'school_id' => '2023-00045',
            'year_level' => '4th Year',
            'department' => 'Computer Science',
            'address' => '123 University Ave, Cityville',
            'birthday' => '2004-03-22',
            'role' => 'admin',
        ]);

        // Seed Standard Member
        User::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'middle_name' => 'A.',
            'email' => 'john.doe@university.edu',
            'password' => bcrypt('password123'),
            'school_id' => '2025-00123',
            'year_level' => '2nd Year',
            'department' => 'Information Technology',
            'address' => '456 Residence Hall, Campus',
            'birthday' => '2005-09-01',
            'role' => 'member',
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

        \App\Models\Announcement::create([
            'title' => 'Annual Cyber Defense Workshop Series',
            'subtitle' => 'Secure Coding, Network Forensics, and Penetration Testing.',
            'excerpt' => 'Join us for a 4-week weekend workshop covering practical defensive security techniques and server hardening procedures.',
            'content' => 'We are hosting a series of training sessions led by cybersecurity veterans. All members get free entry.',
            'category' => 'Events',
            'author' => 'Alex Reyes',
            'author_avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
            'date' => 'Jun 28, 2026',
            'pinned' => false,
            'sections' => [
                [
                    'type' => 'text',
                    'id' => 'sec-2',
                    'title' => 'Workshop Syllabus',
                    'html' => '<ol><li>Week 1: Linux Fundamentals & System Hardening</li><li>Week 2: OWASP Top 10 & Code Audit</li><li>Week 3: Wireshark Network Traffic Analysis</li><li>Week 4: Mock CTF Lab Execution</li></ol>'
                ]
            ]
        ]);
    }
}
