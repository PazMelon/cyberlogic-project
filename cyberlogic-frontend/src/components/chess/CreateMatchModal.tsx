import { Swords, Trophy, Zap } from 'lucide-react';

interface CreateMatchModalProps {
  show: boolean;
  gameType: 'ranked' | 'casual';
  timeControl: number;
  allowSpectators: boolean;
  colorPref: 'white' | 'black' | 'random';
  creating: boolean;
  onClose: () => void;
  onSetGameType: (type: 'ranked' | 'casual') => void;
  onSetTimeControl: (mins: number) => void;
  onSetAllowSpectators: (allow: boolean) => void;
  onSetColorPref: (pref: 'white' | 'black' | 'random') => void;
  onCreateGame: () => void;
}

export function CreateMatchModal({
  show,
  gameType,
  timeControl,
  allowSpectators,
  colorPref,
  creating,
  onClose,
  onSetGameType,
  onSetTimeControl,
  onSetAllowSpectators,
  onSetColorPref,
  onCreateGame,
}: CreateMatchModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-[var(--cl-text-primary)]">
        <div className="flex items-center justify-between border-b border-[var(--cl-border)] pb-3">
          <h3 className="text-lg font-bold text-[var(--cl-text-primary)] flex items-center gap-2">
            <Swords className="w-5 h-5 text-[var(--cl-primary)]" /> Create 1v1 Chess Match
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Mode Selection */}
        <div>
          <label className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider block mb-2">
            Match Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetGameType('ranked')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                gameType === 'ranked'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                  : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Ranked
              </div>
              <div className="text-[11px] text-[var(--cl-text-muted)] mt-1">Affects ELO rating & gives +3/+1 Reputation</div>
            </button>

            <button
              type="button"
              onClick={() => onSetGameType('casual')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                gameType === 'casual'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                  : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400" /> Casual
              </div>
              <div className="text-[11px] text-[var(--cl-text-muted)] mt-1">Practice match. Gives +3/+1 Reputation</div>
            </button>
          </div>
        </div>

        {/* Time Control */}
        <div>
          <label className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider block mb-2">
            Time Control (Minutes per player)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 0].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onSetTimeControl(mins)}
                className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  timeControl === mins
                    ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)] text-slate-950 font-bold'
                    : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
                }`}
              >
                {mins === 0 ? 'Untimed' : `${mins} min`}
              </button>
            ))}
          </div>
        </div>

        {/* Color Preference */}
        <div>
          <label className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider block mb-2">
            Color Choice
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['white', 'black', 'random'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSetColorPref(c)}
                className={`py-2 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                  colorPref === c
                    ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)] text-slate-950 font-bold'
                    : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Spectator Toggle Switch */}
        <div className="flex items-center justify-between p-3 bg-[var(--cl-surface-950)] rounded-xl border border-[var(--cl-border)]">
          <div>
            <div className="text-xs font-bold text-[var(--cl-text-primary)]">Allow Spectators</div>
            <div className="text-[11px] text-[var(--cl-text-muted)]">Other club members can watch match live</div>
          </div>
          <input
            type="checkbox"
            checked={allowSpectators}
            onChange={(e) => onSetAllowSpectators(e.target.checked)}
            className="w-5 h-5 accent-[var(--cl-primary)] cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-secondary)] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer border border-[var(--cl-border)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={onCreateGame}
            className="flex-1 bg-[var(--cl-primary)] hover:brightness-110 disabled:opacity-50 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
          >
            {creating ? 'Creating...' : 'Start Match'}
          </button>
        </div>
      </div>
    </div>
  );
}
