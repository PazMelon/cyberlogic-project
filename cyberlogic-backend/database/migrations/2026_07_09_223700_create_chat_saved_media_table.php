<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_saved_media', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('url');
            $table->string('category')->nullable();
            $table->timestamps();
        });

        // Seed some popular reaction GIFs
        $gifs = [
            [
                'title' => 'Thumbs Up',
                'url' => 'https://media.giphy.com/media/3o7abKhOpu0NXS3l04/giphy.gif',
                'category' => 'Agree',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Celebration',
                'url' => 'https://media.giphy.com/media/26tOZ42cXxDTvpbMc/giphy.gif',
                'category' => 'Happy',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Laughing',
                'url' => 'https://media.giphy.com/media/3o6ozvv07CgdrQNZT2/giphy.gif',
                'category' => 'Funny',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Mind Blown',
                'url' => 'https://media.giphy.com/media/l0NwHXAntMSli_vDG/giphy.gif',
                'category' => 'Shocked',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Thank You',
                'url' => 'https://media.giphy.com/media/3oz8xIsloV7zO6Lf8c/giphy.gif',
                'category' => 'Thanks',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('chat_saved_media')->insert($gifs);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_saved_media');
    }
};
