<?php

namespace Database\Seeders;

use App\Models\ChatChannel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ChatChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks, truncate, and re-enable to clean up old channels
        Schema::disableForeignKeyConstraints();
        ChatChannel::truncate();
        Schema::enableForeignKeyConstraints();

        $defaultChannels = [
            [
                'name' => 'Welcome',
                'slug' => 'welcome',
                'description' => 'Welcome to the Cyberlogic Club! Start here to introduce yourself and meet members.',
                'type' => 'group',
                'icon' => 'Sparkles',
                'grouping' => 'Welcome & Info',
                'sort_order' => 1,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['officer', 'admin', 'superadmin'],
            ],
            [
                'name' => 'Announcements',
                'slug' => 'announcements',
                'description' => 'Realtime announcement stream, updates, and news from officers and admins.',
                'type' => 'group',
                'icon' => 'Megaphone',
                'grouping' => 'Welcome & Info',
                'sort_order' => 2,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['officer', 'admin', 'superadmin'],
            ],
            [
                'name' => 'Rules',
                'slug' => 'rules',
                'description' => 'Official club rules, chat guidelines, and community code of conduct.',
                'type' => 'group',
                'icon' => 'FileText',
                'grouping' => 'Welcome & Info',
                'sort_order' => 3,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['admin', 'superadmin'],
            ],
            [
                'name' => 'General',
                'slug' => 'general',
                'description' => 'General discussion room for casual chats, greetings, and networking.',
                'type' => 'group',
                'icon' => 'Hash',
                'grouping' => 'General Discussions',
                'sort_order' => 4,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
            ],
            [
                'name' => 'Off Topic',
                'slug' => 'off-topic',
                'description' => 'Non-academic chat, hobbies, gaming, and sharing memes.',
                'type' => 'group',
                'icon' => 'Laugh',
                'grouping' => 'General Discussions',
                'sort_order' => 5,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
            ],
            [
                'name' => 'Academics',
                'slug' => 'academics',
                'description' => 'Study support, class discussions, homework help, and learning resources.',
                'type' => 'group',
                'icon' => 'BookOpen',
                'grouping' => 'Academic & Help',
                'sort_order' => 6,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
            ],
            [
                'name' => 'Live Support',
                'slug' => 'live-support',
                'description' => 'Need help? Ask questions here to get realtime help regarding club platforms and systems.',
                'type' => 'group',
                'icon' => 'HeartHandshake',
                'grouping' => 'Academic & Help',
                'sort_order' => 7,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
            ],
            [
                'name' => 'Help',
                'slug' => 'help',
                'description' => 'Ask general questions, seek technical help, or get troubleshooting advice.',
                'type' => 'group',
                'icon' => 'HelpCircle',
                'grouping' => 'Academic & Help',
                'sort_order' => 8,
                'allowed_roles' => ['member', 'officer', 'admin', 'superadmin'],
                'write_roles' => ['member', 'officer', 'admin', 'superadmin'],
            ],
        ];

        foreach ($defaultChannels as $channel) {
            ChatChannel::create($channel);
        }
    }
}
