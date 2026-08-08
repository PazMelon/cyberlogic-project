import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Users, Shield, Sparkles, Calendar, Lock, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ChessTournament } from '../../utils/chessApi';

interface EditTournamentModalProps {
  isOpen: boolean;
  tournament: ChessTournament | null;
  onClose: () => void;
  onUpdate: (id: number, data: {
    title: string;
    description?: string;
    max_players: number;
    time_control: number;
    type: 'ranked' | 'casual';
    elimination_mode?: 'single' | 'double';
    enable_third_place_match?: boolean;
    start_time?: string;
  }) => Promise<void>;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  tournament,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [timeControl, setTimeControl] = useState<number>(5);
  const [type, setType] = useState<'ranked' | 'casual'>('casual');
  const [eliminationMode, setEliminationMode] = useState<'single' | 'double'>('single');
  const [enableThirdPlaceMatch, setEnableThirdPlaceMatch] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      setTitle(tournament.title || '');
      setDescription(tournament.description || '');
      setMaxPlayers(tournament.max_players || 8);
      setTimeControl(tournament.time_control || 5);
      setType(tournament.type || 'casual');
      setEliminationMode(tournament.elimination_mode || 'single');
      setEnableThirdPlaceMatch(tournament.enable_third_place_match ?? true);

      if (tournament.scheduled_at) {
        try {
          const d = new Date(tournament.scheduled_at);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
        } catch {
          setStartTime('');
        }
      } else {
        setStartTime('');
      }
    }
  }, [tournament]);

  if (!isOpen || !tournament) return null;

  const isRegistration = tournament.status === 'registration';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a tournament title.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onUpdate(tournament.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        max_players: maxPlayers,
        time_control: timeControl,
        type,
        elimination_mode: eliminationMode,
        enable_third_place_match: enableThirdPlaceMatch,
        start_time: startTime || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update tournament settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--cl-surface-950)]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--cl-border)] flex items-center justify-between bg-[var(--cl-surface-950)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--cl-primary)]/10 text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--cl-text-primary)] flex items-center gap-2">
                Edit Tournament Settings
              </h2>
              <p className="text-xs text-[var(--cl-text-muted)]">
                Update tournament configuration, scheduled start time, and format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isRegistration && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>This tournament is live or completed. Structural fields (max players, elimination mode) are locked to preserve match integrity.</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5">
              Tournament Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              placeholder="e.g. Cyberlogic Championship Cup 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5">
              Description & Rules (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Provide event overview, guidelines, prize pool, or check-in rules..."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Format Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tournament Type */}
            <div>
              <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Tournament Mode
              </label>
              <select
                value={type}
                disabled={!isRegistration}
                onChange={(e) => setType(e.target.value as 'ranked' | 'casual')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all disabled:opacity-50"
              >
                <option value="casual">🎮 Casual Arena (For All Members)</option>
                {isAdmin && <option value="ranked">🏆 Ranked Championship (Admin Only)</option>}
              </select>
            </div>

            {/* Time Control */}
            <div>
              <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Time Control per Player
              </label>
              <select
                value={timeControl}
                disabled={!isRegistration}
                onChange={(e) => setTimeControl(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all disabled:opacity-50"
              >
                <option value={1}>⚡ 1 Min (Bullet)</option>
                <option value={3}>⚡ 3 Min (Blitz)</option>
                <option value={5}>🔥 5 Min (Rapid Blitz)</option>
                <option value={10}>⏱️ 10 Min (Rapid)</option>
                <option value={15}>⏱️ 15 Min (Standard)</option>
                <option value={30}>⏳ 30 Min (Classical)</option>
              </select>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Max Player Capacity
              </label>
              <select
                value={maxPlayers}
                disabled={!isRegistration}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all disabled:opacity-50"
              >
                <option value={2}>2 Players (1v1 Final)</option>
                <option value={4}>4 Players (Semi-Finals)</option>
                <option value={8}>8 Players (Quarter-Finals)</option>
                <option value={16}>16 Players (Full Bracket)</option>
                <option value={32}>32 Players (Grand Tournament)</option>
              </select>
            </div>

            {/* Elimination Mode */}
            <div>
              <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Bracket Format
              </label>
              <select
                value={eliminationMode}
                disabled={!isRegistration}
                onChange={(e) => setEliminationMode(e.target.value as 'single' | 'double')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all disabled:opacity-50"
              >
                <option value="single">⚔️ Single Elimination (Knockout)</option>
                <option value="double">🔥 Double Elimination (Upper & Lower Brackets)</option>
              </select>
            </div>
          </div>

          {/* Scheduled Start Time */}
          <div>
            <label className="block text-xs font-bold text-[var(--cl-text-primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Scheduled Start Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={startTime}
              disabled={!isRegistration}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] focus:border-[var(--cl-primary)] focus:outline-none transition-all disabled:opacity-50"
            />
            <p className="text-[11px] text-[var(--cl-text-muted)] mt-1">
              Leave blank if the tournament starts immediately upon owner manual trigger.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--cl-border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--cl-border)] text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] text-xs font-bold hover:bg-[var(--cl-surface-800)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--cl-primary)] text-slate-950 font-black text-xs hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-[var(--cl-primary)]/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
