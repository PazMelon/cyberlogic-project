<?php

use App\Models\ForumCategory;
use App\Models\ForumComment;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

    $user = User::factory()->create(['role' => 'member']);
    $author = User::factory()->create(['role' => 'member']);
    $admin = User::factory()->create(['role' => 'admin']);

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
