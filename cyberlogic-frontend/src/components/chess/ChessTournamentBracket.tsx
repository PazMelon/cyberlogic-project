import React from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Swords, Crown, Play, CheckCircle2, Shield } from 'lucide-react';
import { type ChessTournament, type ChessTournamentMatch } from '../../utils/chessApi';

interface ChessTournamentBracketProps {
  tournament: ChessTournament;
  onRefresh?: () => void;
}

export const ChessTournamentBracket: React.FC<ChessTournamentBracketProps> = ({ tournament }) => {
  const navigate = useNavigate();

  const totalRounds = tournament.total_rounds || 1;
  const allMatches = tournament.matches || [];

  const winnersMatchesByRound: Record<number, ChessTournamentMatch[]> = {};
  const losersMatchesByRound: Record<number, ChessTournamentMatch[]> = {};

  for (let r = 1; r <= totalRounds; r++) {
    winnersMatchesByRound[r] = allMatches
      .filter((m) => m.round_number === r && m.bracket_type !== 'losers')
      .sort((a, b) => a.match_number - b.match_number);

    losersMatchesByRound[r] = allMatches
      .filter((m) => m.round_number === r && m.bracket_type === 'losers')
      .sort((a, b) => a.match_number - b.match_number);
  }

  const isDoubleElimination = tournament.elimination_mode === 'double' || allMatches.some((m) => m.bracket_type === 'losers');

  const getRoundTitle = (roundNum: number, total: number, isDouble: boolean) => {
    if (roundNum === total && !isDouble) return '🏆 Championship Final';
    if (roundNum === total && isDouble) return '🔥 Winners Final';
    if (roundNum === total - 1) return '🔥 Semi-Finals';
    if (roundNum === total - 2) return '⚔️ Quarter-Finals';
    return `Round ${roundNum}`;
  };

  // Exact mathematical coordinate calculation for 100% pixel-perfect bracket lines
  const MATCH_HEIGHT = 115;
  const GAP_HEIGHT = 25;
  const UNIT_HEIGHT = MATCH_HEIGHT + GAP_HEIGHT;

  const getMatchCenterY = (r: number, m: number): number => {
    if (r === 1) {
      return m * UNIT_HEIGHT + MATCH_HEIGHT / 2;
    }
    return (getMatchCenterY(r - 1, m * 2) + getMatchCenterY(r - 1, m * 2 + 1)) / 2;
  };

  const numRound1Matches = winnersMatchesByRound[1]?.length || Math.pow(2, totalRounds - 1);
  const totalTreeHeight = Math.max(300, numRound1Matches * UNIT_HEIGHT);

  const renderMatchCard = (match: ChessTournamentMatch, isFinalRound: boolean) => {
    const isLive = match.status === 'in_progress' && match.chessGame;
    const isBye = match.status === 'bye';
    const isCompleted = match.status === 'completed';
    const isLosersBracket = match.bracket_type === 'losers';

    const whiteWinner = match.winner_user_id && match.winner_user_id === match.white_user_id;
    const blackWinner = match.winner_user_id && match.winner_user_id === match.black_user_id;

    return (
      <div
        key={match.id}
        className={`bg-[var(--cl-surface-900)] border rounded-xl p-3.5 shadow-md transition-all relative group text-[var(--cl-text-primary)] ${
          isLosersBracket
            ? 'border-cyan-500/40 bg-gradient-to-b from-[var(--cl-surface-900)] to-cyan-950/20'
            : isLive
            ? 'border-[var(--cl-primary)] ring-2 ring-[var(--cl-primary)]/30'
            : isFinalRound
            ? 'border-amber-500/50 bg-gradient-to-b from-[var(--cl-surface-900)] to-amber-500/10'
            : 'border-[var(--cl-border)] hover:border-[var(--cl-primary)]/40'
        }`}
      >
        {/* Match Status Badge */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--cl-border)]/60">
          <span className="text-[10px] font-mono font-extrabold text-[var(--cl-text-primary)] uppercase flex items-center gap-1">
            {isLosersBracket ? (
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
            {match.whiteUser ? (
              <>
                <img
                  src={match.whiteUser.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(match.whiteUser.name || 'W')}`}
                  alt="White Player"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="text-xs truncate font-bold">{match.whiteUser.name || match.whiteUser.first_name}</span>
              </>
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
            {match.blackUser ? (
              <>
                <img
                  src={match.blackUser.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(match.blackUser.name || 'B')}`}
                  alt="Black Player"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="text-xs truncate font-bold">{match.blackUser.name || match.blackUser.first_name}</span>
              </>
            ) : (
              <span className="text-xs italic text-[var(--cl-text-secondary)] font-mono font-semibold">
                {isLosersBracket ? 'Losers Bracket Player' : 'Winner TBD'}
              </span>
            )}
          </div>
          {blackWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        </div>

        {/* Watch / Action Button */}
        {isLive && match.chessGame && (
          <button
            onClick={() => navigate(`/app/chess/${match.chessGame?.game_code}`)}
            className="w-full mt-3 bg-[var(--cl-primary)] hover:brightness-110 border border-[var(--cl-primary)] text-slate-950 font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
          >
            <Swords className="w-3.5 h-3.5" /> Watch Match Live
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-[var(--cl-text-primary)]">
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
              {tournament.winner.name || `${tournament.winner.first_name} ${tournament.winner.last_name}`}
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
                      {roundMatches.length} Match{roundMatches.length > 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* Matches List Positioned by Mathematical Y Center */}
                  <div className="relative flex-1">
                    {roundMatches.map((match, mIdx) => {
                      const centerY = getMatchCenterY(roundNum, mIdx);
                      return (
                        <div
                          key={match.id}
                          style={{ top: `${centerY - MATCH_HEIGHT / 2}px`, height: `${MATCH_HEIGHT}px` }}
                          className="absolute w-full z-10"
                        >
                          {renderMatchCard(match, isFinalRound)}
                        </div>
                      );
                    })}

                    {/* 100% Mathematically Exact SVG Connectors for Pairs */}
                    {hasNextRound && roundMatches.length >= 2 && (
                      <svg className="absolute -right-10 top-0 w-10 h-full pointer-events-none text-[var(--cl-primary)] overflow-visible z-0">
                        {Array.from({ length: Math.floor(roundMatches.length / 2) }, (_, pIdx) => {
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
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> 🏆 Grand Finals
                  </h3>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    Ultimate Finale
                  </span>
                </div>

                <div className="relative flex-1">
                  <div
                    style={{ top: `${getMatchCenterY(totalRounds, 0) - 60}px` }}
                    className="absolute w-full bg-[var(--cl-surface-900)] border-2 border-amber-500/60 rounded-xl p-4 space-y-3 shadow-xl bg-gradient-to-b from-[var(--cl-surface-900)] via-amber-500/10 to-[var(--cl-surface-900)] z-10"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                      <span>ULTIMATE CHAMPIONSHIP</span>
                      <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">DOUBLE ELIM</span>
                    </div>
                    <div className="p-3 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 flex items-center justify-between">
                      <span>👑 Winners Bracket Champion</span>
                      <span className="text-[10px] font-mono">1st Seed</span>
                    </div>
                    <div className="p-3 rounded-lg text-xs font-extrabold bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border border-cyan-500/40 flex items-center justify-between">
                      <span>🛡️ Losers Bracket Champion</span>
                      <span className="text-[10px] font-mono">2nd Seed</span>
                    </div>
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

            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex gap-10 min-w-max p-3 relative" style={{ height: `${totalTreeHeight + 60}px` }}>
                {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNum) => {
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

                      <div className="relative flex-1">
                        {roundMatches.length > 0 ? (
                          roundMatches.map((match, mIdx) => {
                            const centerY = getMatchCenterY(roundNum, mIdx);
                            return (
                              <div
                                key={match.id}
                                style={{ top: `${centerY - MATCH_HEIGHT / 2}px`, height: `${MATCH_HEIGHT}px` }}
                                className="absolute w-full z-10"
                              >
                                {renderMatchCard(match, false)}
                              </div>
                            );
                          })
                        ) : (
                          <div className="bg-[var(--cl-surface-900)] border border-cyan-500/30 rounded-xl p-4 text-center text-xs text-[var(--cl-text-secondary)] space-y-1 font-medium z-10 mt-4">
                            <span className="font-bold text-cyan-700 dark:text-cyan-300 block">Losers Bracket Placeholder</span>
                            <span>Losers from Winners Bracket will drop down into this round</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
