<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChessTournamentParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_id',
        'user_id',
        'seed',
        'status',
        'joined_at',
    ];

    protected $casts = [
        'seed' => 'integer',
        'joined_at' => 'datetime',
    ];

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(ChessTournament::class, 'tournament_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
