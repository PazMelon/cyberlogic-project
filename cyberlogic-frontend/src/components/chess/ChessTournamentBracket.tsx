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
      .sort((a, b) => {
        if (a.is_third_place) return 1;
        if (b.is_third_place) return -1;
        return a.match_number - b.match_number;
      });

    losersMatchesByRound[r] = allMatches
      .filter((m) => m.round_number === r && m.bracket_type === 'losers')
      .sort((a, b) => a.match_number - b.match_number);
  }

  const isDoubleElimination = tournament.elimination_mode === 'double' || allMatches.some((m) => m.bracket_type === 'losers');

  const getRoundTitle = (roundNum: number, total: number) => {
    if (roundNum === total) return '🏆 Championship Final';
    if (roundNum === total - 1) return '🔥 Semi-Finals';
    if (roundNum === total - 2) return '⚔️ Quarter-Finals';
    return `Round ${roundNum}`;
  };

  const renderMatchCard = (match: ChessTournamentMatch, isFinalRound: boolean, hasNextRound: boolean) => {
    const isLive = match.status === 'in_progress' && match.chessGame;
    const isBye = match.status === 'bye';
    const isCompleted = match.status === 'completed';
    const isThirdPlace = match.is_third_place;
    const isLosersBracket = match.bracket_type === 'losers';

    const whiteWinner = match.winner_user_id && match.winner_user_id === match.white_user_id;
    const blackWinner = match.winner_user_id && match.winner_user_id === match.black_user_id;

    return (
      <div
        key={match.id}
        className={`bg-[var(--cl-surface-900)] border rounded-xl p-3.5 shadow-lg transition-all relative group ${
          isThirdPlace
            ? 'border-amber-600/40 bg-gradient-to-b from-[var(--cl-surface-900)] to-amber-950/20'
            : isLosersBracket
            ? 'border-cyan-500/40 bg-gradient-to-b from-[var(--cl-surface-900)] to-cyan-950/10'
            : isLive
            ? 'border-[var(--cl-primary)]/50 ring-1 ring-[var(--cl-primary)]/30'
            : isFinalRound
            ? 'border-amber-500/40 bg-gradient-to-b from-[var(--cl-surface-900)] to-amber-950/10'
            : 'border-[var(--cl-border)] hover:border-[var(--cl-border)]/80'
        }`}
      >
        {/* Connecting Line to Next Round */}
        {hasNextRound && !isThirdPlace && (
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-10 h-0.5 bg-[var(--cl-border)]/60 group-hover:bg-[var(--cl-primary)]/50 transition-colors pointer-events-none" />
        )}

        {/* Match Status Badge */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--cl-border)]/40">
          <span className="text-[10px] font-mono font-bold text-[var(--cl-text-muted)] uppercase flex items-center gap-1">
            {isThirdPlace ? (
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                🥉 3rd Place Match
              </span>
            ) : isLosersBracket ? (
              <span className="text-cyan-300 font-bold">
                🛡️ Losers M#{match.match_number}
              </span>
            ) : (
              `M#${match.match_number}`
            )}
          </span>

          {isLive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
              <Play className="w-2.5 h-2.5 fill-current" /> LIVE
            </span>
          )}
          {isBye && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
              BYE ADVANCE
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              FINISHED
            </span>
          )}
          {match.status === 'pending' && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-[var(--cl-text-muted)] border border-white/10">
              PENDING
            </span>
          )}
        </div>

        {/* Player 1 (White) */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
            whiteWinner ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold' : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)]'
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
                <span className="text-xs truncate font-medium">{match.whiteUser.name || match.whiteUser.first_name}</span>
              </>
            ) : (
              <span className="text-xs italic text-[var(--cl-text-muted)] font-mono">
                {isThirdPlace ? 'Semi-Final Loser #1' : isLosersBracket ? 'Losers Bracket Player' : 'TBD'}
              </span>
            )}
          </div>
          {whiteWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        </div>

        <div className="text-[9px] text-center font-bold text-[var(--cl-text-muted)]/40 my-1 uppercase tracking-widest">VS</div>

        {/* Player 2 (Black) */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
            blackWinner ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold' : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)]'
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
                <span className="text-xs truncate font-medium">{match.blackUser.name || match.blackUser.first_name}</span>
              </>
            ) : (
              <span className="text-xs italic text-[var(--cl-text-muted)] font-mono">
                {isThirdPlace ? 'Semi-Final Loser #2' : isLosersBracket ? 'Losers Bracket Player' : 'TBD'}
              </span>
            )}
          </div>
          {blackWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        </div>

        {/* Watch / Action Button */}
        {isLive && match.chessGame && (
          <button
            onClick={() => navigate(`/app/chess/${match.chessGame?.game_code}`)}
            className="w-full mt-3 bg-[var(--cl-primary)]/20 hover:bg-[var(--cl-primary)]/30 border border-[var(--cl-primary)]/40 text-[var(--cl-primary-light)] font-bold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <Swords className="w-3.5 h-3.5" /> Watch Match
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Winner Header Banner if Completed */}
      {tournament.status === 'completed' && tournament.winner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/30 rounded-2xl p-6 text-center shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/20 animate-bounce">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {isDoubleElimination ? 'Double Elimination Champion' : 'Tournament Champion'}
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--cl-text-primary)] mt-2 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              {tournament.winner.name || `${tournament.winner.first_name} ${tournament.winner.last_name}`}
            </h2>
            <p className="text-xs text-[var(--cl-text-muted)] mt-1">
              Awarded +15 Reputation Points & +30 ELO Bonus
            </p>
          </div>
        </div>
      )}

      {/* 👑 Winners Bracket Section */}
      <div className="space-y-3">
        {isDoubleElimination && (
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Crown className="w-4 h-4" /> 👑 Winners Bracket
          </div>
        )}
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-10 min-w-max p-3 items-stretch relative">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNum) => {
              const roundMatches = winnersMatchesByRound[roundNum] || [];
              const isFinalRound = roundNum === totalRounds;

              return (
                <div key={roundNum} className="w-72 flex flex-col justify-around space-y-6 relative">
                  {/* Round Header */}
                  <div className="text-center py-2 px-4 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/70 shadow-sm z-10">
                    <h3 className="text-xs font-extrabold text-[var(--cl-text-primary)] tracking-wide">
                      {getRoundTitle(roundNum, totalRounds)}
                    </h3>
                    <span className="text-[10px] text-[var(--cl-text-muted)] font-mono">
                      {roundMatches.length} Match{roundMatches.length > 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-6 flex-1 flex flex-col justify-around z-10">
                    {roundMatches.map((match) => renderMatchCard(match, isFinalRound, roundNum < totalRounds))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🛡️ Losers Bracket Section (If Double Elimination) */}
      {isDoubleElimination && (
        <div className="space-y-3 pt-6 border-t border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-cyan-400" /> 🛡️ Losers Bracket (Double Elimination)
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 font-bold">
              2nd Chance Bracket (2 Losses to Eliminate)
            </span>
          </div>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-10 min-w-max p-3 items-stretch relative">
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNum) => {
                const roundMatches = losersMatchesByRound[roundNum] || [];

                return (
                  <div key={`losers-${roundNum}`} className="w-72 flex flex-col justify-around space-y-6 relative">
                    <div className="text-center py-2 px-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-cyan-300 shadow-sm z-10">
                      <h3 className="text-xs font-extrabold tracking-wide">
                        Losers Round {roundNum}
                      </h3>
                      <span className="text-[10px] text-cyan-400/80 font-mono">
                        {roundMatches.length} Match{roundMatches.length !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col justify-around z-10">
                      {roundMatches.length > 0 ? (
                        roundMatches.map((match) => renderMatchCard(match, false, roundNum < totalRounds))
                      ) : (
                        <div className="bg-[var(--cl-surface-900)] border border-cyan-500/20 rounded-xl p-4 text-center text-[11px] text-[var(--cl-text-muted)] space-y-1">
                          <span className="font-bold text-cyan-400 block">Losers Bracket Placeholder</span>
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
      )}
    </div>
  );
};
