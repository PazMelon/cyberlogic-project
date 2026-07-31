import React from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Swords, Crown, Play, CheckCircle2, Shield, Users, UserCheck, Clock, Eye } from 'lucide-react';
import { type ChessTournament, type ChessTournamentMatch } from '../../utils/chessApi';

interface ChessTournamentBracketProps {
  tournament: ChessTournament;
  currentUserId?: number;
  onRefresh?: () => void;
}

export const ChessTournamentBracket: React.FC<ChessTournamentBracketProps> = ({ tournament, currentUserId }) => {
  const navigate = useNavigate();

  const maxP = Math.max(2, Math.min(32, tournament.max_players || 8));
  const targetBracketSize = Math.pow(2, Math.max(1, Math.ceil(Math.log2(maxP))));
  const totalRounds = tournament.total_rounds || Math.log2(targetBracketSize);
  const allMatches = tournament.matches || [];
  const participants = tournament.participants || [];

  const isRegistration = tournament.status === 'registration';
  const isDoubleElimination = tournament.elimination_mode === 'double' || allMatches.some((m) => m.bracket_type === 'losers' || m.bracket_type === 'grand_final');

  const winnersMatchesByRound: Record<number, ChessTournamentMatch[]> = {};
  const losersMatchesByRound: Record<number, ChessTournamentMatch[]> = {};

  // Winners bracket: only 'winners' bracket_type
  for (let r = 1; r <= totalRounds; r++) {
    winnersMatchesByRound[r] = allMatches
      .filter((m) => Number(m.round_number) === Number(r) && (m.bracket_type === 'winners' || (!m.bracket_type && m.bracket_type !== 'losers')))
      .sort((a, b) => Number(a.match_number) - Number(b.match_number));
  }

  // Losers bracket: dynamically discover rounds from actual match data
  const losersMatches = allMatches.filter((m) => m.bracket_type === 'losers');
  const losersRoundNumbers = [...new Set(losersMatches.map((m) => Number(m.round_number)))].sort((a, b) => a - b);
  for (const r of losersRoundNumbers) {
    losersMatchesByRound[r] = losersMatches
      .filter((m) => Number(m.round_number) === Number(r))
      .sort((a, b) => Number(a.match_number) - Number(b.match_number));
  }

  // Grand Final match (if exists)
  const grandFinalMatch = allMatches.find((m) => m.bracket_type === 'grand_final') || null;

  const getRoundTitle = (roundNum: number, total: number, isDouble: boolean) => {
    if (roundNum === total && !isDouble) return '🏆 Championship Final';
    if (roundNum === total && isDouble) return '🔥 Winners Final';
    if (roundNum === total - 1) return '🔥 Semi-Finals';
    if (roundNum === total - 2) return '⚔️ Quarter-Finals';
    return `Round ${roundNum}`;
  };

  const getPlayerName = (u: any) => {
    if (!u) return null;
    if (u.username) return u.username;
    if (u.name) return u.name;
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return fullName.length > 0 ? fullName : 'Player';
  };

  const getPlayerAvatar = (u: any, fallbackSeed: string) => {
    if (!u) return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(fallbackSeed)}`;
    const rawAvatar = u.avatar || u.avatar_path;
    if (rawAvatar && typeof rawAvatar === 'string' && rawAvatar.trim().length > 0) {
      const clean = rawAvatar.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return clean.startsWith('/') ? clean : `/${clean}`;
    }
    const name = getPlayerName(u) || fallbackSeed;
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  };

  // Exact mathematical coordinate calculation for 100% pixel-perfect bracket lines
  const MATCH_HEIGHT = 195;
  const GAP_HEIGHT = 35;
  const UNIT_HEIGHT = MATCH_HEIGHT + GAP_HEIGHT;

  const getMatchCenterY = (r: number, m: number): number => {
    if (r === 1) {
      return m * UNIT_HEIGHT + MATCH_HEIGHT / 2;
    }
    return (getMatchCenterY(r - 1, m * 2) + getMatchCenterY(r - 1, m * 2 + 1)) / 2;
  };

  const numRound1Matches = targetBracketSize / 2;
  const totalTreeHeight = Math.max(300, numRound1Matches * UNIT_HEIGHT);

  const renderMatchCard = (match: ChessTournamentMatch | null, isFinalRound: boolean, roundNum: number, mIdx: number) => {
    if (!match || isRegistration) {
      // Unstarted / Registration Placeholder Match Card
      return (
        <div
          key={`placeholder-${roundNum}-${mIdx}`}
          className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60 rounded-xl p-3.5 shadow-sm relative text-[var(--cl-text-primary)] space-y-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          <div className="flex items-center justify-between text-[10px] font-mono mb-1 font-bold">
            <span className="text-[var(--cl-text-secondary)]">Match #{mIdx + 1}</span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">
              <Clock className="w-3 h-3" /> AWAITING SEEDING
            </span>
          </div>

          <div className="p-2 rounded-lg text-xs font-bold bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] border border-[var(--cl-border)]/40 flex items-center justify-between">
            <span className="truncate italic">Player TBD</span>
            <span className="text-[10px] font-mono font-normal">Seed #?</span>
          </div>
          <div className="p-2 rounded-lg text-xs font-bold bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] border border-[var(--cl-border)]/40 flex items-center justify-between">
            <span className="truncate italic">Player TBD</span>
            <span className="text-[10px] font-mono font-normal">Seed #?</span>
          </div>
        </div>
      );
    }

    const whiteUserObj = (match as any).white_user || match.whiteUser;
    const blackUserObj = (match as any).black_user || match.blackUser;
    const chessGameObj = (match as any).chess_game || match.chessGame;

    const isLive = match.status === 'in_progress' && chessGameObj;
    const isBye = match.status === 'bye';
    const isCompleted = match.status === 'completed';
    const isLosersBracket = match.bracket_type === 'losers';
    const isGrandFinal = match.bracket_type === 'grand_final';

    const whiteWinner = match.winner_user_id && match.winner_user_id === match.white_user_id;
    const blackWinner = match.winner_user_id && match.winner_user_id === match.black_user_id;

    const isParticipant = currentUserId && (
      Number(currentUserId) === Number(match.white_user_id) ||
      Number(currentUserId) === Number(match.black_user_id)
    );

    const whiteName = getPlayerName(whiteUserObj);
    const blackName = getPlayerName(blackUserObj);
    const gameCode = chessGameObj?.game_code;

    return (
      <div
        key={match.id}
        className={`bg-[var(--cl-surface-900)] border rounded-xl p-3.5 shadow-md transition-all relative group text-[var(--cl-text-primary)] ${
          isGrandFinal
            ? 'border-2 border-amber-500/60 ring-2 ring-amber-500/20 bg-gradient-to-b from-[var(--cl-surface-900)] via-amber-500/10 to-[var(--cl-surface-900)]'
            : isLosersBracket
            ? 'border-cyan-500/40 bg-gradient-to-b from-[var(--cl-surface-900)] to-cyan-950/20'
            : isLive
            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
            : isFinalRound
            ? 'border-amber-500/50 bg-gradient-to-b from-[var(--cl-surface-900)] to-amber-500/10'
            : 'border-[var(--cl-border)] hover:border-[var(--cl-primary)]/40'
        }`}
      >
        {/* Match Status Badge */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--cl-border)]/60">
          <span className="text-[10px] font-mono font-extrabold text-[var(--cl-text-primary)] uppercase flex items-center gap-1">
            {isGrandFinal ? (
              <span className="text-amber-700 dark:text-amber-300 font-bold">
                🏆 Grand Final
              </span>
            ) : isLosersBracket ? (
              <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                🛡️ Losers M#{match.match_number}
              </span>
            ) : (
              `Match #${match.match_number}`
            )}
          </span>

          {isLive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 animate-pulse">
              <Play className="w-2.5 h-2.5 fill-current" /> LIVE MATCH
            </span>
          )}
          {isBye && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
              BYE ADVANCE
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-500/20 text-[var(--cl-text-primary)] border border-slate-500/40">
              FINISHED
            </span>
          )}
          {match.status === 'pending' && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] border border-[var(--cl-border)]">
              WAITING
            </span>
          )}
        </div>

        {/* Player 1 (White) */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-colors border ${
            whiteWinner ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-extrabold' : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/40 text-[var(--cl-text-primary)]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shrink-0" title="White Piece" />
            {whiteUserObj || whiteName ? (
              <>
                <img
                  src={getPlayerAvatar(whiteUserObj, whiteName || 'W')}
                  alt="White Player"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(whiteName || 'W')}`;
                  }}
                />
                <span className="text-xs truncate font-bold">{whiteName || 'White Player'}</span>
              </>
            ) : match.white_user_id ? (
              <span className="text-xs font-bold text-[var(--cl-text-primary)] truncate">
                Player #{match.white_user_id}
              </span>
            ) : (
              <span className="text-xs italic text-[var(--cl-text-secondary)] font-mono font-semibold">
                {isLosersBracket ? 'Losers Bracket Player' : 'Winner TBD'}
              </span>
            )}
          </div>
          {whiteWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        </div>

        <div className="text-[9px] text-center font-extrabold text-[var(--cl-text-muted)] my-1 uppercase tracking-widest">VS</div>

        {/* Player 2 (Black) */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-colors border ${
            blackWinner ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-extrabold' : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/40 text-[var(--cl-text-primary)]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-600 shrink-0" title="Black Piece" />
            {blackUserObj || blackName ? (
              <>
                <img
                  src={getPlayerAvatar(blackUserObj, blackName || 'B')}
                  alt="Black Player"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(blackName || 'B')}`;
                  }}
                />
                <span className="text-xs truncate font-bold">{blackName || 'Black Player'}</span>
              </>
            ) : match.black_user_id ? (
              <span className="text-xs font-bold text-[var(--cl-text-primary)] truncate">
                Player #{match.black_user_id}
              </span>
            ) : (
              <span className="text-xs italic text-[var(--cl-text-secondary)] font-mono font-semibold">
                {isLosersBracket ? 'Losers Bracket Player' : 'Winner TBD'}
              </span>
            )}
          </div>
          {blackWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        </div>

        {/* Player Join or Spectator Action Button */}
        {match.white_user_id && match.black_user_id && match.status !== 'completed' && match.status !== 'bye' && (
          <div className="mt-3">
            {isParticipant ? (
              <button
                onClick={() => {
                  if (gameCode) {
                    navigate(`/app/chess/game/${gameCode}`);
                  }
                }}
                disabled={!gameCode}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98 animate-bounce"
              >
                <Swords className="w-3.5 h-3.5" /> {gameCode ? '⚔️ ENTER & PLAY MATCH' : '⏳ MATCH INITIALIZING...'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (gameCode) {
                    navigate(`/app/chess/game/${gameCode}`);
                  }
                }}
                disabled={!gameCode}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
              >
                <Eye className="w-3.5 h-3.5" /> {gameCode ? '👁️ SPECTATE MATCH LIVE' : '⏳ MATCH INITIALIZING...'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-[var(--cl-text-primary)]">
      {/* 👥 Registered Players Roster Panel (When in Registration Mode) */}
      <div className="bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-2xl p-5 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--cl-border)]/50 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--cl-text-primary)] uppercase tracking-wider">
            <Users className="w-4 h-4 text-[var(--cl-primary)]" />
            <span>Registered Players ({participants.length} / {maxP})</span>
          </div>
          <span className="text-[10px] font-mono font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            {isRegistration ? 'OPEN REGISTRATION' : 'REGISTERED ROSTER'}
          </span>
        </div>

        {participants.length === 0 ? (
          <p className="text-xs text-[var(--cl-text-muted)] italic py-2 text-center">
            No registered players yet. Be the first to join!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {participants.map((p, pIdx) => {
              const u = p.user;
              const name = getPlayerName(u) || `Player #${pIdx + 1}`;
              const avatar = getPlayerAvatar(u, name);

              return (
                <div
                  key={p.id || pIdx}
                  className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm hover:border-[var(--cl-primary)]/40 transition-colors"
                >
                  <img
                    src={avatar}
                    alt={name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-[var(--cl-primary)]/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--cl-text-primary)] truncate block">{name}</span>
                    <span className="text-[9px] text-[var(--cl-text-secondary)] font-mono font-semibold block">
                      Seed #{p.seed || pIdx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Winner Header Banner if Completed */}
      {tournament.status === 'completed' && tournament.winner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/30 rounded-2xl p-6 text-center shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-500 dark:text-amber-400 shadow-lg shadow-amber-500/20 animate-bounce">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
              {isDoubleElimination ? 'Double Elimination Champion' : 'Tournament Champion'}
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--cl-text-primary)] mt-2 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              {getPlayerName(tournament.winner)}
            </h2>
            <p className="text-xs text-[var(--cl-text-secondary)] font-medium mt-1">
              Awarded +15 Reputation Points & +30 ELO Bonus
            </p>
          </div>
        </div>
      )}

      {/* 👑 Winners / Main Bracket Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
          <Crown className="w-4 h-4" /> {isDoubleElimination ? '👑 Winners Bracket' : '🏆 Tournament Bracket'}
        </div>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-10 min-w-max p-3 pb-4 relative" style={{ height: `${totalTreeHeight + 60}px` }}>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNum) => {
              const roundMatches = winnersMatchesByRound[roundNum] || [];
              const matchesCount = targetBracketSize / Math.pow(2, roundNum);
              const isFinalRound = roundNum === totalRounds;
              const hasNextRound = roundNum < totalRounds;

              return (
                <div key={roundNum} className="w-72 relative flex flex-col">
                  {/* Round Header Card */}
                  <div className="text-center py-2 px-4 rounded-xl bg-[var(--cl-surface-900)] border border-[var(--cl-border)] shadow-sm z-10 mb-4">
                    <h3 className="text-xs font-extrabold text-[var(--cl-text-primary)] tracking-wide">
                      {getRoundTitle(roundNum, totalRounds, isDoubleElimination)}
                    </h3>
                    <span className="text-[10px] text-[var(--cl-text-secondary)] font-mono font-bold">
                      {matchesCount} Match{matchesCount > 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* Matches List Positioned by Mathematical Y Center */}
                  <div className="relative flex-1">
                    {Array.from({ length: matchesCount }, (_, mIdx) => {
                      const match = roundMatches[mIdx] || null;
                      const centerY = getMatchCenterY(roundNum, mIdx);
                      return (
                        <div
                          key={`w-${roundNum}-${mIdx}`}
                          style={{ top: `${centerY - MATCH_HEIGHT / 2}px`, height: `${MATCH_HEIGHT}px` }}
                          className="absolute w-full z-10"
                        >
                          {renderMatchCard(match, isFinalRound, roundNum, mIdx)}
                        </div>
                      );
                    })}

                    {/* 100% Mathematically Exact SVG Connectors for Pairs */}
                    {hasNextRound && matchesCount >= 2 && (
                      <svg className="absolute -right-10 top-0 w-10 h-full pointer-events-none text-[var(--cl-primary)] overflow-visible z-0">
                        {Array.from({ length: Math.floor(matchesCount / 2) }, (_, pIdx) => {
                          const y1 = getMatchCenterY(roundNum, pIdx * 2);
                          const y2 = getMatchCenterY(roundNum, pIdx * 2 + 1);
                          const yMid = (y1 + y2) / 2;

                          return (
                            <g key={pIdx}>
                              <line x1="0" y1={y1} x2="20" y2={y1} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="0" y1={y2} x2="20" y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="20" y1={y1} x2="20" y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="20" y1={yMid} x2="40" y2={yMid} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Ultimate Column: 🏆 Grand Finals (for Double Elimination) */}
            {isDoubleElimination && (
              <div className="w-72 relative flex flex-col">
                <div className="text-center py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 font-bold z-10 mb-4">
                  <h3 className="text-xs font-extrabold text-amber-700 dark:text-amber-300 tracking-wide flex items-center justify-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> 🏆 Grand Final
                  </h3>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    Winners Champion vs Losers Champion
                  </span>
                </div>

                <div className="relative flex-1">
                  <div
                    style={{ top: `${getMatchCenterY(totalRounds, 0) - 60}px` }}
                    className="absolute w-full z-10"
                  >
                    {grandFinalMatch ? (
                      renderMatchCard(grandFinalMatch, true, grandFinalMatch.round_number, 0)
                    ) : (
                      <div className="bg-[var(--cl-surface-900)] border-2 border-amber-500/60 rounded-xl p-4 space-y-3 shadow-xl bg-gradient-to-b from-[var(--cl-surface-900)] via-amber-500/10 to-[var(--cl-surface-900)]">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                          <span>ULTIMATE CHAMPIONSHIP</span>
                          <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">DOUBLE ELIM</span>
                        </div>
                        <div className="p-3 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 flex items-center justify-between">
                          <span>👑 Winners Bracket Champion</span>
                          <span className="text-[10px] font-mono">TBD</span>
                        </div>
                        <div className="p-3 rounded-lg text-xs font-extrabold bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border border-cyan-500/40 flex items-center justify-between">
                          <span>🛡️ Losers Bracket Champion</span>
                          <span className="text-[10px] font-mono">TBD</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🛡️ Losers Bracket Section (If Double Elimination) */}
      {isDoubleElimination && (
        <div className="space-y-6 pt-6 border-t border-cyan-500/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 font-extrabold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> 🛡️ Losers Bracket (Double Elimination)
              </div>
              <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-full border border-cyan-500/30 font-extrabold">
                2nd Chance Bracket (2 Losses to Eliminate)
              </span>
            </div>

            {losersRoundNumbers.length === 0 ? (
              <div className="bg-[var(--cl-surface-900)] border border-cyan-500/30 rounded-xl p-6 text-center text-xs text-[var(--cl-text-secondary)] space-y-1 font-medium">
                <span className="font-bold text-cyan-700 dark:text-cyan-300 block">Losers Bracket Not Yet Active</span>
                <span>Players who lose in the Winners Bracket will drop into the Losers Bracket</span>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-10 min-w-max p-3 relative">
                  {losersRoundNumbers.map((roundNum) => {
                    const roundMatches = losersMatchesByRound[roundNum] || [];

                    return (
                      <div key={`losers-${roundNum}`} className="w-72 relative flex flex-col">
                        <div className="text-center py-2 px-4 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[var(--cl-text-primary)] shadow-sm z-10 font-bold mb-4">
                          <h3 className="text-xs font-extrabold tracking-wide">
                            Losers Round {roundNum}
                          </h3>
                          <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono font-bold">
                            {roundMatches.length} Match{roundMatches.length !== 1 ? 'es' : ''}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {roundMatches.map((match, mIdx) => (
                            <div key={match.id}>
                              {renderMatchCard(match, false, roundNum, mIdx)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
