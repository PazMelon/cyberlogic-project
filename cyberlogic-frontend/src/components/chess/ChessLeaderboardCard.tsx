import { Trophy } from 'lucide-react';
import { type ChessPlayerStat } from '../../utils/chessApi';

interface ChessLeaderboardCardProps {
  leaderboard: ChessPlayerStat[];
  leaderboardSort: 'elo' | 'reputation';
  onSetLeaderboardSort: (sort: 'elo' | 'reputation') => void;
}

export function ChessLeaderboardCard({
  leaderboard,
  leaderboardSort,
  onSetLeaderboardSort,
}: ChessLeaderboardCardProps) {
  return (
    <div className="glass border border-[var(--cl-border)] rounded-2xl p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> CyberLogic Chess Leaderboard
          </h2>
          <p className="text-xs text-[var(--cl-text-muted)] mt-0.5">Top players ranked by ELO Rating and Participation Reputation</p>
        </div>

        <div className="flex items-center gap-2 bg-[var(--cl-surface-950)] p-1 rounded-xl border border-[var(--cl-border)] self-start sm:self-auto">
          <button
            onClick={() => onSetLeaderboardSort('elo')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              leaderboardSort === 'elo'
                ? 'bg-[var(--cl-primary)] text-slate-950 font-bold shadow'
                : 'text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)]'
            }`}
          >
            Ranked ELO
          </button>
          <button
            onClick={() => onSetLeaderboardSort('reputation')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              leaderboardSort === 'reputation'
                ? 'bg-[var(--cl-primary)] text-slate-950 font-bold shadow'
                : 'text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)]'
            }`}
          >
            Reputation Points
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--cl-text-primary)]">
          <thead className="bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] uppercase text-[11px] tracking-wider font-semibold border-b border-[var(--cl-border)]">
            <tr>
              <th className="px-3.5 py-3">Rank</th>
              <th className="px-3.5 py-3">Player</th>
              <th className="px-3.5 py-3">ELO Rating</th>
              <th className="px-3.5 py-3">Peak ELO</th>
              <th className="px-3.5 py-3">Ranked Record (W/L/D)</th>
              <th className="px-3.5 py-3">Reputation Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--cl-border)]">
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--cl-text-muted)] italic">
                  No leaderboard entries yet. Play a match to get ranked!
                </td>
              </tr>
            ) : (
              leaderboard.map((stat, index) => {
                const rank = index + 1;
                return (
                  <tr key={stat.id} className="hover:bg-[var(--cl-surface-800)]/40 transition-colors">
                    <td className="px-3.5 py-3 font-bold text-[var(--cl-text-muted)]">
                      {rank === 1 ? (
                        <span className="text-amber-400 text-base">🥇 #1</span>
                      ) : rank === 2 ? (
                        <span className="text-slate-300 text-base">🥈 #2</span>
                      ) : rank === 3 ? (
                        <span className="text-amber-700 text-base">🥉 #3</span>
                      ) : (
                        `#${rank}`
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            stat.user?.avatar ||
                            `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(stat.user?.name || stat.user?.username || 'user')}`
                          }
                          alt="avatar"
                          className="w-7 h-7 rounded-full border border-[var(--cl-border)] object-cover"
                        />
                        <div>
                          <div className="font-semibold text-[var(--cl-text-primary)] text-xs sm:text-sm">
                            {stat.user?.name || stat.user?.username || `Player #${stat.user_id}`}
                          </div>
                          <div className="text-[10px] text-[var(--cl-text-muted)] capitalize">{stat.user?.role || 'member'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-extrabold text-amber-400 font-mono text-sm sm:text-base">
                      {stat.elo_rating}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--cl-text-muted)] font-mono text-xs">{stat.peak_elo}</td>
                    <td className="px-3.5 py-3 text-xs font-mono text-[var(--cl-text-secondary)] whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">{stat.ranked_wins}W</span> /{' '}
                      <span className="text-rose-400 font-bold">{stat.ranked_losses}L</span> /{' '}
                      <span className="text-[var(--cl-text-muted)]">{stat.ranked_draws}D</span>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-emerald-400 font-mono text-xs sm:text-sm">
                      +{stat.chess_reputation_points}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
