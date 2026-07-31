<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChessGame extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_code',
        'host_player_id',
        'white_player_id',
        'black_player_id',
        'type',
        'time_control',
        'white_time_left_ms',
        'black_time_left_ms',
        'allow_spectators',
        'status',
        'fen',
        'pgn',
        'current_turn',
        'last_move_at',
        'winner_id',
        'win_reason',
        'is_draw',
        'white_elo_change',
        'black_elo_change',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'allow_spectators' => 'boolean',
        'is_draw' => 'boolean',
        'time_control' => 'integer',
        'white_time_left_ms' => 'integer',
        'black_time_left_ms' => 'integer',
        'white_elo_change' => 'integer',
        'black_elo_change' => 'integer',
        'last_move_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_player_id');
    }

    public function whitePlayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'white_player_id');
    }

    public function blackPlayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'black_player_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }
}
