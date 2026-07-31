<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChessPlayerStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'elo_rating',
        'peak_elo',
        'ranked_wins',
        'ranked_losses',
        'ranked_draws',
        'casual_wins',
        'casual_losses',
        'casual_draws',
        'chess_reputation_points',
    ];

    /**
     * Get the user that owns the chess stat.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
