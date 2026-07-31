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
     * Start the tournament using the Universal Seeded Power-of-Two DAG Tree Engine.
     * Pre-generates all match nodes for any player count P (e.g. 5, 9, 15, 17, 31).
     * Auto-assigns BYEs and recursively evaluates DAG node advancements.
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

        // Calculate power-of-two bracket size N (4, 8, 16, 32...)
        $totalRounds = (int) max(1, ceil(log($playerCount, 2)));
        $targetBracketSize = (int) pow(2, $totalRounds);

        // Randomize seed pairings
        $shuffledParticipants = $participants->shuffle();
        $seededUserIds = [];
        $seedIndex = 1;

        foreach ($shuffledParticipants as $p) {
            $p->seed = $seedIndex;
            $p->save();
            $seededUserIds[$seedIndex] = $p->user_id;
            $seedIndex++;
        }

        // ═══════════════════════════════════════════════════════════
        // 1. PRE-CREATE ALL DAG MATCH NODES IN DATABASE
        // ═══════════════════════════════════════════════════════════

        // A) Winners Bracket Matches (Rounds 1..totalRounds)
        for ($r = 1; $r <= $totalRounds; $r++) {
            $numMatches = (int) ($targetBracketSize / pow(2, $r));
            for ($m = 1; $m <= $numMatches; $m++) {
                ChessTournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'round_number' => $r,
                    'match_number' => $m,
                    'bracket_type' => 'winners',
                    'status' => 'pending',
                ]);
            }
        }

        if ($tournament->elimination_mode === 'double') {
            // B) Losers Bracket Matches (Rounds 1..2*(totalRounds-1))
            $totalLosersRounds = max(1, 2 * ($totalRounds - 1));
            for ($lr = 1; $lr <= $totalLosersRounds; $lr++) {
                $k = (int) floor(($lr + 1) / 2);
                $numMatches = (int) max(1, $targetBracketSize / pow(2, $k + 1));
                for ($m = 1; $m <= $numMatches; $m++) {
                    ChessTournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round_number' => $lr,
                        'match_number' => $m,
                        'bracket_type' => 'losers',
                        'status' => 'pending',
                    ]);
                }
            }

            // C) Grand Final Match
            ChessTournamentMatch::create([
                'tournament_id' => $tournament->id,
                'round_number' => $totalRounds + 1,
                'match_number' => 1,
                'bracket_type' => 'grand_final',
                'status' => 'pending',
            ]);
        }

        // ═══════════════════════════════════════════════════════════
        // 2. ASSIGN SEEDED PLAYERS & BYES TO WINNERS ROUND 1
        // ═══════════════════════════════════════════════════════════
        $r1MatchCount = (int) ($targetBracketSize / 2);
        $realMatchesCount = $playerCount - $r1MatchCount;
        $byesCount = $targetBracketSize - $playerCount;

        // Determine which R1 slots get real matches vs BYE matches
        $slotTypes = [];
        $realRem = $realMatchesCount;
        $byeRem = $byesCount;

        for ($s = 0; $s < $r1MatchCount; $s++) {
            if ($byeRem > 0 && ($s % 2 === 0 || $realRem === 0)) {
                $slotTypes[$s] = 'bye';
                $byeRem--;
            } else if ($realRem > 0) {
                $slotTypes[$s] = 'real';
                $realRem--;
            } else {
                $slotTypes[$s] = 'bye';
                $byeRem--;
            }
        }

        $playerIndex = 1;
        for ($s = 0; $s < $r1MatchCount; $s++) {
            $mNumber = $s + 1;
            $r1Match = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('bracket_type', 'winners')
                ->where('round_number', 1)
                ->where('match_number', $mNumber)
                ->first();

            if (!$r1Match) continue;

            if ($slotTypes[$s] === 'real') {
                $uA = $seededUserIds[$playerIndex++] ?? null;
                $uB = $seededUserIds[$playerIndex++] ?? null;
                $r1Match->white_user_id = $uA;
                $r1Match->black_user_id = $uB;
                $r1Match->save();
            } else {
                $uA = $seededUserIds[$playerIndex++] ?? null;
                $r1Match->white_user_id = $uA;
                $r1Match->black_user_id = null;
                $r1Match->save();
            }
        }

        $tournament->status = 'in_progress';
        $tournament->current_round = 1;
        $tournament->total_rounds = $totalRounds;
        $tournament->max_players = $playerCount;
        $tournament->started_at = Carbon::now();
        $tournament->save();

        // ═══════════════════════════════════════════════════════════
        // 3. RUN DAG ENGINE TO AUTO-ADVANCE BYES & START READY MATCHES
        // ═══════════════════════════════════════════════════════════
        $this->evaluateDagGraph($tournament);

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

        // Route Winner and Loser down the DAG graph
        $this->routeWinnerAndLoser($tournament, $match, $game->winner_id, $loserId);

        // Run DAG evaluation engine to start newly ready matches & propagate BYEs
        $this->evaluateDagGraph($tournament);

        // Always broadcast real-time tournament update
        $this->broadcastTournamentEvent($tournament->id, 'tournament_updated', ['tournament' => $tournament->fresh()]);
    }

    /**
     * Universal DAG Routing Logic:
     * Directs match winner and loser to their designated next DAG nodes.
     */
    protected function routeWinnerAndLoser(ChessTournament $tournament, ChessTournamentMatch $match, ?int $winnerId, ?int $loserId): void
    {
        $totalRounds = $tournament->total_rounds;
        $targetBracketSize = (int) pow(2, $totalRounds);
        $isDouble = $tournament->elimination_mode === 'double';

        if ($match->bracket_type === 'winners') {
            $r = $match->round_number;
            $m = $match->match_number;

            // Route Winner
            if ($r < $totalRounds) {
                $nextMatchNum = (int) ceil($m / 2);
                $isWhite = ($m % 2 === 1);
                $nextMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
                    ->where('bracket_type', 'winners')
                    ->where('round_number', $r + 1)
                    ->where('match_number', $nextMatchNum)
                    ->first();

                if ($nextMatch && $winnerId) {
                    if ($isWhite) $nextMatch->white_user_id = $winnerId;
                    else $nextMatch->black_user_id = $winnerId;
                    $nextMatch->save();
                }
            } else if ($r === $totalRounds && $isDouble) {
                // Winners Final winner -> Grand Final (White slot)
                $gf = ChessTournamentMatch::where('tournament_id', $tournament->id)
                    ->where('bracket_type', 'grand_final')
                    ->first();
                if ($gf && $winnerId) {
                    $gf->white_user_id = $winnerId;
                    $gf->save();
                }
            }

            // Route Loser (Double Elimination)
            if ($isDouble && $loserId) {
                if ($r === 1) {
                    // W-R1 loser -> L-R1 match (ceil(m/2), slot white if m odd, black if m even)
                    $nextLMatchNum = (int) ceil($m / 2);
                    $isWhite = ($m % 2 === 1);
                    $lMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
                        ->where('bracket_type', 'losers')
                        ->where('round_number', 1)
                        ->where('match_number', $nextLMatchNum)
                        ->first();
                    if ($lMatch) {
                        if ($isWhite) $lMatch->white_user_id = $loserId;
                        else $lMatch->black_user_id = $loserId;
                        $lMatch->save();
                    }
                } else {
                    // W-R(r) loser (r>=2) -> L-R(2*(r-1)) drop-in round, match m, black slot
                    $targetLRound = 2 * ($r - 1);
                    $lMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
                        ->where('bracket_type', 'losers')
                        ->where('round_number', $targetLRound)
                        ->where('match_number', $m)
                        ->first();
                    if ($lMatch) {
                        $lMatch->black_user_id = $loserId;
                        $lMatch->save();
                    }
                }
            } else if (!$isDouble && $loserId) {
                // Single elimination loser eliminated
                ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->where('user_id', $loserId)
                    ->update(['status' => 'eliminated']);
            }
        } else if ($match->bracket_type === 'losers') {
            $lr = $match->round_number;
            $m = $match->match_number;
            $totalLosersRounds = max(1, 2 * ($totalRounds - 1));

            // Loser in Losers Bracket is eliminated
            if ($loserId) {
                ChessTournamentParticipant::where('tournament_id', $tournament->id)
                    ->where('user_id', $loserId)
                    ->update(['status' => 'eliminated']);
            }

            // Route Winner
            if ($winnerId) {
                if ($lr % 2 === 1) {
                    // Odd reduction round -> Even drop-in round (same match number, white slot)
                    $nextLMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
                        ->where('bracket_type', 'losers')
                        ->where('round_number', $lr + 1)
                        ->where('match_number', $m)
                        ->first();
                    if ($nextLMatch) {
                        $nextLMatch->white_user_id = $winnerId;
                        $nextLMatch->save();
                    }
                } else {
                    // Even drop-in round
                    if ($lr < $totalLosersRounds) {
                        $nextLMatchNum = (int) ceil($m / 2);
                        $isWhite = ($m % 2 === 1);
                        $nextLMatch = ChessTournamentMatch::where('tournament_id', $tournament->id)
                            ->where('bracket_type', 'losers')
                            ->where('round_number', $lr + 1)
                            ->where('match_number', $nextLMatchNum)
                            ->first();
                        if ($nextLMatch) {
                            if ($isWhite) $nextLMatch->white_user_id = $winnerId;
                            else $nextLMatch->black_user_id = $winnerId;
                            $nextLMatch->save();
                        }
                    } else {
                        // Losers Final winner -> Grand Final Match #1 (Black slot)
                        $gf = ChessTournamentMatch::where('tournament_id', $tournament->id)
                            ->where('bracket_type', 'grand_final')
                            ->where('match_number', 1)
                            ->first();
                        if ($gf) {
                            $gf->black_user_id = $winnerId;
                            $gf->save();
                        }
                    }
                }
            }
        } else if ($match->bracket_type === 'grand_final') {
            // Grand Final Match routing:
            // Match #1: WB Champ (0 losses) vs LB Champ (1 loss)
            // If WB Champ wins -> Tournament completes!
            // If LB Champ wins -> BRACKET RESET! Activates Match #2 between both players.
            if ($match->match_number === 1) {
                if ($winnerId === $match->white_user_id) {
                    // WB Champ wins Match 1 -> LB Champ receives 2nd loss (eliminated)
                    if ($loserId) {
                        ChessTournamentParticipant::where('tournament_id', $tournament->id)
                            ->where('user_id', $loserId)
                            ->update(['status' => 'eliminated']);
                    }
                } else if ($winnerId === $match->black_user_id) {
                    // LB Champ wins Match 1 -> BRACKET RESET REQUIRED!
                    $gf2 = ChessTournamentMatch::where('tournament_id', $tournament->id)
                        ->where('bracket_type', 'grand_final')
                        ->where('match_number', 2)
                        ->first();

                    if (!$gf2) {
                        ChessTournamentMatch::create([
                            'tournament_id' => $tournament->id,
                            'round_number' => $totalRounds + 1,
                            'match_number' => 2,
                            'bracket_type' => 'grand_final',
                            'white_user_id' => $match->white_user_id, // WB Champ
                            'black_user_id' => $match->black_user_id, // LB Champ
                            'status' => 'pending',
                        ]);
                    }
                }
            } else if ($match->match_number === 2) {
                // Reset Match #2 completed -> Loser eliminated
                if ($loserId) {
                    ChessTournamentParticipant::where('tournament_id', $tournament->id)
                        ->where('user_id', $loserId)
                        ->update(['status' => 'eliminated']);
                }
            }
        }
    }

    /**
     * Universal Recursive DAG Graph Evaluation Engine.
     * Evaluates all match nodes:
     * - If 2 players are present and pending -> Starts live game.
     * - If 1 player is present and missing opponent slot is permanent BYE -> Auto-advances BYE.
     * - Checks tournament completion.
     */
    public function evaluateDagGraph(ChessTournament $tournament): void
    {
        $maxPasses = 30; // Safety cap against infinite loops

        for ($pass = 0; $pass < $maxPasses; $pass++) {
            $hasChanges = false;
            $allMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)->get();

            foreach ($allMatches as $m) {
                if ($m->status !== 'pending') {
                    continue;
                }

                $wId = $m->white_user_id;
                $bId = $m->black_user_id;

                if ($wId && $bId) {
                    // Both players present -> Start live match game!
                    $game = $this->createMatchGame($tournament, $wId, $bId);
                    $m->chess_game_id = $game->id;
                    $m->status = 'in_progress';
                    $m->save();
                    $this->notifyMatchPlayers($m, $game);
                    $hasChanges = true;
                } else if ($wId || $bId) {
                    // Only 1 player present. Check if missing slot is a permanent BYE slot.
                    $presentUser = $wId ?: $bId;
                    $missingSlot = $wId ? 'black' : 'white';

                    if ($this->isSlotPermanentlyEmpty($tournament, $m, $missingSlot)) {
                        $m->status = 'bye';
                        $m->winner_user_id = $presentUser;
                        $m->win_reason = 'bye';
                        $m->save();

                        // Route single player to next DAG node
                        $this->routeWinnerAndLoser($tournament, $m, $presentUser, null);
                        $hasChanges = true;
                    }
                } else {
                    // 0 players present. Check if both incoming feeder slots are permanently empty.
                    if ($this->isSlotPermanentlyEmpty($tournament, $m, 'white') && $this->isSlotPermanentlyEmpty($tournament, $m, 'black')) {
                        $m->status = 'bye';
                        $m->winner_user_id = null;
                        $m->win_reason = 'bye';
                        $m->save();
                        $hasChanges = true;
                    }
                }
            }

            if (!$hasChanges) {
                break;
            }
        }

        // Check if current round or tournament as a whole has completed
        $this->checkTournamentCompletion($tournament);
    }

    /**
     * Check if a specific slot ('white' or 'black') in a match node will never receive a player (permanent BYE).
     */
    protected function isSlotPermanentlyEmpty(ChessTournament $tournament, ChessTournamentMatch $match, string $slot): bool
    {
        $r = $match->round_number;
        $m = $match->match_number;
        $type = $match->bracket_type;

        if ($type === 'winners') {
            if ($r === 1) {
                // R1 slot is empty if no seeded participant was assigned to that slot
                $uId = ($slot === 'white') ? $match->white_user_id : $match->black_user_id;
                return ($uId === null);
            }
            // R2+: check feeder matches in round (r-1)
            $feederMatchNum = ($slot === 'white') ? ($m * 2 - 1) : ($m * 2);
            $feeder = ChessTournamentMatch::where('tournament_id', $tournament->id)
                ->where('bracket_type', 'winners')
                ->where('round_number', $r - 1)
                ->where('match_number', $feederMatchNum)
                ->first();

            if (!$feeder) return true;
            return (in_array($feeder->status, ['completed', 'bye']) && !$feeder->winner_user_id);
        } else if ($type === 'losers') {
            if ($r === 1) {
                // L-R1 slot is fed by W-R1 losers
                $feederMatchNum = ($slot === 'white') ? ($m * 2 - 1) : ($m * 2);
                $feeder = ChessTournamentMatch::where('tournament_id', $tournament->id)
                    ->where('bracket_type', 'winners')
                    ->where('round_number', 1)
                    ->where('match_number', $feederMatchNum)
                    ->first();

                if (!$feeder) return true;
                if ($feeder->status === 'bye') return true; // BYE match in W-R1 produces NO loser
                if ($feeder->status === 'completed') {
                    $loser = $feeder->white_user_id === $feeder->winner_user_id ? $feeder->black_user_id : $feeder->white_user_id;
                    return ($loser === null);
                }
                return false;
            } else if ($r % 2 === 1) {
                // Odd reduction round (L-R3, L-R5...): fed by L-R(r-1)
                $feeder = ChessTournamentMatch::where('tournament_id', $tournament->id)
                    ->where('bracket_type', 'losers')
                    ->where('round_number', $r - 1)
                    ->where('match_number', $m)
                    ->first();

                if (!$feeder) return true;
                return (in_array($feeder->status, ['completed', 'bye']) && !$feeder->winner_user_id);
            } else {
                // Even drop-in round (L-R2, L-R4...):
                // 'white' slot is fed by L-R(r-1) match m
                // 'black' slot is fed by W-R(r/2 + 1) match m
                if ($slot === 'white') {
                    $feeder = ChessTournamentMatch::where('tournament_id', $tournament->id)
                        ->where('bracket_type', 'losers')
                        ->where('round_number', $r - 1)
                        ->where('match_number', $m)
                        ->first();
                    if (!$feeder) return true;
                    return (in_array($feeder->status, ['completed', 'bye']) && !$feeder->winner_user_id);
                } else {
                    $targetWRound = (int) ($r / 2) + 1;
                    $feeder = ChessTournamentMatch::where('tournament_id', $tournament->id)
                        ->where('bracket_type', 'winners')
                        ->where('round_number', $targetWRound)
                        ->where('match_number', $m)
                        ->first();
                    if (!$feeder) return true;
                    if ($feeder->status === 'bye') return true;
                    if ($feeder->status === 'completed') {
                        $loser = $feeder->white_user_id === $feeder->winner_user_id ? $feeder->black_user_id : $feeder->white_user_id;
                        return ($loser === null);
                    }
                    return false;
                }
            }
        }

        return false;
    }

    /**
     * Alias for DAG evaluation.
     */
    public function checkAndAdvanceRound(ChessTournament $tournament): void
    {
        $this->evaluateDagGraph($tournament);
    }

    /**
     * Check if the tournament as a whole is completed.
     */
    protected function checkTournamentCompletion(ChessTournament $tournament): void
    {
        $allMatches = ChessTournamentMatch::where('tournament_id', $tournament->id)->get();

        if ($allMatches->isEmpty()) {
            return;
        }

        if ($tournament->elimination_mode === 'double') {
            $gf1 = $allMatches->where('bracket_type', 'grand_final')->where('match_number', 1)->first();

            if (!$gf1 || !in_array($gf1->status, ['completed', 'bye'])) {
                return;
            }

            if ($gf1->winner_user_id === $gf1->white_user_id) {
                // WB Champ won Match 1 -> Championship decided!
                $champId = $gf1->white_user_id;
            } else {
                // LB Champ won Match 1 -> Check if Reset Match 2 has finished!
                $gf2 = $allMatches->where('bracket_type', 'grand_final')->where('match_number', 2)->first();
                if (!$gf2 || !in_array($gf2->status, ['completed', 'bye'])) {
                    return; // Reset Match #2 still in progress or pending
                }
                $champId = $gf2->winner_user_id;
            }
        } else {
            $allDone = $allMatches->where('bracket_type', 'winners')->every(fn($m) => in_array($m->status, ['completed', 'bye']));
            if (!$allDone) {
                return;
            }

            $finalMatch = $allMatches
                ->where('bracket_type', 'winners')
                ->whereIn('status', ['completed', 'bye'])
                ->sortByDesc('round_number')
                ->first();
            $champId = $finalMatch ? $finalMatch->winner_user_id : null;
        }

        if ($tournament->status !== 'completed' && $champId) {
            $tournament->status = 'completed';
            $tournament->winner_id = $champId;
            $tournament->completed_at = Carbon::now();
            $tournament->save();

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

            $this->broadcastTournamentEvent($tournament->id, 'tournament_completed', ['tournament' => $tournament]);
        }
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
