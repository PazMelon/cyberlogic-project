import { Users, Zap, ShieldCheck } from 'lucide-react';
import { type OnlineUser } from '../../context/WebSocketContext';

interface OnlinePlayersCardProps {
  onlineUsers: OnlineUser[];
  currentUserId?: number;
  onChallengeUser: (userId: number) => void;
}

export function OnlinePlayersCard({
  onlineUsers,
  currentUserId,
  onChallengeUser,
}: OnlinePlayersCardProps) {
  return (
    <div className="bg-[var(--cl-surface-900)]/90 backdrop-blur-md border border-[var(--cl-border)] rounded-2xl p-4 flex flex-col shrink-0 max-h-[268px] overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pb-2.5 border-b border-[var(--cl-border)]/60">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-[var(--cl-primary-glow)] text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/20 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)] truncate">
            Online Players
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          {onlineUsers.length} active
        </span>
      </div>

      {/* Online Players List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="w-8 h-8 text-[var(--cl-text-muted)] opacity-40 mb-1" />
            <p className="text-xs text-[var(--cl-text-muted)] font-medium">No other players online right now</p>
          </div>
        ) : (
          onlineUsers.map((u) => (
            <div
              key={u.id}
              className="group flex items-center justify-between p-2 rounded-xl bg-[var(--cl-surface-950)]/70 hover:bg-[var(--cl-surface-950)] border border-[var(--cl-border)] hover:border-[var(--cl-primary)]/40 text-xs transition-all duration-200 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(u.name || 'user')}`}
                    alt={u.name}
                    className="w-8 h-8 rounded-full object-cover border border-[var(--cl-border)] group-hover:border-[var(--cl-primary)]/50 transition-colors"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--cl-surface-950)] ${
                      u.status === 'playing' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[var(--cl-text-primary)] truncate text-xs group-hover:text-[var(--cl-primary-light)] transition-colors">
                    {u.name}
                  </div>
                  <div className="text-[10px] text-[var(--cl-text-muted)] capitalize truncate flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${u.status === 'playing' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    {u.status || 'In Hub'}
                  </div>
                </div>
              </div>

              {currentUserId && currentUserId !== u.id && (
                <button
                  onClick={() => onChallengeUser(u.id)}
                  title={`Challenge ${u.name} to a chess match`}
                  className="bg-[var(--cl-primary)]/10 hover:bg-[var(--cl-primary)] text-[var(--cl-primary-light)] hover:text-slate-950 border border-[var(--cl-primary)]/30 hover:border-[var(--cl-primary)] rounded-lg text-[11px] font-bold px-2.5 py-1.5 flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Match</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
