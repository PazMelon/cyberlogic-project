<?php

namespace App\Services;

use App\Models\ChessGame;
use App\Models\ChessTournament;
use App\Models\ChessTournamentMatch;
use App\Models\ChessTournamentParticipant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChessTournamentService
{
    protected ChessService $chessService;

    public function __construct(ChessService $chessService)
    {
        $this->chessService = $chessService;
    }

    /**
     * Create a new tournament.
     */
    public function createTournament(User $creator, array $data): ChessTournament
    {
        $maxPlayers = isset($data['max_players']) && is_numeric($data['max_players'])
            ? max(2, min(32, (int) $data['max_players']))
            : 8;

        $timeControl = isset($data['time_control']) && is_numeric($data['time_control']) && $data['time_control'] > 0
            ? (int) $data['time_control']
            : 5;

        $tournament = ChessTournament::create([
            'title' => $data['title'] ?? ($creator->name . "'s Chess Championship"),
            'description' => $data['description'] ?? null,
            'creator_id' => $creator->id,
            'max_players' => $maxPlayers,
            'time_control' => $timeControl,
            'type' => $data['type'] ?? 'ranked',
            'enable_third_place_match' => filter_var($data['enable_third_place_match'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'elimination_mode' => in_array($data['elimination_mode'] ?? 'single', ['single', 'double']) ? $data['elimination_mode'] : 'single',
            'scheduled_at' => !empty($data['start_time']) ? Carbon::parse($data['start_time']) : null,
            'status' => 'registration',
            'current_round' => 1,
            'total_rounds' => (int) max(1, ceil(log($maxPlayers, 2))),
        ]);

        // Creator automatically joins as first participant
        $this->joinTournament($tournament, $creator);

        $tournament->load(['creator', 'winner', 'participants.user', 'matches']);

        $this->broadcastTournamentEvent($tournament->id, 'tournament_created', ['tournament' => $tournament]);

        // Notify all registered club members about new tournament
        try {
            \App\Services\NotificationService::notifyAllMembers(
                'chess_tournament',
                '🏆 New Chess Tournament Open!',
                "{$creator->name} created '{$tournament->title}'. Register now to compete!",
                ['tournament_id' => $tournament->id],
                'Trophy',
                '/app/chess'
            );
        } catch (\Throwable $e) {
            Log::error("[ChessTournamentService] Failed to send global member notifications: " . $e->getMessage());
        }

        return $tournament;
    }

    /**
     * Join tournament registration.
     */
    public function joinTournament(ChessTournament $tournament, User $user): ChessTournament
    {
        if ($tournament->status !== 'registration') {
            throw new \Exception('Tournament registration is closed.');
        }

        $existing = ChessTournamentParticipant::where('tournament_id', $tournament->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return $tournament->load(['creator', 'winner', 'participants.user', 'matches']);
        }

        if ($tournament->participants()->count() >= $tournament->max_players) {
            throw new \Exception('Tournament is already full.');
        }

        ChessTournamentParticipant::create([
            'tournament_id' => $tournament->id,
            'user_id' => $user->id,
            'status' => 'active',
            'joined_at' => Carbon::now(),
        ]);

        $tournament->load(['creator', 'winner', 'participants.user', 'matches']);

        $this->broadcastTournamentEvent($tournament->id, 'tournament_updated', ['tournament' => $tournament]);

        return $tournament;
    }

    /**
     * Leave tournament registration.
     */
    public function leaveTournament(ChessTournament $tournament, User $user): ChessTournament
    {
        if ($tournament->status !== 'registration') {
            throw new \Exception('Cannot leave tournament after it has started.');
        }

        ChessTournamentParticipant::where('tournament_id', $tournament->id)
            ->where('user_id', $user->id)
            ->delete();

        $tournament->load(['creator', 'winner', 'participants.user', 'matches']);

        $this->broadcastTournamentEvent($tournament->id, 'tournament_updated', ['tournament' => $tournament]);

        return $tournament;
    }

    /**
     * Start the tournament & generate bracket tree up to championship.
     */
    public function startTournament(ChessTournament $tournament, User $user): ChessTournament
    {
        if ($tournament->creator_id !== $user->id && $user->role !== 'admin' && $user->role !== 'superadmin') {
            throw new \Exception('Only the tournament creator or an admin can start this tournament.');
        }

        if ($tournament->status !== 'registration') {
            throw new \Exception('Tournament has already started or completed.');
        }

        $participants = $tournament->participants()->with('user')->get();
        $playerCount = $participants->count();

        if ($playerCount < 2) {
            throw new \Exception('At least 2 players are required to start a tournament.');
        }

        // Determine dynamic bracket structure size (nearest power of 2 >= playerCount)
        $targetBracketSize = (int) pow(2, max(1, (int) ceil(log($playerCount, 2))));
        $totalRounds = (int) log($targetBracketSize, 2);
        $numMatchesRound1 = (int) ($targetBracketSize / 2);

        // Randomize seed pairings for tournament
        $shuffledParticipants = $participants->shuffle();
        $shuffledUserIds = [];
        $seedIndex = 1;

        foreach ($shuffledParticipants as $p) {
            $p->seed = $seedIndex;
            $p->save();
            $shuffledUserIds[] = $p->user_id;
            $seedIndex++;
        }

        // Calculate 2-player matches vs 1-player BYE matches in Round 1
        $numRealMatches = $playerCount - $numMatchesRound1;
        $numByeMatches = $targetBracketSize - $playerCount;

        $round1Pairs = [];
        $playerIndex = 0;

        // Create 2-player real matches
        for ($i = 0; $i < $numRealMatches; $i++) {
            $wId = $shuffledUserIds[$playerIndex++];
            $bId = $shuffledUserIds[$playerIndex++];
            $round1Pairs[] = ['white' => $wId, 'black' => $bId];
        }

        // Create 1-player BYE matches
        for ($i = 0; $i < $numByeMatches; $i++) {
            $wId = $shuffledUserIds[$playerIndex++];
            $round1Pairs[] = ['white' => $wId, 'black' => null];
        }

        // Shuffle pairs so BYEs and real matches are evenly distributed across bracket
        shuffle($round1Pairs);

        // Generate full bracket structure (Round 1 through Championship)
        for ($r = 1; $r <= $totalRounds; $r++) {
            $matchesInRound = (int) ($targetBracketSize / pow(2, $r));
            for ($m = 1; $m <= $matchesInRound; $m++) {
                if ($r === 1) {
                    $pair = $round1Pairs[$m - 1];
                    $whiteId = $pair['white'];
                    $blackId = $pair['black'];

                    if ($whiteId !== null && $blackId === null) {
                        // White gets BYE advancement
                        ChessTournamentMatch::create([
                            'tournament_id' => $tournament->id,
                            'round_number' => 1,
                            'match_number' => $m,
                            'white_user_id' => $whiteId,
                            'black_user_id' => null,
                            'winner_user_id' => $whiteId,
                            'status' => 'bye',
                            'win_reason' => 'bye',
                        ]);
                    } else {
                        // Real match between 2 players
                        $game = $this->createMatchGame($tournament, $whiteId, $blackId);

                        ChessTournamentMatch::create([
                            'tournament_id' => $tournament->id,
                            'round_number' => 1,
                            'match_number' => $m,
                            'white_user_id' => $whiteId,
                            'black_user_id' => $blackId,
                            'chess_game_id' => $game->id,
                            'status' => 'in_progress',
                        ]);
                    }
                } else {
                    // Future round matches (placeholder slots)
                    ChessTournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round_number' => $r,
                        'match_number' => $m,
                        'is_third_place' => false,
                        'white_user_id' => null,
                        'black_user_id' => null,
                        'chess_game_id' => null,
                        'status' => 'pending',
                    ]);

                    // If this is the Final Round and enable_third_place_match is enabled, create 3rd place match placeholder
                    if ($r === $totalRounds && $tournament->enable_third_place_match && $totalRounds >= 2 && $m === 1) {
                        ChessTournamentMatch::create([
                            'tournament_id' => $tournament->id,
                            'round_number' => $r,
                            'match_number' => 2,
                            'is_third_place' => true,
                            'white_user_id' => null,
                            'black_user_id' => null,
                            'chess_game_id' => null,
                            'status' => 'pending',
                        ]);
                    }
                }
            }
        }

        $tournament->status = 'in_progress';
        $tournament->current_round = 1;
        $tournament->total_rounds = $totalRounds;
        $tournament->started_at = Carbon::now();
        $tournament->save();

        // Check if Round 1 is already all BYEs or completed
        $this->checkAndAdvanceRound($tournament);

        $tournament->load([
            'creator',
            'winner',
            'participants.user',
            'matches.whiteUser',
            'matches.blackUser',
            'matches.winnerUser',
            'matches.chessGame',
        ]);

        $this->broadcastTournamentEvent($tournament->id, 'tournament_started', ['tournament' => $tournament]);

        return $tournament;
    }

    /**
     * Create an actual ChessGame for a tournament match.
     */
    protected function createMatchGame(ChessTournament $tournament, int $whiteId, int $blackId): ChessGame
    {
        $whiteUser = User::find($whiteId);

        $game = $this->chessService->createGame($whiteUser, [
            'type' => $tournament->type,
            'time_control' => $tournament->time_control,
            'allow_spectators' => true,
            'color_preference' => 'white',
        ]);

        $game->black_player_id = $blackId;
        $game->status = 'in_progress';
        $game->started_at = Carbon::now();
        $game->save();

        return $game;
    }

    /**
     * Handle game completion hook for tournament matches.
     */
    public function handleMatchFinished(ChessGame $game): void
    {
        $match = ChessTournamentMatch::where('chess_game_id', $game->id)->first();
        if (!$match) {
            return;
        }

        $match->status = 'completed';
        $match->winner_user_id = $game->winner_id;
        $match->win_reason = $game->win_reason;
        $match->save();

        // Eliminate loser
        $loserId = null;
        if ($game->winner_id) {
            $loserId = $game->white_player_id === $game->winner_id ? $game->black_player_id : $game->white_player_id;
            if ($loserId) {
                ChessTournamentParticipant::where('tournament_id', $match->tournament_id)
                    ->where('user_id', $loserId)
                    ->update(['status' => 'eliminated']);
            }
        }

        $tournament = ChessTournament::find($match->tournament_id);
        if ($tournament) {
            $this->checkAndAdvanceRound($tournament);
        }
    }

    /**
     * Check current round matches and advance to next round if ready.
     */
    public function checkAndAdvanceRound(ChessTournament $tournament): void
    {
        $currentRound = $tournament->current_round;

        $currentRoundMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('round_number', $currentRound)
            ->get();

        $allDone = $currentRoundMatches->every(function ($m) {
            return in_array($m->status, ['completed', 'bye']);
        });

        if (!$allDone) {
            return;
        }

        // If current round was the Championship final:
        if ($currentRound >= $tournament->total_rounds) {
            $finalMatch = $currentRoundMatches->first();
            $champId = $finalMatch ? $finalMatch->winner_user_id : null;

            $tournament->status = 'completed';
            $tournament->winner_id = $champId;
            $tournament->completed_at = Carbon::now();
            $tournament->save();

            if ($champId) {
                ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->where('user_id', $champId)
                    ->update(['status' => 'champion']);

                // Champion Reward: +15 Reputation Points & +30 ELO Bonus
                $stat = $this->chessService->getOrCreatePlayerStat($champId);
                $stat->chess_reputation_points += 15;
                $stat->elo_rating += 30;
                if ($stat->elo_rating > $stat->peak_elo) {
                    $stat->peak_elo = $stat->elo_rating;
                }
                $stat->save();
            }

            $this->broadcastTournamentEvent($tournament->id, 'tournament_completed', ['tournament' => $tournament]);
            return;
        }

        // Advance to Next Round
        $nextRound = $currentRound + 1;
        $nextRoundMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('round_number', $nextRound)
            ->orderBy('match_number', 'asc')
            ->get();

        for ($i = 0; $i < $currentRoundMatches->count(); $i += 2) {
            $m1 = $currentRoundMatches->get($i);
            $m2 = $currentRoundMatches->get($i + 1);

            $w1 = $m1 ? $m1->winner_user_id : null;
            $w2 = $m2 ? $m2->winner_user_id : null;

            $targetNextMatchIndex = (int) ($i / 2);
            $nextMatch = $nextRoundMatches->get($targetNextMatchIndex);

            if ($nextMatch) {
                $nextMatch->white_user_id = $w1;
                $nextMatch->black_user_id = $w2;

                if ($w1 && $w2) {
                    $game = $this->createMatchGame($tournament, $w1, $w2);
                    $nextMatch->chess_game_id = $game->id;
                    $nextMatch->status = 'in_progress';
                } else if ($w1 && !$w2) {
                    $nextMatch->winner_user_id = $w1;
                    $nextMatch->status = 'bye';
                    $nextMatch->win_reason = 'bye';
                } else if (!$w1 && $w2) {
                    $nextMatch->winner_user_id = $w2;
                    $nextMatch->status = 'bye';
                    $nextMatch->win_reason = 'bye';
                }
                $nextMatch->save();
            }
        }

        // If 3rd place match is enabled, pair the Semi-Final losers!
        if ($tournament->enable_third_place_match && $currentRound === ($tournament->total_rounds - 1)) {
            $thirdPlaceMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('round_number', $nextRound)
                ->where('is_third_place', true)
                ->first();

            if ($thirdPlaceMatch) {
                $l1 = null;
                $l2 = null;

                $m1 = $currentRoundMatches->get(0);
                $m2 = $currentRoundMatches->get(1);

                if ($m1 && $m1->winner_user_id) {
                    $l1 = $m1->winner_user_id === $m1->white_user_id ? $m1->black_user_id : $m1->white_user_id;
                }
                if ($m2 && $m2->winner_user_id) {
                    $l2 = $m2->winner_user_id === $m2->white_user_id ? $m2->black_user_id : $m2->white_user_id;
                }

                $thirdPlaceMatch->white_user_id = $l1;
                $thirdPlaceMatch->black_user_id = $l2;

                if ($l1 && $l2) {
                    $game = $this->createMatchGame($tournament, $l1, $l2);
                    $thirdPlaceMatch->chess_game_id = $game->id;
                    $thirdPlaceMatch->status = 'in_progress';
                } else if ($l1 && !$l2) {
                    $thirdPlaceMatch->winner_user_id = $l1;
                    $thirdPlaceMatch->status = 'bye';
                } else if (!$l1 && $l2) {
                    $thirdPlaceMatch->winner_user_id = $l2;
                    $thirdPlaceMatch->status = 'bye';
                }
                $thirdPlaceMatch->save();
            }
        }

        $tournament->current_round = $nextRound;
        $tournament->save();

        $this->broadcastTournamentEvent($tournament->id, 'tournament_updated', ['tournament' => $tournament]);

        // Recursively check if the next round was instantly resolved by BYEs
        $this->checkAndAdvanceRound($tournament);
    }

    /**
     * Broadcast WebSocket events for tournament updates.
     */
    protected function broadcastTournamentEvent(int $tournamentId, string $event, array $data): void
    {
        try {
            $realtimeUrl = env('REALTIME_WS_URL', 'http://127.0.0.1:3001');
            $secret = env('REALTIME_WS_SECRET', 'cyberlogic_secret_token_123');

            Http::timeout(3)->post("{$realtimeUrl}/internal/broadcast", [
                'secret' => $secret,
                'channel' => "chess_tournament_{$tournamentId}",
                'event' => $event,
                'data' => $data,
            ]);

            // Also notify lobby about tournament activity
            Http::timeout(3)->post("{$realtimeUrl}/internal/broadcast", [
                'secret' => $secret,
                'channel' => 'chess_lobby',
                'event' => 'chess_tournament_updated',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error("[ChessTournamentService] Realtime broadcast error: " . $e->getMessage());
        }
    }
}
