<?php

use Illuminate\Support\Facades\Storage;

test('it serves files from public storage programmatically', function () {
    Storage::fake('public');

    // Create a mock file in public storage
    Storage::disk('public')->put('avatars/test-avatar.webp', 'fake-image-content');

    // Make request to the fallback route
    $response = $this->get('/storage/avatars/test-avatar.webp');

    $response->assertStatus(200);
    $this->assertEquals('fake-image-content', $response->streamedContent());
});

test('it returns 404 for non-existent files', function () {
    Storage::fake('public');

    $response = $this->get('/storage/avatars/non-existent.webp');

    $response->assertStatus(404);
});
