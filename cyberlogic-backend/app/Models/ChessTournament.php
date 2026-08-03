<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChessTournament extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'creator_id',
        'max_players',
        'time_control',
        'match_checkin_minutes',
        'type',
        'enable_third_place_match',
        'elimination_mode',
        'status',
        'winner_id',
        'current_round',
        'total_rounds',
        'started_at',
        'scheduled_at',
        'completed_at',
    ];

    protected $casts = [
        'enable_third_place_match' => 'boolean',
        'max_players' => 'integer',
        'time_control' => 'integer',
        'match_checkin_minutes' => 'integer',
        'current_round' => 'integer',
        'total_rounds' => 'integer',
        'started_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ChessTournamentParticipant::class, 'tournament_id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(ChessTournamentMatch::class, 'tournament_id')->orderBy('round_number')->orderBy('match_number');
    }
}
