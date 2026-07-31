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
    ];

    protected $casts = [
        'is_third_place' => 'boolean',
        'round_number' => 'integer',
        'match_number' => 'integer',
    ];

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
