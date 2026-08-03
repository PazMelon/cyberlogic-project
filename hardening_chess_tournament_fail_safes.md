# Hardened Tournament Fail-Safes: Match Check-In Timer & Disconnect Pause System

Two new fail-safe systems to prevent tournament stalling and handle player disconnections gracefully, plus a critical bug fix for the DAG engine's double forfeit propagation in double elimination brackets.

## Feature Summary

### 1. Match Check-In Timer (10 Minutes)
When a tournament match is ready (both players assigned), players receive an **obvious visual indicator** in the bracket view. A **10-minute countdown** begins when the **first player enters** the game room. If the other player doesn't join before it expires, they are automatically **forfeited**.

### 2. Disconnect Pause System (3 Minutes, 3 Uses Max)
If a player **disconnects** during a tournament match, the opponent is prompted to **pause** the game (at their discretion). When paused:
- The chess clock freezes and a **3-minute reconnect timer** counts down
- If the timer expires, the chess clock resumes automatically
- Each player has a maximum of **3 pauses** per match
- The opponent **must approve** each pause request

---

## Critical Bug Fix: Double Forfeit DAG Propagation (Double Elimination)

> [!CAUTION]
> **Existing bug discovered during analysis**: The `isSlotPermanentlyEmpty()` method in [ChessTournamentService.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Services/ChessTournamentService.php#L571-L651) does **not correctly handle double forfeits** in double elimination tournaments. When both players in a winners bracket match are forfeited (match completes with `winner_user_id = null`), the **losers bracket stalls** because it thinks a loser is still coming.

### The Problem

When a winners bracket match double-forfeits:
- `winner_user_id = null`, but `white_user_id = 5` and `black_user_id = 8` (both were assigned)
- The losers bracket checks the feeder match to see if a loser will arrive
- Current code at **L605-607** calculates: `$loser = (5 === null) ? 8 : 5` → returns `5`
- Then checks `return (5 === null)` → `false` — it thinks player 5 **is the loser and is coming** ❌
- But player 5 was **forfeited**, not routed — the losers bracket slot **hangs forever**

Same bug exists at **L641-643** for even drop-in round black slot checks.

### The Fix

Add an early-return check **before** the loser calculation at **3 locations** in `isSlotPermanentlyEmpty()`:

```diff
 // In losers bracket feeder checks (L605, L631, L641):
 if ($feeder->status === 'completed') {
+    // Double forfeit: no winner means no loser was produced either
+    if (!$feeder->winner_user_id) {
+        return true;
+    }
     $loser = $feeder->white_user_id === $feeder->winner_user_id
         ? $feeder->black_user_id
         : $feeder->white_user_id;
     return ($loser === null);
 }
```

**Locations requiring this fix:**

| Location | Line | Context |
|----------|------|---------|
| L-R1 feeder check | ~605 | Winners R1 loser → Losers R1 slot |
| Even drop-in black slot | ~641 | Winners R(n) loser → Losers even-round drop-in slot |

> [!NOTE]
> **Single elimination is NOT affected** — the winners bracket check at L592 (`!$feeder->winner_user_id`) already correctly returns `true` for no-winner completed matches. Only the losers bracket loser-derivation logic has this gap.

---

## User Review Required

> [!IMPORTANT]
> **Check-in trigger**: The 10-minute timer starts when the **first** player enters the match room (not when the match is created in the bracket). This means if neither player enters, the timer hasn't started yet. The backend watchdog will also enforce a **20-minute hard deadline** from match creation as a safety net — if no one checks in within 20 minutes, **both players are forfeited** (double forfeit, both eliminated).

> [!IMPORTANT]
> **Pause approval flow**: When a player disconnects, the remaining player sees a modal: *"Your opponent disconnected. Grant a pause?"* with **Accept** / **Decline** buttons. If they decline, the chess clock keeps running as normal. If they accept, the clock pauses for up to 3 minutes.

> [!WARNING]
> **Double disconnect**: If both players disconnect simultaneously, the system starts a 3-minute timer for both. If neither reconnects, the match results in a **double forfeit** and both are eliminated.

## Open Questions

> [!IMPORTANT]
> **Q1: Forfeit win reason visibility** — When a player is forfeited for not checking in, should the bracket show "Forfeit (No Show)" as the win reason, or just "Forfeit"? I'll default to `"forfeit_no_show"` which renders as "Forfeit — No Show" in the bracket.

> [!IMPORTANT]
> **Q2: Pause timer duration** — You mentioned 3 minutes for disconnection pause. Should this be configurable per tournament at creation time, or fixed at 3 minutes for all tournaments? I'll default to **fixed 3 minutes** for simplicity.

---

## Proposed Changes

### Database Migration

#### [NEW] [add_tournament_failsafe_columns.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/database/migrations/2026_08_03_000001_add_tournament_failsafe_columns.php)

New migration adding fail-safe columns to `chess_tournament_matches`:

| Column | Type | Purpose |
|--------|------|---------|
| `match_ready_at` | `timestamp` | When the match game was created (both players assigned) |
| `first_checkin_at` | `timestamp` | When the first player entered the game room |
| `white_checked_in` | `boolean` | Whether white player has entered the game room |
| `black_checked_in` | `boolean` | Whether black player has entered the game room |
| `pause_count_white` | `integer` | Number of pauses used by white (max 3) |
| `pause_count_black` | `integer` | Number of pauses used by black (max 3) |
| `paused_at` | `timestamp` | When the current pause started |
| `pause_remaining_ms` | `integer` | Remaining ms on the pause timer (default 180000 = 3 min) |
| `paused_by_color` | `string` | Which player's disconnect triggered the pause (`white` / `black`) |

Also adds `match_checkin_minutes` (default 10) to `chess_tournaments` table for per-tournament configuration of the check-in window.

---

### Backend: Model Updates

#### [MODIFY] [ChessTournamentMatch.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Models/ChessTournamentMatch.php)

- Add new columns to `$fillable`: `match_ready_at`, `first_checkin_at`, `white_checked_in`, `black_checked_in`, `pause_count_white`, `pause_count_black`, `paused_at`, `pause_remaining_ms`, `paused_by_color`
- Add `$casts` for booleans and datetime fields
- Add helper methods: `isFullyCheckedIn()`, `canPause(string $color)`, `isPaused()`

#### [MODIFY] [ChessTournament.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Models/ChessTournament.php)

- Add `match_checkin_minutes` to `$fillable` and `$casts`

---

### Backend: Service Layer

#### [MODIFY] [ChessTournamentService.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Services/ChessTournamentService.php)

**Bug Fix in `isSlotPermanentlyEmpty()` method:**
- Add early-return `if (!$feeder->winner_user_id) return true;` at L605 and L641 inside losers bracket feeder checks
- This ensures double-forfeited matches (completed with no winner) correctly signal "no loser coming" to downstream losers bracket slots

**Changes to existing `evaluateDagGraph()` method:**
- When a match game is created (both players present), set `match_ready_at = now()` on the match
- Create the `ChessGame` but with `status = 'waiting'` instead of `'in_progress'` (so chess clocks don't tick yet)
- The game transitions to `in_progress` only when both players check in

**New methods:**

```
checkinPlayer(match, userId)
```
- Sets `white_checked_in` or `black_checked_in` to true
- If this is the first check-in, sets `first_checkin_at = now()`
- If both are now checked in → starts the game (`status = 'in_progress'`, `started_at = now()`)
- Broadcasts `tournament_match_checkin` event with timer info

```
forfeitMatch(match, forfeitedUserId, reason)
```
- Completes the match with the non-forfeited player as winner
- Sets `win_reason = 'forfeit_no_show'` or `'forfeit_disconnect'`
- Eliminates the forfeited player
- Routes winner through DAG and runs `evaluateDagGraph()`
- **Double forfeit case**: If both players are forfeited, sets `winner_user_id = null`, eliminates both participants, and calls `evaluateDagGraph()` which will now correctly propagate empty slots through both winners AND losers brackets (thanks to the `isSlotPermanentlyEmpty()` fix)

```
pauseMatch(match, pausedByColor, approvedByUserId)
```
- Validates the opponent has pauses remaining and approver is the other player
- Sets `paused_at = now()`, `pause_remaining_ms = 180000` (3 min)
- Increments `pause_count_{color}`
- Freezes chess clock times on the `ChessGame` record
- Broadcasts `tournament_match_paused` event

```
resumeMatch(match)
```
- Clears `paused_at` and `paused_by_color`
- Restores chess clock and sets game back to active
- Broadcasts `tournament_match_resumed` event

```
checkExpiredTimers()
```
- Called by scheduled watchdog command
- Finds matches where `first_checkin_at` is set and 10+ minutes have elapsed with incomplete check-in → forfeit absent player
- Finds matches where `match_ready_at` is set and 20+ minutes have elapsed with no check-in at all → double forfeit
- Finds paused matches where pause timer has expired → auto-resume

---

### Backend: Controller

#### [MODIFY] [ChessTournamentController.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Http/Controllers/ChessTournamentController.php)

New endpoints:

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/chess/tournaments/{id}/matches/{matchId}/checkin` | Player checks into their match |
| `POST` | `/api/chess/tournaments/{id}/matches/{matchId}/pause` | Opponent approves a disconnect pause |
| `POST` | `/api/chess/tournaments/{id}/matches/{matchId}/resume` | Force-resume a paused match |

---

### Backend: Scheduled Watchdog

#### [NEW] [ChessTournamentWatchdog.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/app/Console/Commands/ChessTournamentWatchdog.php)

Artisan command `chess:tournament-watchdog` that runs **every minute** via Laravel scheduler:
1. Scans all `in_progress` tournaments for matches needing enforcement
2. Auto-forfeits expired check-in timers
3. Auto-resumes expired pause timers
4. Logs all enforcement actions

#### [MODIFY] [console.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/routes/console.php)

Register the watchdog: `Schedule::command('chess:tournament-watchdog')->everyMinute()`

---

### Backend: Routes

#### [MODIFY] [web.php](file:///c:/laragon/www/cyberlogic-project/cyberlogic-backend/routes/web.php)

Add new tournament match routes for check-in, pause, and resume endpoints.

---

### Frontend: API Layer

#### [MODIFY] [chessApi.ts](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/utils/chessApi.ts)

- Update `ChessTournamentMatch` interface with new fields: `match_ready_at`, `first_checkin_at`, `white_checked_in`, `black_checked_in`, `pause_count_white`, `pause_count_black`, `paused_at`, `pause_remaining_ms`, `paused_by_color`
- Add API functions: `checkinTournamentMatch()`, `pauseTournamentMatch()`, `resumeTournamentMatch()`

---

### Frontend: Tournament Bracket (Visual Indicators)

#### [MODIFY] [ChessTournamentBracket.tsx](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/components/chess/ChessTournamentBracket.tsx)

**Match Card Enhancements when match is ready and pending check-in:**

- **Pulsing amber/red border** with animated glow when the current user's match is ready
- **Live countdown timer** showing "JOIN IN: 9:42" with urgency colors (green → amber → red as time decreases)
- **"⚔️ YOUR MATCH IS READY!"** banner that pulses/bounces to grab attention
- **Player check-in status dots**: ✅ green = checked in, ⏳ amber = waiting
- If paused, show **"⏸️ PAUSED"** badge with remaining reconnect time
- Show pause count indicators per player (e.g., "Pauses: 2/3 remaining")

---

### Frontend: Game Room (Check-In & Pause Flow)

#### [MODIFY] [ChessGameRoom.tsx](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/pages/ChessGameRoom.tsx)

**Auto Check-In on Entry:**
- When loading a game that belongs to a tournament match, auto-call `checkinTournamentMatch()` API
- Show "Waiting for opponent to join..." overlay with countdown if only one player checked in
- Show "Both players ready — Match starting!" transition animation when both check in

**Disconnect Pause UI:**
- Listen for `tournament_player_disconnected` WebSocket event
- Show modal to remaining player: "Your opponent disconnected. Grant a pause? (X pauses remaining)" with **Accept Pause** / **Decline** buttons
- When paused, show a **full-width pause overlay** with:
  - "⏸️ GAME PAUSED" header
  - 3-minute countdown timer (animated circular progress)
  - "Waiting for opponent to reconnect..."
  - "Resume Game" button (to manually end the pause early)
- When pause expires, auto-dismiss overlay and resume clock

**Pause State Sync:**
- If a player enters a paused game, auto-resume the pause
- Freeze the chess clock interval during pause state

---

### Frontend: Realtime Hook

#### [MODIFY] [useChessRealtime.ts](file:///c:/laragon/www/cyberlogic-project/cyberlogic-frontend/src/hooks/useChessRealtime.ts)

Add handlers for new WebSocket event types:
- `tournament_match_checkin` — update check-in status
- `tournament_match_paused` — trigger pause overlay
- `tournament_match_resumed` — dismiss pause overlay, resume clocks
- `tournament_player_disconnected` — show pause prompt to remaining player
- `tournament_match_forfeited` — show forfeit result

Expose new state: `tournamentMatchState` (check-in status, pause state, countdown timers)

---

### Realtime WebSocket Server

#### [MODIFY] [ChannelManager.js](file:///c:/laragon/www/cyberlogic-project/cyberlogic-realtime/src/channels/ChannelManager.js)

- Detect player disconnect from `chess_game_{id}` channel for tournament games
- When a player disconnects, broadcast `tournament_player_disconnected` to the remaining player on the game channel
- When a disconnected player reconnects (re-subscribes to the game channel), broadcast `tournament_player_reconnected`

---

## Suggestions

> [!TIP]
> **Audio alert**: When a player's match is ready, play a subtle notification sound in addition to the visual indicator. This is especially useful if the player has the tab in the background. We can use the Web Audio API with a short chime.

> [!TIP]
> **Browser notification**: Use the Notification API to send a native browser notification when the player's match is ready, even if the tab is not focused. This significantly reduces no-show rates.

> [!TIP]
> **Grace period for very short disconnects**: The 3-minute pause timer covers intentional reconnection windows, but we could add a **15-second grace period** before showing the disconnect prompt — this handles brief network hiccups (tab switch on mobile, router handoff) without bothering the opponent.

---

## Verification Plan

### Automated Tests
- `php artisan chess:tournament-watchdog` — verify the command processes expired timers correctly
- Test the check-in flow: create tournament → start → verify match has `match_ready_at` → call checkin API → verify game starts
- Test forfeit: simulate expired check-in timer → verify winner is correctly assigned and bracket advances

### Double Forfeit DAG Propagation Tests

**Single Elimination (should already work, verify regression):**
1. 4-player single-elim tournament → double forfeit Match 1 → verify Match 2 winner auto-advances to Final via BYE
2. 8-player single-elim → double forfeit in Quarter-Final → verify the Semi-Final opponent auto-advances, and the bracket completes normally

**Double Elimination (critical — tests the bug fix):**
1. 4-player double-elim → double forfeit Winners R1 Match 1 → verify:
   - No winner routed to Winners R2 ✅
   - No loser routed to Losers R1 ✅
   - Losers R1 slot correctly detected as permanently empty ✅
   - Losers bracket player from Match 2 auto-advances through the empty losers slot ✅
   - Tournament completes without stalling ✅
2. 8-player double-elim → double forfeit Winners R2 → verify:
   - Even drop-in round losers bracket slot correctly detected as permanently empty ✅
   - Grand Final still reachable by remaining players ✅
3. Cascade test: Multiple double forfeits across different rounds → verify `evaluateDagGraph()` correctly propagates all empty slots in a single pass cycle

### Manual Verification
1. Create a tournament with 2 players, start it
2. Verify the bracket shows "YOUR MATCH IS READY" with countdown timer
3. Enter as Player 1 → verify check-in registers and countdown starts from first check-in
4. Enter as Player 2 → verify game transitions to active with both clocks running
5. Disconnect Player 2 → verify Player 1 sees the pause prompt
6. Accept pause → verify clocks freeze and 3-minute timer appears
7. Reconnect Player 2 → verify pause auto-resumes
8. Test forfeit by letting check-in timer expire without Player 2 joining
9. Test double forfeit by letting the 20-minute hard deadline expire with neither player checking in → verify bracket advances the other branch's player via auto-BYE
