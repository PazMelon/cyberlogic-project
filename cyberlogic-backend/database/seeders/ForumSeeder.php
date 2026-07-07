<?php

namespace Database\Seeders;

use App\Models\ForumCategory;
use Illuminate\Database\Seeder;

class ForumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'General Discussion',
                'slug' => 'general',
                'description' => 'Chat about anything club-related',
                'color' => 'primary',
                'type' => 'discussion',
                'sort_order' => 1,
            ],
            [
                'name' => 'Tech Talk',
                'slug' => 'tech-talk',
                'description' => 'Discuss latest tech, tools, and trends',
                'color' => 'accent',
                'type' => 'discussion',
                'sort_order' => 2,
            ],
            [
                'name' => 'Help & Support',
                'slug' => 'help',
                'description' => 'Ask questions and get help from members',
                'color' => 'success',
                'type' => 'support',
                'sort_order' => 3,
            ],
            [
                'name' => 'CTF Challenges',
                'slug' => 'ctf',
                'description' => 'Discuss CTF strategies and writeups',
                'color' => 'error',
                'type' => 'discussion',
                'sort_order' => 4,
            ],
            [
                'name' => 'Off-Topic',
                'slug' => 'off-topic',
                'description' => 'Random chats and fun stuff',
                'color' => 'warning',
                'type' => 'discussion',
                'sort_order' => 5,
            ],
        ];

        foreach ($categories as $cat) {
            ForumCategory::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
