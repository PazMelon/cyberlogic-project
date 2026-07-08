<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the permissions system and migrates legacy officer role to admin.
     */
    public function up(): void
    {
        // 1. Create the permissions table
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('group');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 2. Create the permission_user pivot table
        Schema::create('permission_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'permission_id']);
        });

        // 3. Add admin_position column to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('admin_position')->nullable()->after('role');
        });

        // 4. Seed the default permissions
        $now = now();
        DB::table('permissions')->insert([
            ['key' => 'view_admin_dashboard', 'label' => 'View Admin Dashboard', 'group' => 'System', 'description' => 'Access the admin dashboard overview', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_users', 'label' => 'Manage Users', 'group' => 'Users', 'description' => 'View, approve, reject, and delete user accounts', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_announcements', 'label' => 'Manage Announcements', 'group' => 'Content', 'description' => 'Create, edit, and delete announcements', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_blogs', 'label' => 'Manage Blog Posts', 'group' => 'Content', 'description' => 'Create, edit, and delete blog posts', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_events', 'label' => 'Manage Events', 'group' => 'Content', 'description' => 'Create, edit, and delete events', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_resources', 'label' => 'Manage Resources', 'group' => 'Content', 'description' => 'Manage shared resources and files', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_chat', 'label' => 'Manage Chat Channels', 'group' => 'Content', 'description' => 'Create, edit, delete, and reorder chat channels', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_forums', 'label' => 'Manage Forum Categories', 'group' => 'Content', 'description' => 'Create, edit, delete forum categories and moderate threads', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'manage_settings', 'label' => 'Manage Site Settings', 'group' => 'System', 'description' => 'Edit site-wide configuration and appearance settings', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'view_audit_logs', 'label' => 'View Audit Logs', 'group' => 'System', 'description' => 'View the system audit trail', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 5. Migrate legacy 'officer' role users to 'admin'
        DB::table('users')
            ->where('role', 'officer')
            ->update(['role' => 'admin']);

        // 6. Update chat_channels allowed_roles: replace 'officer' with nothing
        $channels = DB::table('chat_channels')->get();
        foreach ($channels as $channel) {
            if ($channel->allowed_roles) {
                $roles = json_decode($channel->allowed_roles, true);
                if (is_array($roles)) {
                    $roles = array_values(array_filter($roles, fn($r) => $r !== 'officer'));
                    DB::table('chat_channels')
                        ->where('id', $channel->id)
                        ->update(['allowed_roles' => json_encode($roles)]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('admin_position');
        });

        Schema::dropIfExists('permission_user');
        Schema::dropIfExists('permissions');
    }
};
