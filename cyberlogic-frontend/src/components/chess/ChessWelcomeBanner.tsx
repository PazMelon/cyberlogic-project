import { Swords, Trophy, Award, Plus } from 'lucide-react';
import { type ChessPlayerStat } from '../../utils/chessApi';

interface ChessWelcomeBannerProps {
  userName?: string;
  userStat: ChessPlayerStat | null;
  onOpenCreateModal: () => void;
}

export function ChessWelcomeBanner({ userName, userStat, onOpenCreateModal }: ChessWelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--cl-primary)]/10 via-[var(--cl-accent)]/5 to-transparent border border-[var(--cl-border)] p-6 sm:p-8 shadow-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--cl-primary)]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--cl-primary-glow)] text-[var(--cl-primary-light)] text-xs font-semibold rounded-full border border-[var(--cl-primary)]/30 mb-3">
            <Swords className="w-3.5 h-3.5" /> 1v1 Realtime Arena
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--cl-text-primary)] mb-2">
            Welcome to <span className="text-gradient">Chess Arena</span>, {userName || 'Member'}!
          </h1>
          <p className="text-xs sm:text-sm text-[var(--cl-text-muted)] max-w-lg leading-relaxed">
            Challenge club members in 1v1 ranked or casual matches. Earn ELO rating for the leaderboard and Reputation Points for participation!
          </p>
        </div>

        {/* User Stats Card & Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5 w-full md:w-auto">
          {userStat && (
            <div className="bg-[var(--cl-surface-900)]/80 backdrop-blur border border-[var(--cl-border)] rounded-xl px-4 py-2.5 flex items-center justify-around sm:justify-center gap-5 w-full sm:w-auto">
              <div className="text-center">
                <div className="text-[11px] text-[var(--cl-text-muted)] font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> ELO
                </div>
                <div className="text-lg font-extrabold text-amber-400 mt-0.5">{userStat.elo_rating}</div>
              </div>
              <div className="h-7 w-px bg-[var(--cl-border)]"></div>
              <div className="text-center">
                <div className="text-[11px] text-[var(--cl-text-muted)] font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> Rep
                </div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                  +{userStat.chess_reputation_points}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onOpenCreateModal}
            className="bg-[var(--cl-primary)] hover:brightness-110 active:scale-95 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" /> Create Match
          </button>
        </div>
      </div>
    </div>
  );
}
