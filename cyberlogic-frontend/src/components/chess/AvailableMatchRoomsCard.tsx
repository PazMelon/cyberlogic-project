import { Radio, Swords } from 'lucide-react';
import { type ChessGame } from '../../utils/chessApi';
import { MatchRoomCard } from './MatchRoomCard';

interface AvailableMatchRoomsCardProps {
  games: ChessGame[];
  loading: boolean;
  currentUserId?: number;
  copiedCode: string | null;
  onCopyInviteLink: (code: string) => void;
  onNavigateGame: (code: string) => void;
  onOpenCreateModal: () => void;
}

export function AvailableMatchRoomsCard({
  games,
  loading,
  currentUserId,
  copiedCode,
  onCopyInviteLink,
  onNavigateGame,
  onOpenCreateModal,
}: AvailableMatchRoomsCardProps) {
  return (
    <div className="glass border border-[var(--cl-border)] rounded-2xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)]">
          <Radio className="w-5 h-5 text-emerald-400 animate-pulse" /> Available Match Rooms
        </h2>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--cl-surface-800)] text-[var(--cl-text-secondary)] border border-[var(--cl-border)]">
          {games.length} active
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[var(--cl-text-muted)]">Loading games...</div>
      ) : games.length === 0 ? (
        <div className="py-12 text-center bg-[var(--cl-surface-950)]/50 rounded-xl border border-dashed border-[var(--cl-border)]">
          <Swords className="w-10 h-10 text-[var(--cl-text-muted)] mx-auto mb-2 opacity-50" />
          <p className="text-[var(--cl-text-secondary)] font-medium">No open game rooms right now.</p>
          <p className="text-[var(--cl-text-muted)] text-xs mt-1">Create one to invite someone or wait for players!</p>
          <button
            onClick={onOpenCreateModal}
            className="mt-4 bg-[var(--cl-primary)] text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:brightness-110"
          >
            Create Game Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((g) => (
            <MatchRoomCard
              key={g.id}
              game={g}
              currentUserId={currentUserId}
              copiedCode={copiedCode}
              onCopyInviteLink={onCopyInviteLink}
              onNavigateGame={onNavigateGame}
            />
          ))}
        </div>
      )}
    </div>
  );
}
