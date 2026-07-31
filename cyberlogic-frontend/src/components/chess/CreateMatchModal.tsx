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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-[var(--cl-text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--cl-border)]/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--cl-primary)]/15 border border-[var(--cl-primary)]/30 flex items-center justify-center text-[var(--cl-primary-dark)] dark:text-[var(--cl-primary-light)]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--cl-text-primary)] flex items-center gap-2">
                Create 1v1 Chess Match
              </h3>
              <p className="text-xs text-[var(--cl-text-muted)]">Set up game parameters & time controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-white/5 transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Mode Selection */}
        <div>
          <label className="text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider block mb-2">
            Match Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetGameType('ranked')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                gameType === 'ranked'
                  ? 'bg-[var(--cl-primary)]/15 border-[var(--cl-primary)] text-[var(--cl-text-primary)] font-bold shadow-sm'
                  : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-secondary)] hover:bg-white/5'
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-1.5 text-[var(--cl-text-primary)]">
                <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ranked
              </div>
              <div className="text-[11px] text-[var(--cl-text-muted)] mt-1">Affects ELO rating & gives +3/+1 Rep</div>
            </button>

            <button
              type="button"
              onClick={() => onSetGameType('casual')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                gameType === 'casual'
                  ? 'bg-[var(--cl-accent)]/15 border-[var(--cl-accent)] text-[var(--cl-text-primary)] font-bold shadow-sm'
                  : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-secondary)] hover:bg-white/5'
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-1.5 text-[var(--cl-text-primary)]">
                <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" /> Casual
              </div>
              <div className="text-[11px] text-[var(--cl-text-muted)] mt-1">Practice match. Gives +3/+1 Rep</div>
            </button>
          </div>
        </div>

        {/* Time Control */}
        <div>
          <label className="text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider block mb-2">
            Time Control (Minutes per player)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 0].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onSetTimeControl(mins)}
                className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  timeControl === mins
                    ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)] text-slate-950 dark:text-slate-950 font-black shadow-md shadow-[var(--cl-primary)]/20'
                    : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-primary)] hover:border-[var(--cl-primary)]/40 hover:bg-white/5'
                }`}
              >
                {mins === 0 ? 'Untimed' : `${mins} min`}
              </button>
            ))}
          </div>
        </div>

        {/* Color Preference */}
        <div>
          <label className="text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider block mb-2">
            Color Choice
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['white', 'black', 'random'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSetColorPref(c)}
                className={`py-2 rounded-xl border text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  colorPref === c
                    ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)] text-slate-950 dark:text-slate-950 font-black shadow-md shadow-[var(--cl-primary)]/20'
                    : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-primary)] hover:border-[var(--cl-primary)]/40 hover:bg-white/5'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Spectator Toggle Switch */}
        <div className="flex items-center justify-between p-3 bg-[var(--cl-surface-950)] rounded-xl border border-[var(--cl-border)]/60">
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
            className="flex-1 bg-[var(--cl-surface-950)] hover:bg-white/5 text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer border border-[var(--cl-border)]/60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={onCreateGame}
            className="flex-1 bg-gradient-to-r from-[var(--cl-primary)] to-[var(--cl-primary-light)] text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-[var(--cl-primary)]/20 hover:brightness-110 active:scale-98 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Start Match'}
          </button>
        </div>
      </div>
    </div>
  );
}
