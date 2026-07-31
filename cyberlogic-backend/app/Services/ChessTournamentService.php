<?php

namespace App\Services;

use App\Models\ChessGame;
use App\Models\ChessTournament;
use App\Models\ChessTournamentMatch;
use App\Models\ChessTournamentParticipant;
use App\Models\Notification;
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
     * Start the tournament & generate ONLY real Round 1 matches.
     * No BYE entries, no pre-generated future rounds.
     * Everything is created on-demand as matches complete.
     */
    public function startTournament(ChessTournament $tournament, User $user): ChessTournament
    {
        if ($tournament->creator_id !== $user->id && $user->role !== 'admin' && $user->role !== 'superadmin') {
            throw new \Exception('Only the tournament creator or an admin can start this tournament.');
        }

        if ($tournament->status !== 'registration' && !($tournament->status === 'in_progress' && $tournament->matches()->count() === 0)) {
            throw new \Exception('Tournament has already started or completed.');
        }

        // Clean up any stale matches
        $tournament->matches()->delete();

        $participants = $tournament->participants()->with('user')->get();
        $playerCount = $participants->count();

        if ($playerCount < 2) {
            throw new \Exception('At least 2 players are required to start a tournament.');
        }

        // Determine bracket structure
        $totalRounds = (int) max(1, ceil(log($playerCount, 2)));
        $targetBracketSize = (int) pow(2, $totalRounds);
        $numR1Slots = (int) ($targetBracketSize / 2);
        $numByes = $targetBracketSize - $playerCount;
        $numRealMatches = $numR1Slots - $numByes;

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

        // Create ONLY real Round 1 matches (no BYE entries, no future round placeholders)
        // First (numRealMatches * 2) players are paired into real matches.
        // Remaining players are bye-advanced — they have NO R1 match and will
        // be dynamically paired into Round 2 via checkAndAdvanceRound().
        $matchNumber = 1;
        for ($i = 0; $i < $numRealMatches; $i++) {
            $wId = $shuffledUserIds[$i * 2];
            $bId = $shuffledUserIds[$i * 2 + 1];

            $game = $this->createMatchGame($tournament, $wId, $bId);
            $match = ChessTournamentMatch::create([
                'tournament_id' => $tournament->id,
                'round_number' => 1,
                'match_number' => $matchNumber++,
                'bracket_type' => 'winners',
                'white_user_id' => $wId,
                'black_user_id' => $bId,
                'chess_game_id' => $game->id,
                'status' => 'in_progress',
            ]);

            $this->notifyMatchPlayers($match, $game);
        }
        // Players from index (numRealMatches * 2) onward are bye-advanced.
        // They are NOT assigned to any R1 match — they'll join R2 dynamically.

        $tournament->status = 'in_progress';
        $tournament->current_round = 1;
        $tournament->total_rounds = $totalRounds;
        $tournament->started_at = Carbon::now();
        $tournament->save();

        // If there are no real R1 matches (all bye — only possible with 1 player, blocked above),
        // or if all R1 matches are instantly done, advance.
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
     * Notify paired players that their match is ready to play.
     */
    protected function notifyMatchPlayers(ChessTournamentMatch $match, ChessGame $game): void
    {
        $tournament = $match->tournament;
        $title = "⚔️ Tournament Match Ready!";
        $body = "Match #{$match->match_number} in {$tournament->title} is now live! Click to enter.";
        $link = "/app/chess/game/{$game->game_code}";

        foreach ([$match->white_user_id, $match->black_user_id] as $userId) {
            if ($userId) {
                try {
                    Notification::create([
                        'user_id' => $userId,
                        'type' => 'chess_match_ready',
                        'title' => $title,
                        'body' => $body,
                        'icon' => 'swords',
                        'link' => $link,
                    ]);

                    $realtimeUrl = env('REALTIME_WS_URL', 'http://127.0.0.1:3001');
                    $secret = env('REALTIME_WS_SECRET', 'cyberlogic_secret_token_123');

                    Http::withHeaders(['X-Realtime-Secret' => $secret])->timeout(3)->post("{$realtimeUrl}/internal/broadcast", [
                        'channel' => "user_{$userId}",
                        'type' => 'notification',
                        'payload' => [
                            'title' => $title,
                            'body' => $body,
                            'link' => $link,
                        ],
                    ]);
                } catch (\Exception $e) {
                    Log::error("[ChessTournamentService] Match notification error: " . $e->getMessage());
                }
            }
        }
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

        // Determine loser ID
        $loserId = null;
        if ($game->winner_id) {
            $loserId = $game->white_player_id === $game->winner_id ? $game->black_player_id : $game->white_player_id;
        }

        $tournament = ChessTournament::find($match->tournament_id);
        if (!$tournament) {
            return;
        }

        if ($tournament->elimination_mode === 'double') {
            if ($match->bracket_type === 'winners' && $loserId) {
                // Player lost in Winners Bracket → drop them into the Losers Bracket queue
                $this->dropLoserIntoBracket($tournament, $loserId);
            } else if ($match->bracket_type === 'losers' && $loserId) {
                // Player lost in Losers Bracket → they are fully eliminated (lost twice)
                ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->where('user_id', $loserId)
                    ->update(['status' => 'eliminated']);
            } else if ($match->bracket_type === 'grand_final' && $loserId) {
                // Grand Final loser is runner-up
                ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->where('user_id', $loserId)
                    ->update(['status' => 'eliminated']);
            }
        } else {
            // Single Elimination: loser is out
            if ($loserId) {
                ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->where('user_id', $loserId)
                    ->update(['status' => 'eliminated']);
            }
        }

        $this->checkAndAdvanceRound($tournament);
    }

    /**
     * Drop a loser from Winners Bracket into the Losers Bracket.
     * Creates matches on-demand: pairs losers as they arrive.
     */
    protected function dropLoserIntoBracket(ChessTournament $tournament, int $loserId): void
    {
        // Find an existing unfilled losers bracket match (has 1 player, waiting for opponent)
        $unfilledMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'losers')
            ->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('white_user_id')
                  ->orWhereNull('black_user_id');
            })
            ->where(function ($q) {
                // Must have exactly one player slot filled (waiting for pairing)
                $q->where(function ($q2) {
                    $q2->whereNotNull('white_user_id')->whereNull('black_user_id');
                });
            })
            ->orderBy('round_number', 'asc')
            ->orderBy('match_number', 'asc')
            ->first();

        if ($unfilledMatch) {
            // Pair the loser as the second player
            $unfilledMatch->black_user_id = $loserId;
            $unfilledMatch->save();

            // Both players present → create the game and start it
            $lGame = $this->createMatchGame($tournament, $unfilledMatch->white_user_id, $unfilledMatch->black_user_id);
            $unfilledMatch->chess_game_id = $lGame->id;
            $unfilledMatch->status = 'in_progress';
            $unfilledMatch->save();
            $this->notifyMatchPlayers($unfilledMatch, $lGame);
        } else {
            // No unfilled match → create a new losers bracket match with this loser waiting
            $currentMaxRound = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('bracket_type', 'losers')
                ->max('round_number') ?? 0;

            // Determine which round to place this new match in
            // New drop-ins go to the lowest round that still has capacity or the next available round
            $targetRound = $currentMaxRound > 0 ? $currentMaxRound : 1;

            // Check if there are already completed matches in this round whose winners need advancing
            // If all existing matches in $targetRound are completed or in_progress, start a new round
            $existingPending = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('bracket_type', 'losers')
                ->where('round_number', $targetRound)
                ->whereIn('status', ['pending'])
                ->count();

            if ($existingPending === 0 && $currentMaxRound > 0) {
                $targetRound = $currentMaxRound + 1;
            }

            $nextMatchNumber = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('bracket_type', 'losers')
                ->where('round_number', $targetRound)
                ->max('match_number') ?? 0;

            ChessTournamentMatch::create([
                'tournament_id' => $tournament->id,
                'round_number' => $targetRound,
                'match_number' => $nextMatchNumber + 1,
                'bracket_type' => 'losers',
                'white_user_id' => $loserId,
                'black_user_id' => null,
                'chess_game_id' => null,
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Check current round matches and advance to next round if ready.
     * Winners bracket is FULLY ON-DEMAND: next-round matches are created
     * dynamically by collecting winners + bye-advanced players.
     */
    public function checkAndAdvanceRound(ChessTournament $tournament): void
    {
        $currentRound = $tournament->current_round;
        $hasChanges = false;

        // ═══════════════════════════════════════════════════════════
        // 1. WINNERS BRACKET ADVANCEMENT (fully on-demand)
        // ═══════════════════════════════════════════════════════════
        $winnersMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'winners')
            ->where('round_number', $currentRound)
            ->orderBy('match_number', 'asc')
            ->get();

        $winnersDone = $winnersMatches->isNotEmpty() && $winnersMatches->every(function ($m) {
            return in_array($m->status, ['completed', 'bye']);
        });

        if ($winnersDone && $winnersMatches->isNotEmpty()) {
            // Collect current round winners
            $roundWinners = $winnersMatches->map(fn($m) => $m->winner_user_id)->filter()->values();

            // Collect bye-advanced players (only for Round 1 → Round 2 transition)
            // These are active participants who are NOT in any winners bracket match.
            $byeAdvancedIds = collect();
            if ($currentRound === 1) {
                $allActiveIds = ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->whereIn('status', ['active', 'champion'])
                    ->pluck('user_id');

                $inWinnersMatchIds = ChessTournamentMatch::where('tournament_id', $tournament->id)
                    ->where('bracket_type', 'winners')
                    ->get()
                    ->flatMap(fn($m) => [$m->white_user_id, $m->black_user_id])
                    ->filter()
                    ->unique();

                $byeAdvancedIds = $allActiveIds->diff($inWinnersMatchIds)->values();
            }

            // Combine into next round player pool & shuffle for fair pairing
            $nextRoundPlayers = $roundWinners->merge($byeAdvancedIds)->shuffle()->values();

            // Check if next round already exists (prevent duplicate creation)
            $nextRound = $currentRound + 1;
            $existingNextRound = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('bracket_type', 'winners')
                ->where('round_number', $nextRound)
                ->count();

            if ($nextRoundPlayers->count() >= 2 && $existingNextRound === 0) {
                $matchNumber = 1;

                for ($i = 0; $i < $nextRoundPlayers->count(); $i += 2) {
                    $w1 = $nextRoundPlayers->get($i);
                    $w2 = $nextRoundPlayers->get($i + 1) ?? null;

                    if ($w1 && $w2) {
                        $game = $this->createMatchGame($tournament, $w1, $w2);
                        $newMatch = ChessTournamentMatch::create([
                            'tournament_id' => $tournament->id,
                            'round_number' => $nextRound,
                            'match_number' => $matchNumber++,
                            'bracket_type' => 'winners',
                            'white_user_id' => $w1,
                            'black_user_id' => $w2,
                            'chess_game_id' => $game->id,
                            'status' => 'in_progress',
                        ]);
                        $this->notifyMatchPlayers($newMatch, $game);
                    }
                    // Bracket math guarantees even counts, so no odd-player handling needed
                }

                $tournament->current_round = $nextRound;
                $tournament->save();

                $this->broadcastTournamentEvent($tournament->id, 'tournament_updated', ['tournament' => $tournament->fresh()]);
                return; // Next round created; don't check losers/grand final in same cycle
            }
            // If only 1 player remains → Winners Champion determined.
            // Fall through to losers bracket / grand final / completion checks.
        }

        // ═══════════════════════════════════════════════════════════
        // 2. LOSERS BRACKET ADVANCEMENT (Double Elimination, independent)
        // ═══════════════════════════════════════════════════════════
        if ($tournament->elimination_mode === 'double') {
            if ($this->advanceLosersRounds($tournament)) {
                $hasChanges = true;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 3. GRAND FINAL CHECK (Double Elimination)
        // ═══════════════════════════════════════════════════════════
        if ($tournament->elimination_mode === 'double') {
            if ($this->checkAndCreateGrandFinal($tournament)) {
                $hasChanges = true;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 4. TOURNAMENT COMPLETION CHECK
        // ═══════════════════════════════════════════════════════════
        $this->checkTournamentCompletion($tournament);

        if ($hasChanges) {
            $this->broadcastTournamentEvent($tournament->id, 'tournament_updated', ['tournament' => $tournament]);
        }
    }

    /**
     * Advance completed Losers Bracket by collecting all unplaced winners
     * and pairing them into the next round. A winner is "unplaced" if they
     * don't appear as a player in any subsequent losers bracket round or grand_final.
     */
    protected function advanceLosersRounds(ChessTournament $tournament): bool
    {
        $hasChanges = false;

        $allLosersMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'losers')
            ->orderBy('round_number', 'asc')
            ->orderBy('match_number', 'asc')
            ->get();

        if ($allLosersMatches->isEmpty()) {
            return false;
        }

        // Check if any losers match is still pending or in progress
        $hasUnfinished = $allLosersMatches->contains(function ($m) {
            return in_array($m->status, ['pending', 'in_progress']);
        });

        if ($hasUnfinished) {
            return false; // Wait until all current losers matches are done
        }

        // Also check if there are any pending unfilled drops from winners bracket
        // (matches with only 1 player still waiting for an opponent)
        $hasPendingDrops = $allLosersMatches->contains(function ($m) {
            return $m->status === 'pending' && $m->white_user_id && !$m->black_user_id;
        });

        if ($hasPendingDrops) {
            return false; // Still waiting for more losers to drop
        }

        // Collect all losers bracket winners
        $allWinnerIds = $allLosersMatches
            ->filter(fn($m) => in_array($m->status, ['completed', 'bye']) && $m->winner_user_id)
            ->pluck('winner_user_id')
            ->unique()
            ->values();

        // Collect all player IDs who appear as white or black in a losers match
        $allPlayerIds = collect();
        foreach ($allLosersMatches as $m) {
            if ($m->white_user_id) $allPlayerIds->push($m->white_user_id);
            if ($m->black_user_id) $allPlayerIds->push($m->black_user_id);
        }

        // Also check grand_final
        $grandFinalPlayers = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'grand_final')
            ->get()
            ->flatMap(fn($m) => collect([$m->white_user_id, $m->black_user_id]))
            ->filter();

        // An "unplaced" winner is someone who won a losers match but does NOT appear
        // as a player in any LATER losers match (i.e., they won but never got paired into next round)
        $unplacedWinners = collect();
        foreach ($allWinnerIds as $winnerId) {
            // Check: does this winner appear as white or black in a LATER round?
            $isPlacedLater = $allLosersMatches->contains(function ($m) use ($winnerId) {
                // Find the round where this player won
                $wonMatch = ChessTournamentMatch::where('tournament_id', $m->tournament_id)
                    ->where('bracket_type', 'losers')
                    ->where('winner_user_id', $winnerId)
                    ->orderBy('round_number', 'desc')
                    ->first();

                if (!$wonMatch) return false;

                // Is this match in a round AFTER the won match?
                return $m->round_number > $wonMatch->round_number
                    && ($m->white_user_id === $winnerId || $m->black_user_id === $winnerId);
            });

            // Also check if already placed in grand final
            $isInGrandFinal = $grandFinalPlayers->contains($winnerId);

            if (!$isPlacedLater && !$isInGrandFinal) {
                $unplacedWinners->push($winnerId);
            }
        }

        // If we have 2+ unplaced winners, pair them into the next losers round
        if ($unplacedWinners->count() >= 2) {
            $maxRound = $allLosersMatches->max('round_number');
            $nextRound = $maxRound + 1;

            $matchNumber = 1;
            for ($i = 0; $i < $unplacedWinners->count(); $i += 2) {
                $w1 = $unplacedWinners->get($i);
                $w2 = $unplacedWinners->get($i + 1) ?? null;

                if ($w1 && $w2) {
                    $game = $this->createMatchGame($tournament, $w1, $w2);
                    $newMatch = ChessTournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round_number' => $nextRound,
                        'match_number' => $matchNumber++,
                        'bracket_type' => 'losers',
                        'white_user_id' => $w1,
                        'black_user_id' => $w2,
                        'chess_game_id' => $game->id,
                        'status' => 'in_progress',
                    ]);
                    $this->notifyMatchPlayers($newMatch, $game);
                    $hasChanges = true;
                } else if ($w1) {
                    ChessTournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round_number' => $nextRound,
                        'match_number' => $matchNumber++,
                        'bracket_type' => 'losers',
                        'white_user_id' => $w1,
                        'black_user_id' => null,
                        'winner_user_id' => $w1,
                        'status' => 'bye',
                        'win_reason' => 'bye',
                    ]);
                    $hasChanges = true;
                }
            }
        }

        return $hasChanges;
    }

    /**
     * Check if Grand Final should be created (Winners Champion vs Losers Champion).
     */
    protected function checkAndCreateGrandFinal(ChessTournament $tournament): bool
    {
        // Grand Final already exists?
        $existingGrandFinal = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'grand_final')
            ->first();

        if ($existingGrandFinal) {
            return false; // Already created
        }

        // Find Winners Bracket Champion (winner of the last winners bracket round)
        $winnersChampionMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'winners')
            ->where('round_number', $tournament->total_rounds)
            ->where('match_number', 1)
            ->first();

        if (!$winnersChampionMatch || !in_array($winnersChampionMatch->status, ['completed', 'bye'])) {
            return false; // Winners bracket not finished yet
        }

        $winnersChampionId = $winnersChampionMatch->winner_user_id;
        if (!$winnersChampionId) {
            return false;
        }

        // Find Losers Bracket Champion (last remaining player in losers bracket)
        // This is the winner of the highest-numbered losers round that has exactly 1 match
        $losersChampionId = $this->findLosersChampion($tournament);
        if (!$losersChampionId) {
            return false; // Losers bracket not finished yet
        }

        // Both champions determined → Create Grand Final!
        $game = $this->createMatchGame($tournament, $winnersChampionId, $losersChampionId);

        $grandFinal = ChessTournamentMatch::create([
            'tournament_id' => $tournament->id,
            'round_number' => $tournament->total_rounds + 1,
            'match_number' => 1,
            'bracket_type' => 'grand_final',
            'white_user_id' => $winnersChampionId,
            'black_user_id' => $losersChampionId,
            'chess_game_id' => $game->id,
            'status' => 'in_progress',
        ]);

        $this->notifyMatchPlayers($grandFinal, $game);

        Log::info("[ChessTournament] Grand Final created for Tournament #{$tournament->id}: Winners Champion (ID:{$winnersChampionId}) vs Losers Champion (ID:{$losersChampionId})");
        return true;
    }

    /**
     * Find the Losers Bracket Champion. Returns user ID or null if not determined yet.
     */
    protected function findLosersChampion(ChessTournament $tournament): ?int
    {
        $allLosersMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'losers')
            ->get();

        if ($allLosersMatches->isEmpty()) {
            return null;
        }

        // Any unfinished losers matches?
        $hasUnfinished = $allLosersMatches->contains(fn($m) => in_array($m->status, ['pending', 'in_progress']));
        if ($hasUnfinished) {
            return null;
        }

        // Collect all losers bracket winners
        $allWinnerIds = $allLosersMatches
            ->filter(fn($m) => in_array($m->status, ['completed', 'bye']) && $m->winner_user_id)
            ->pluck('winner_user_id')
            ->unique()
            ->values();

        // Check grand final participants
        $grandFinalPlayers = ChessTournamentMatch::where('tournament_id', $tournament->id)
            ->where('bracket_type', 'grand_final')
            ->get()
            ->flatMap(fn($m) => collect([$m->white_user_id, $m->black_user_id]))
            ->filter();

        // Find "unplaced" winners: won a losers match but NOT in any later losers match or grand final
        $unplacedWinners = collect();
        foreach ($allWinnerIds as $winnerId) {
            $wonMatch = $allLosersMatches
                ->where('winner_user_id', $winnerId)
                ->sortByDesc('round_number')
                ->first();

            if (!$wonMatch) continue;

            $isPlacedLater = $allLosersMatches->contains(fn($m) =>
                $m->round_number > $wonMatch->round_number
                && ($m->white_user_id === $winnerId || $m->black_user_id === $winnerId)
            );

            $isInGrandFinal = $grandFinalPlayers->contains($winnerId);

            if (!$isPlacedLater && !$isInGrandFinal) {
                $unplacedWinners->push($winnerId);
            }
        }

        // Exactly 1 unplaced winner = Losers Champion
        if ($unplacedWinners->count() === 1) {
            return $unplacedWinners->first();
        }

        return null;
    }

    /**
     * Check if the tournament is fully completed.
     */
    protected function checkTournamentCompletion(ChessTournament $tournament): void
    {
        $allMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)->get();

        if ($allMatches->isEmpty()) {
            return;
        }

        // For Double Elimination, the Grand Final must exist and be completed
        if ($tournament->elimination_mode === 'double') {
            $grandFinal = $allMatches->where('bracket_type', 'grand_final')->first();

            if (!$grandFinal || $grandFinal->status !== 'completed') {
                return; // Grand Final not done yet
            }

            $champId = $grandFinal->winner_user_id;
        } else {
            // Single Elimination: all matches must be done
            $allDone = $allMatches->every(fn($m) => in_array($m->status, ['completed', 'bye']));
            if (!$allDone) {
                return;
            }

            // Find the winner dynamically: winner of the highest-round winners bracket match
            $finalMatch = $allMatches
                ->where('bracket_type', 'winners')
                ->whereIn('status', ['completed', 'bye'])
                ->sortByDesc('round_number')
                ->first();
            $champId = $finalMatch ? $finalMatch->winner_user_id : null;
        }

        $tournament->status = 'completed';
        $tournament->winner_id = $champId;
        $tournament->completed_at = Carbon::now();
        $tournament->save();

        if ($champId) {
            ChessTournamentParticipant::where('tournament_id', $tournament->id)
                ->where('user_id', $champId)
                ->update(['status' => 'champion']);

            $stat = $this->chessService->getOrCreatePlayerStat($champId);
            $stat->chess_reputation_points += 15;
            $stat->elo_rating += 30;
            if ($stat->elo_rating > $stat->peak_elo) {
                $stat->peak_elo = $stat->elo_rating;
            }
            $stat->save();
        }

        $this->broadcastTournamentEvent($tournament->id, 'tournament_completed', ['tournament' => $tournament]);
    }

    /**
     * Cancel tournament and clean up live games.
     */
    public function cancelTournament(ChessTournament $tournament): void
    {
        $matchGameIds = $tournament->matches()->whereNotNull('chess_game_id')->pluck('chess_game_id');
        if ($matchGameIds->isNotEmpty()) {
            ChessGame::whereIn('id', $matchGameIds)->where('status', 'in_progress')->update(['status' => 'cancelled']);
        }

        $this->broadcastTournamentEvent($tournament->id, 'tournament_cancelled', [
            'tournament_id' => $tournament->id,
            'message' => 'Tournament was cancelled by the host.',
        ]);

        $tournament->matches()->delete();
        $tournament->participants()->delete();
        $tournament->delete();
    }

    /**
     * Broadcast WebSocket events for tournament updates.
     */
    protected function broadcastTournamentEvent(int $tournamentId, string $event, array $data): void
    {
        try {
            $realtimeUrl = env('REALTIME_WS_URL', 'http://127.0.0.1:3001');
            $secret = env('REALTIME_WS_SECRET', 'cyberlogic_secret_token_123');

            $payload = array_merge([
                'event' => $event,
                'tournament_id' => $tournamentId,
            ], $data);

            // Broadcast to chess_tournament_{id} channel
            Http::withHeaders([
                'X-Realtime-Secret' => $secret,
            ])->timeout(3)->post("{$realtimeUrl}/internal/broadcast", [
                'channel' => "chess_tournament_{$tournamentId}",
                'type' => 'chess_tournament_updated',
                'payload' => $payload,
            ]);

            // Broadcast to chess_lobby channel
            Http::withHeaders([
                'X-Realtime-Secret' => $secret,
            ])->timeout(3)->post("{$realtimeUrl}/internal/broadcast", [
                'channel' => 'chess_lobby',
                'type' => 'chess_tournament_updated',
                'payload' => $payload,
            ]);
        } catch (\Exception $e) {
            Log::error("[ChessTournamentService] Realtime broadcast error: " . $e->getMessage());
        }
    }
}
