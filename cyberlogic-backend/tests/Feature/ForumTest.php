<?php

use App\Models\ForumCategory;
use App\Models\ForumComment;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * Setup categories and users for testing
 *
 * @return array{discussionCategory: ForumCategory, supportCategory: ForumCategory, user: User, author: User, admin: User}
 */
function setupForumTest(): array
{
    $discussionCategory = ForumCategory::create([
        'name' => 'General',
        'slug' => 'general',
        'description' => 'General chat',
        'color' => 'primary',
        'type' => 'discussion',
    ]);

    $supportCategory = ForumCategory::create([
        'name' => 'Support',
        'slug' => 'support',
        'description' => 'Support requests',
        'color' => 'success',
        'type' => 'support',
    ]);

    $permission = \App\Models\Permission::firstOrCreate(
        ['key' => 'manage_forums'],
        [
            'label' => 'Manage Forum Categories',
            'group' => 'Content',
            'description' => 'Create, edit, delete forum categories and moderate threads'
        ]
    );

    $user = User::factory()->create(['role' => 'member', 'status' => 'approved']);
    $author = User::factory()->create(['role' => 'member', 'status' => 'approved']);
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'approved']);
    $admin->permissions()->attach($permission->id);

    return [
        'discussionCategory' => $discussionCategory,
        'supportCategory' => $supportCategory,
        'user' => $user,
        'author' => $author,
        'admin' => $admin,
    ];
}

test('public users can list categories', function () {
    setupForumTest();

    $response = $this->getJson('/api/forum/categories');
    $response->assertStatus(200);
    $response->assertJsonCount(2);
});

test('public users can list threads', function () {
    $setup = setupForumTest();

    ForumThread::create([
        'title' => 'Test Thread',
        'content' => 'Test content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    $response = $this->getJson('/api/forum/threads');
    $response->assertStatus(200);
    $response->assertJsonCount(1);
});

test('authenticated users can create a thread', function () {
    $setup = setupForumTest();

    $response = $this->actingAs($setup['user'])
        ->postJson('/api/forum/threads', [
            'title' => 'My New Thread',
            'content' => 'Body content',
            'category_id' => $setup['discussionCategory']->id,
        ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('forum_threads', ['title' => 'My New Thread']);
});

test('only thread owner or admin can update the thread', function () {
    $setup = setupForumTest();

    $thread = ForumThread::create([
        'title' => 'Original Title',
        'content' => 'Content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    // Regular user cannot update
    $this->actingAs($setup['user'])
        ->putJson("/api/forum/threads/{$thread->id}", [
            'title' => 'Hacked Title',
            'content' => 'Content',
            'category_id' => $setup['discussionCategory']->id,
        ])
        ->assertStatus(403);

    // Owner can update
    $this->actingAs($setup['author'])
        ->putJson("/api/forum/threads/{$thread->id}", [
            'title' => 'Updated Title',
            'content' => 'Content',
            'category_id' => $setup['discussionCategory']->id,
        ])
        ->assertStatus(200);

    // Admin can update
    $this->actingAs($setup['admin'])
        ->putJson("/api/forum/threads/{$thread->id}", [
            'title' => 'Admin Updated Title',
            'content' => 'Content',
            'category_id' => $setup['discussionCategory']->id,
        ])
        ->assertStatus(200);
});

test('thread owner can mark solved in support categories but not in discussion categories', function () {
    $setup = setupForumTest();

    // 1. Thread in discussion category
    $discThread = ForumThread::create([
        'title' => 'Discussion Thread',
        'content' => 'Content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    $discComment = ForumComment::create([
        'thread_id' => $discThread->id,
        'user_id' => $setup['user']->id,
        'content' => 'Helpful comment',
    ]);

    $this->actingAs($setup['author'])
        ->putJson("/api/forum/threads/{$discThread->id}/solve", ['comment_id' => $discComment->id])
        ->assertStatus(422); // Rejected because it's not a support category

    // 2. Thread in support category
    $suppThread = ForumThread::create([
        'title' => 'Support Thread',
        'content' => 'Content',
        'category_id' => $setup['supportCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    $suppComment = ForumComment::create([
        'thread_id' => $suppThread->id,
        'user_id' => $setup['user']->id,
        'content' => 'Helpful comment',
    ]);

    $this->actingAs($setup['author'])
        ->putJson("/api/forum/threads/{$suppThread->id}/solve", ['comment_id' => $suppComment->id])
        ->assertStatus(200)
        ->assertJsonPath('is_solved', true)
        ->assertJsonPath('solution_comment_id', $suppComment->id);
});

test('only admin can close or open a thread', function () {
    $setup = setupForumTest();

    $thread = ForumThread::create([
        'title' => 'Any Thread',
        'content' => 'Content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    // Owner cannot close
    $this->actingAs($setup['author'])
        ->putJson("/api/forum/threads/{$thread->id}/close")
        ->assertStatus(403);

    // Admin can close
    $this->actingAs($setup['admin'])
        ->putJson("/api/forum/threads/{$thread->id}/close")
        ->assertStatus(200)
        ->assertJsonPath('is_closed', true);
});

test('posting comments is rejected if the thread is closed', function () {
    $setup = setupForumTest();

    $thread = ForumThread::create([
        'title' => 'Closed Thread',
        'content' => 'Content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
        'is_closed' => true,
    ]);

    $this->actingAs($setup['user'])
        ->postJson("/api/forum/threads/{$thread->id}/comments", [
            'content' => 'My reply',
        ])
        ->assertStatus(403);
});

test('users can vote on threads and comments', function () {
    $setup = setupForumTest();

    $thread = ForumThread::create([
        'title' => 'Votable Thread',
        'content' => 'Content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    $comment = ForumComment::create([
        'thread_id' => $thread->id,
        'user_id' => $setup['author']->id,
        'content' => 'Votable comment',
    ]);

    // Upvote thread
    $this->actingAs($setup['user'])
        ->postJson("/api/forum/threads/{$thread->id}/vote", ['value' => 1])
        ->assertStatus(200)
        ->assertJson([
            'vote_score' => 1,
            'user_vote' => 1,
        ]);

    // Upvote comment
    $this->actingAs($setup['user'])
        ->postJson("/api/forum/comments/{$comment->id}/vote", ['value' => 1])
        ->assertStatus(200)
        ->assertJson([
            'vote_score' => 1,
            'user_vote' => 1,
        ]);
});

test('authenticated users can create a thread with images, spoiler, and redacted flags', function () {
    [$discussionCategory, , $user] = array_values(setupForumTest());

    // Mock storage disk
    Storage::fake('public');

    $response = $this->actingAs($user)
        ->postJson('/api/forum/threads', [
            'title' => 'My Styled Thread',
            'content' => 'Body content',
            'category_id' => $discussionCategory->id,
            'is_spoiler' => true,
            'is_redacted' => true,
            'images' => [
                UploadedFile::fake()->image('cyber1.jpg'),
                UploadedFile::fake()->image('cyber2.png'),
            ],
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('is_spoiler', true)
        ->assertJsonPath('is_redacted', true);

    $this->assertDatabaseHas('forum_threads', [
        'title' => 'My Styled Thread',
        'is_spoiler' => true,
        'is_redacted' => true,
    ]);
});

test('posting comments supports spoiler and redacted switches', function () {
    [$discussionCategory, , $user, $author] = array_values(setupForumTest());

    $thread = ForumThread::create([
        'title' => 'Sample Thread',
        'content' => 'Content',
        'category_id' => $discussionCategory->id,
        'user_id' => $author->id,
    ]);

    $response = $this->actingAs($user)
        ->postJson("/api/forum/threads/{$thread->id}/comments", [
            'content' => 'My hidden reply',
            'is_spoiler' => true,
            'is_redacted' => true,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('is_spoiler', true)
        ->assertJsonPath('is_redacted', true);

    $this->assertDatabaseHas('forum_comments', [
        'content' => 'My hidden reply',
        'is_spoiler' => true,
        'is_redacted' => true,
    ]);
});

test('deleting a comment decreases owner reputation score by 5', function () {
    $setup = setupForumTest();
    $user = $setup['user'];

    $thread = ForumThread::create([
        'title' => 'Test Thread',
        'content' => 'Test content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $setup['author']->id,
    ]);

    $comment = ForumComment::create([
        'thread_id' => $thread->id,
        'user_id' => $user->id,
        'content' => 'My comment that will be deleted',
    ]);

    // Initial reputation (should be 0)
    expect($user->calculateReputationScore())->toBe(0);

    // Delete comment
    $this->actingAs($user)
        ->deleteJson("/api/forum/comments/{$comment->id}")
        ->assertStatus(200);

    // Refresh user and verify reputation is -5
    $user->refresh();
    expect($user->calculateReputationScore())->toBe(-5);
});

test('voting on own thread or comment does not affect reputation score', function () {
    $setup = setupForumTest();
    $author = $setup['author'];
    $otherUser = $setup['user'];

    $thread = ForumThread::create([
        'title' => 'Test Thread',
        'content' => 'Test content',
        'category_id' => $setup['discussionCategory']->id,
        'user_id' => $author->id,
    ]);

    $comment = ForumComment::create([
        'thread_id' => $thread->id,
        'user_id' => $author->id,
        'content' => 'Test comment',
    ]);

    // Self-vote thread (should not grant points to author)
    $this->actingAs($author)
        ->postJson("/api/forum/threads/{$thread->id}/vote", ['value' => 1])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(0);

    // Self-vote comment (should not grant points to author)
    $this->actingAs($author)
        ->postJson("/api/forum/comments/{$comment->id}/vote", ['value' => 1])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(0);

    // Other user votes on thread (should grant 5 points to author)
    $this->actingAs($otherUser)
        ->postJson("/api/forum/threads/{$thread->id}/vote", ['value' => 1])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(5);

    // Other user votes on comment (should grant 3 points to author)
    $this->actingAs($otherUser)
        ->postJson("/api/forum/comments/{$comment->id}/vote", ['value' => 1])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(8); // 5 + 3 = 8
});

test('voting on own resource does not affect reputation score', function () {
    $setup = setupForumTest();
    $author = $setup['author'];
    $otherUser = $setup['user'];

    $resource = \App\Models\Resource::create([
        'title' => 'Test Resource',
        'description' => 'Test description',
        'category' => 'Documents',
        'file_path' => 'resources/test.pdf',
        'user_id' => $author->id,
        'status' => 'approved', // Approved status counts as 10 pts but we are testing votes
    ]);

    // Initial reputation score: 10 (from approved status)
    expect($author->calculateReputationScore())->toBe(10);

    // Self-vote resource (should not grant points)
    $this->actingAs($author)
        ->postJson("/api/resources/{$resource->id}/vote", ['value' => 1])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(10);

    // Other user votes on resource (should grant 3 points)
    $this->actingAs($otherUser)
        ->postJson("/api/resources/{$resource->id}/vote", ['value' => 1])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(13); // 10 + 3 = 13
});

test('marking own comment as solution does not award reputation points', function () {
    $setup = setupForumTest();
    $author = $setup['author'];
    $otherUser = $setup['user'];

    // Create a support category thread (only support categories allow solutions)
    $thread = ForumThread::create([
        'title' => 'Support Request',
        'content' => 'Need help',
        'category_id' => $setup['supportCategory']->id,
        'user_id' => $author->id,
    ]);

    // Author's own comment on their own thread
    $ownComment = ForumComment::create([
        'thread_id' => $thread->id,
        'user_id' => $author->id,
        'content' => 'I figured it out myself',
    ]);

    // Other user's comment
    $otherComment = ForumComment::create([
        'thread_id' => $thread->id,
        'user_id' => $otherUser->id,
        'content' => 'Here is a helper answer',
    ]);

    // 1. Mark other user's comment as solution (other user should get 25 points)
    $this->actingAs($author)
        ->putJson("/api/forum/threads/{$thread->id}/solve", ['comment_id' => $otherComment->id])
        ->assertStatus(200);

    $otherUser->refresh();
    expect($otherUser->calculateReputationScore())->toBe(25);

    // 2. Mark own comment as solution (author should get 0 points)
    $this->actingAs($author)
        ->putJson("/api/forum/threads/{$thread->id}/solve", ['comment_id' => $ownComment->id])
        ->assertStatus(200);

    $author->refresh();
    expect($author->calculateReputationScore())->toBe(0);
});


