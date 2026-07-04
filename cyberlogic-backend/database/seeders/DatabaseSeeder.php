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
    }
}
