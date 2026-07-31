import React, { useState, useMemo } from 'react';
import { X, Trophy, Clock, Users, Shield, Sparkles, Eye, CheckCircle2 } from 'lucide-react';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    max_players: number;
    time_control: number;
    type: 'ranked' | 'casual';
    elimination_mode?: 'single' | 'double';
  }) => Promise<void>;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [timeControl, setTimeControl] = useState<number>(5);
  const [type, setType] = useState<'ranked' | 'casual'>('ranked');
  const [eliminationMode, setEliminationMode] = useState<'single' | 'double'>('single');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic bracket math preview
  const bracketPreviewData = useMemo(() => {
    const n = Math.max(2, Math.min(32, maxPlayers));
    const targetBracketSize = Math.pow(2, Math.max(1, Math.ceil(Math.log2(n))));
    const totalRounds = Math.log2(targetBracketSize);
    const numMatchesRound1 = targetBracketSize / 2;
    const numRealMatches = n - numMatchesRound1;
    const numByeMatches = targetBracketSize - n;

    return {
      n,
      targetBracketSize,
      totalRounds,
      numMatchesRound1,
      numRealMatches,
      numByeMatches,
    };
  }, [maxPlayers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a tournament title.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        max_players: maxPlayers,
        time_control: timeControl,
        type,
        elimination_mode: eliminationMode,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoundName = (roundNum: number, total: number) => {
    if (roundNum === total) return 'Championship';
    if (roundNum === total - 1) return 'Semi-Finals';
    if (roundNum === total - 2) return 'Quarter-Finals';
    return `Round ${roundNum}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-6xl xl:max-w-7xl w-full p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--cl-border)]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Trophy className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--cl-text-primary)] flex items-center gap-2">
                Create Chess Tournament
              </h2>
              <p className="text-xs text-[var(--cl-text-muted)]">Configure settings & live bracket preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold shrink-0">
            {error}
          </div>
        )}

        {/* Responsive Grid (Stacked on Mobile, 2 Columns on Tablet/Desktop) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Controls (4 Cols on LG) */}
            <div className="md:col-span-5 lg:col-span-4 space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 border-b border-[var(--cl-border)]/40 pb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Tournament Settings
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider">
                  Tournament Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberlogic Championship 2026"
                  className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-muted)] mb-1 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief details or prize info..."
                  rows={2}
                  className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Max Players */}
                <div>
                  <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[var(--cl-primary)]" /> Max Players
                  </label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all cursor-pointer font-medium"
                  >
                    <option value={2}>2 Players (Finals Only)</option>
                    <option value={3}>3 Players (1 BYE + Finals)</option>
                    <option value={4}>4 Players (2 Rounds)</option>
                    <option value={5}>5 Players (3 BYEs + Semis)</option>
                    <option value={6}>6 Players (2 BYEs + Semis)</option>
                    <option value={7}>7 Players (1 BYE + Semis)</option>
                    <option value={8}>8 Players (3 Rounds)</option>
                    <option value={10}>10 Players (6 BYEs + Quarters)</option>
                    <option value={12}>12 Players (4 BYEs + Quarters)</option>
                    <option value={16}>16 Players (4 Rounds)</option>
                    <option value={24}>24 Players (8 BYEs + 5 Rounds)</option>
                    <option value={32}>32 Players (5 Rounds)</option>
                  </select>
                </div>

                {/* Time Control */}
                <div>
                  <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Time Control
                  </label>
                  <select
                    value={timeControl}
                    onChange={(e) => setTimeControl(Number(e.target.value))}
                    className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all cursor-pointer font-medium"
                  >
                    <option value={3}>3 Min (Blitz)</option>
                    <option value={5}>5 Min (Rapid)</option>
                    <option value={10}>10 Min (Classical)</option>
                    <option value={15}>15 Min (Long)</option>
                  </select>
                </div>
              </div>

              {/* Tournament Type */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> Match Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('ranked')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'ranked'
                        ? 'bg-[var(--cl-primary)]/15 border-[var(--cl-primary)]/40 text-[var(--cl-primary-light)] shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-muted)] hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ranked (ELO & Rep)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('casual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'casual'
                        ? 'bg-slate-500/15 border-slate-500/40 text-slate-200 shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-muted)] hover:bg-white/5'
                    }`}
                  >
                    Casual (Practice)
                  </button>
                </div>
              </div>

              {/* Elimination Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-rose-400" /> Elimination Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEliminationMode('single')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      eliminationMode === 'single'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-muted)] hover:bg-white/5'
                    }`}
                  >
                    <span>⚡ Single Knockout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEliminationMode('double')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      eliminationMode === 'double'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-muted)] hover:bg-white/5'
                    }`}
                  >
                    <span>🛡️ Double Knockout</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Info Notice */}
              <div className="p-3 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/70 text-[11px] text-[var(--cl-text-muted)] space-y-1">
                <div className="font-bold text-[var(--cl-text-primary)] flex items-center gap-1 text-xs">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Dynamic Bracket Pairing
                </div>
                <p className="leading-relaxed">
                  When starting, players are randomly seeded. Odd or un-bracketed player counts automatically grant random <strong className="text-emerald-400">BYE advancements</strong> to Round 2!
                </p>
              </div>
            </div>

            {/* Right Column: Live Interactive Bracket Preview (8 Cols on LG) */}
            <div className="md:col-span-7 lg:col-span-8 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl p-4 space-y-4 flex flex-col h-full min-h-[360px]">
              <div className="flex items-center justify-between border-b border-[var(--cl-border)]/50 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold text-[var(--cl-text-primary)] uppercase tracking-wider">
                    Live Bracket Structure Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {bracketPreviewData.totalRounds} Rounds | {bracketPreviewData.targetBracketSize} Slots
                </span>
              </div>

              {/* Bracket Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-[10px]">
                <div className="p-2.5 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60">
                  <span className="text-[var(--cl-text-muted)] block text-[9px]">Round 1 Live Matches</span>
                  <span className="font-bold text-[var(--cl-primary-light)] text-xs">{bracketPreviewData.numRealMatches} Live Game{bracketPreviewData.numRealMatches > 1 ? 's' : ''}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60">
                  <span className="text-[var(--cl-text-muted)] block text-[9px]">Round 1 BYEs</span>
                  <span className="font-bold text-emerald-400 text-xs">{bracketPreviewData.numByeMatches} Auto BYE{bracketPreviewData.numByeMatches !== 1 ? 's' : ''}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60">
                  <span className="text-[var(--cl-text-muted)] block text-[9px]">Round 2 Advancing</span>
                  <span className="font-bold text-amber-400 text-xs">{bracketPreviewData.numMatchesRound1} Players</span>
                </div>
              </div>

              {/* Scrollable Live Visual Bracket Preview */}
              <div className="flex-1 overflow-x-auto custom-scrollbar p-1">
                <div className="flex gap-5 min-w-max items-stretch pb-2">
                  {Array.from({ length: bracketPreviewData.totalRounds }, (_, i) => i + 1).map((roundNum) => {
                    const matchesCount = bracketPreviewData.targetBracketSize / Math.pow(2, roundNum);
                    const isFinal = roundNum === bracketPreviewData.totalRounds;

                    return (
                      <div key={roundNum} className="w-64 sm:w-72 flex flex-col justify-around space-y-4">
                        <div className="text-center py-1.5 px-2 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60">
                          <span className="text-[10px] font-bold text-[var(--cl-text-primary)] block">
                            {getRoundName(roundNum, bracketPreviewData.totalRounds)}
                          </span>
                          <span className="text-[9px] text-[var(--cl-text-muted)] font-mono">
                            {matchesCount} Match{matchesCount > 1 ? 'es' : ''}
                          </span>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col justify-around">
                          {Array.from({ length: matchesCount }, (_, mIdx) => {
                            const isRealRound1Match = roundNum === 1 && mIdx < bracketPreviewData.numRealMatches;
                            const isByeRound1Match = roundNum === 1 && mIdx >= bracketPreviewData.numRealMatches;

                            return (
                              <div
                                key={mIdx}
                                className={`bg-[var(--cl-surface-900)] border rounded-xl p-2.5 space-y-1.5 ${
                                  isFinal
                                    ? 'border-amber-500/40 bg-gradient-to-b from-[var(--cl-surface-900)] to-amber-950/20 shadow-md'
                                    : isRealRound1Match
                                    ? 'border-[var(--cl-primary)]/40'
                                    : 'border-[var(--cl-border)]/60 opacity-90'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] text-[var(--cl-text-muted)] font-mono mb-1">
                                  <span>Match #{mIdx + 1}</span>
                                  {isRealRound1Match && <span className="text-emerald-400 font-bold">LIVE MATCH</span>}
                                  {isByeRound1Match && <span className="text-amber-400 font-bold">BYE ADVANCE</span>}
                                  {roundNum > 1 && <span className="text-slate-400">WAITING</span>}
                                </div>

                                {/* Player A Slot */}
                                <div className={`p-1.5 rounded text-[10px] flex items-center justify-between ${
                                  isByeRound1Match ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20' : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)]'
                                }`}>
                                  <span className="truncate">
                                    {roundNum === 1
                                      ? isRealRound1Match
                                        ? `Player ${mIdx * 2 + 1}`
                                        : `Player ${bracketPreviewData.numRealMatches * 2 + (mIdx - bracketPreviewData.numRealMatches) + 1}`
                                      : 'Winner TBD'}
                                  </span>
                                  {isByeRound1Match && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                                </div>

                                {/* Player B Slot */}
                                <div className="p-1.5 rounded text-[10px] bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] flex items-center justify-between">
                                  <span className="truncate">
                                    {roundNum === 1
                                      ? isRealRound1Match
                                        ? `Player ${mIdx * 2 + 2}`
                                        : 'BYE (No Opponent)'
                                      : 'Winner TBD'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* End of Round Matches */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Double Elimination: Losers Bracket & Grand Finals Preview */}
              {eliminationMode === 'double' && (
                <div className="mt-4 pt-4 border-t border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                        🛡️ Losers Bracket & Grand Finals Preview
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      2nd Chance Bracket (2 Losses to Eliminate)
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar p-1">
                    <div className="flex gap-5 min-w-max items-stretch pb-1">
                      {/* Losers Round 1 */}
                      <div className="w-64 sm:w-72 space-y-2">
                        <div className="text-center py-1 px-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                          Losers Round 1
                        </div>
                        <div className="bg-[var(--cl-surface-900)] border border-cyan-500/30 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] text-cyan-400 font-mono">
                            <span>Match #L1</span>
                            <span>LOSERS PAIRING</span>
                          </div>
                          <div className="p-1.5 rounded text-[10px] bg-[var(--cl-surface-950)] text-cyan-200">
                            Round 1 Loser #1
                          </div>
                          <div className="p-1.5 rounded text-[10px] bg-[var(--cl-surface-950)] text-cyan-200">
                            Round 1 Loser #2
                          </div>
                        </div>
                      </div>

                      {/* Losers Finals */}
                      <div className="w-64 sm:w-72 space-y-2">
                        <div className="text-center py-1 px-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                          Losers Finals
                        </div>
                        <div className="bg-[var(--cl-surface-900)] border border-cyan-500/30 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] text-cyan-400 font-mono">
                            <span>Match #L-Final</span>
                            <span>LOSERS CHAMPIONSHIP</span>
                          </div>
                          <div className="p-1.5 rounded text-[10px] bg-[var(--cl-surface-950)] text-cyan-200">
                            Winner of Losers Round 1
                          </div>
                          <div className="p-1.5 rounded text-[10px] bg-[var(--cl-surface-950)] text-cyan-200">
                            Winners Bracket Runner-up
                          </div>
                        </div>
                      </div>

                      {/* Grand Finals */}
                      <div className="w-64 sm:w-72 space-y-2">
                        <div className="text-center py-1 px-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                          🏆 Grand Finals
                        </div>
                        <div className="bg-gradient-to-b from-[var(--cl-surface-900)] to-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 space-y-1.5 shadow-md">
                          <div className="flex items-center justify-between text-[9px] text-amber-400 font-mono font-bold">
                            <span>GRAND CHAMPIONSHIP</span>
                            <span>DOUBLE ELIM</span>
                          </div>
                          <div className="p-1.5 rounded text-[10px] bg-amber-500/10 text-amber-200 font-bold border border-amber-500/20">
                            👑 Winners Bracket Champion
                          </div>
                          <div className="p-1.5 rounded text-[10px] bg-cyan-500/10 text-cyan-200 font-bold border border-cyan-500/20">
                            🛡️ Losers Bracket Champion
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[var(--cl-border)]/60 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
