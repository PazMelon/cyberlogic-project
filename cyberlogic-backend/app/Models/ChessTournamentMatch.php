<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChessTournamentMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_id',
        'round_number',
        'match_number',
        'is_third_place',
        'bracket_type',
        'white_user_id',
        'black_user_id',
        'chess_game_id',
        'winner_user_id',
        'status',
        'win_reason',
        // Fail-safe: check-in timer
        'match_ready_at',
        'first_checkin_at',
        'white_checked_in',
        'black_checked_in',
        // Fail-safe: disconnect pause
        'pause_count_white',
        'pause_count_black',
        'paused_at',
        'pause_remaining_ms',
        'paused_by_color',
    ];

    protected $casts = [
        'is_third_place' => 'boolean',
        'round_number' => 'integer',
        'match_number' => 'integer',
        'white_checked_in' => 'boolean',
        'black_checked_in' => 'boolean',
        'pause_count_white' => 'integer',
        'pause_count_black' => 'integer',
        'pause_remaining_ms' => 'integer',
        'match_ready_at' => 'datetime',
        'first_checkin_at' => 'datetime',
        'paused_at' => 'datetime',
    ];

    // ─── Fail-Safe Helper Methods ──────────────────────────

    /**
     * Check if both players have checked in.
     */
    public function isFullyCheckedIn(): bool
    {
        return $this->white_checked_in && $this->black_checked_in;
    }

    /**
     * Check if a given color can still use a pause (max 3 per player).
     */
    public function canPause(string $color): bool
    {
        $count = $color === 'white' ? $this->pause_count_white : $this->pause_count_black;
        return $count < 3;
    }

    /**
     * Check if the match is currently paused.
     */
    public function isPaused(): bool
    {
        return $this->paused_at !== null;
    }

    // ─── Relationships ─────────────────────────────────────

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(ChessTournament::class, 'tournament_id');
    }

    public function whiteUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'white_user_id');
    }

    public function blackUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'black_user_id');
    }

    public function chessGame(): BelongsTo
    {
        return $this->belongsTo(ChessGame::class, 'chess_game_id');
    }

    public function winnerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }
}
