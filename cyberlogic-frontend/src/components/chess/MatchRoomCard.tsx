import { Globe, Shield, Clock, Check, Link as LinkIcon, Trash2 } from 'lucide-react';
import { type ChessGame } from '../../utils/chessApi';

interface MatchRoomCardProps {
  game: ChessGame;
  currentUserId?: number;
  copiedCode: string | null;
  onCopyInviteLink: (code: string) => void;
  onNavigateGame: (code: string) => void;
  onDeleteGame?: (code: string) => void;
}

export function MatchRoomCard({
  game,
  currentUserId,
  copiedCode,
  onCopyInviteLink,
  onNavigateGame,
  onDeleteGame,
}: MatchRoomCardProps) {
  const isFull = game.status === 'in_progress' || (game.white_player_id && game.black_player_id);
  const isMyGame = currentUserId && (game.white_player_id === currentUserId || game.black_player_id === currentUserId || game.host_player_id === currentUserId);
  const isHost = currentUserId && game.host_player_id === currentUserId;
  const canDelete = isHost && game.status === 'waiting';

  return (
    <div className="bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 hover:border-[var(--cl-primary)]/50 rounded-xl p-4 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
              game.type === 'ranked'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}
          >
            {game.type}
          </span>

          <div className="flex items-center gap-2">
            {game.allow_spectators ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20">
                <Globe className="w-3 h-3" /> Spectators Allowed
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-rose-500/20">
                <Shield className="w-3 h-3" /> Private Match
              </span>
            )}
          </div>
        </div>

        {/* Players summary */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs bg-[var(--cl-surface-900)] px-3 py-1.5 rounded-lg border border-[var(--cl-border)]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shrink-0"></div>
              <div className="min-w-0">
                <span className="font-semibold text-[var(--cl-text-primary)] truncate block">
                  {game.white_player?.name || (game.white_player_id ? `User #${game.white_player_id}` : 'Waiting...')}
                </span>
                {game.white_player?.username && (
                  <span className="text-[10px] text-[var(--cl-text-muted)] font-mono block">
                    @{game.white_player.username}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[var(--cl-text-muted)] font-mono text-[10px] shrink-0">WHITE</span>
          </div>

          <div className="flex items-center justify-between text-xs bg-[var(--cl-surface-900)] px-3 py-1.5 rounded-lg border border-[var(--cl-border)]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600 shrink-0"></div>
              <div className="min-w-0">
                <span className="font-semibold text-[var(--cl-text-primary)] truncate block">
                  {game.black_player?.name || (game.black_player_id ? `User #${game.black_player_id}` : 'Waiting...')}
                </span>
                {game.black_player?.username && (
                  <span className="text-[10px] text-[var(--cl-text-muted)] font-mono block">
                    @{game.black_player.username}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[var(--cl-text-muted)] font-mono text-[10px] shrink-0">BLACK</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--cl-border)]">
        <div className="text-[11px] text-[var(--cl-text-muted)] flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {game.time_control ? `${game.time_control} min` : 'Untimed'}
        </div>

        <div className="flex items-center gap-2">
          {canDelete && onDeleteGame && (
            <button
              onClick={() => onDeleteGame(game.game_code)}
              title="Delete Unstarted Match Room"
              className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onCopyInviteLink(game.game_code)}
            title="Copy Invite Link"
            className="p-2 text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] rounded-lg transition-all cursor-pointer border border-[var(--cl-border)]"
          >
            {copiedCode === game.game_code ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onNavigateGame(game.game_code)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              isMyGame
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : isFull
                ? 'bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-primary)] border border-[var(--cl-border)]'
                : 'bg-[var(--cl-primary)] hover:brightness-110 text-slate-950'
            }`}
          >
            {isMyGame ? 'Rejoin Room' : isFull ? 'Watch Match' : 'Join Match'}
          </button>
        </div>
      </div>
    </div>
  );
}
