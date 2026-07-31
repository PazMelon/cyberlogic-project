<?php

namespace Database\Seeders;

use App\Models\ChessPlayerStat;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyMembersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $firstNames = [
          'Alexander', 'Sophia', 'Marcus', 'Elena', 'Julian', 'Isabella', 'Gabriel', 'Chloe',
          'Lucas', 'Victoria', 'Ethan', 'Camila', 'Sebastian', 'Aria', 'Dominic', 'Mia',
          'Adrian', 'Layla', 'Xavier', 'Nora', 'Tristan', 'Penelope', 'Nathaniel', 'Stella',
          'Zachary', 'Aurora', 'Damian', 'Hazel', 'Ezekiel', 'Ivy', 'Leo', 'Scarlett'
        ];

        $lastNames = [
          'Wright', 'Martinez', 'Vance', 'Rostova', 'Hayes', 'Sterling', 'Voss', 'Chen',
          'Mercer', 'Kovacs', 'Blackwood', 'Valdez', 'Sinclair', 'Moreno', 'Haworne', 'Guzman',
          'Sutton', 'Navarro', 'Cross', 'Villanueva', 'Drake', 'Castillo', 'Barrett', 'Reyes',
          'Gallagher', 'Mendoza', 'Vanguard', 'Aguilar', 'Wilder', 'Delgado', 'Vargas', 'Santiago'
        ];

        for ($i = 1; $i <= 32; $i++) {
            $firstName = $firstNames[($i - 1) % count($firstNames)];
            $lastName = $lastNames[($i - 1) % count($lastNames)];
            $email = "example{$i}@gmail.com";
            $username = "example{$i}";

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'username' => $username,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'password' => bcrypt('Password1234!'),
                    'school_id' => 'HED-2026-MEM' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                    'year_level' => '3rd Year',
                    'department' => 'Information Technology',
                    'address' => 'Cyberlogic Student Hub',
                    'birthday' => '2004-05-15',
                    'role' => 'member',
                    'status' => 'approved',
                ]
            );

            // Create initial chess stats for immediate tournament participation
            ChessPlayerStat::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'elo_rating' => rand(1200, 1500),
                    'peak_elo' => rand(1400, 1600),
                    'chess_reputation_points' => rand(10, 50),
                ]
            );
        }
    }
}
