import React, { useState, useMemo } from 'react';
import { X, Trophy, Clock, Users, Shield, Sparkles, CheckCircle2, Crown, Calendar, Wrench, RefreshCw, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    start_time?: string;
  }) => Promise<void>;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [timeControl, setTimeControl] = useState<number>(5);
  const [type, setType] = useState<'ranked' | 'casual'>(isAdmin ? 'ranked' : 'casual');
  const [eliminationMode, setEliminationMode] = useState<'single' | 'double'>('single');
  const [startTime, setStartTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev Testing Sandbox state
  const [devSandbox, setDevSandbox] = useState(false);
  const [devFillDummy, setDevFillDummy] = useState(false);
  // Record<matchKey, 1 | 2> where 1 is Player A, 2 is Player B
  const [simulatedWinners, setSimulatedWinners] = useState<Record<string, 1 | 2>>({});

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
        start_time: startTime || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoundName = (roundNum: number, total: number, isDouble: boolean) => {
    if (roundNum === total && !isDouble) return '🏆 Championship Final';
    if (roundNum === total && isDouble) return '🔥 Winners Final';
    if (roundNum === total - 1) return '🔥 Semi-Finals';
    if (roundNum === total - 2) return '⚔️ Quarter-Finals';
    return `Round ${roundNum}`;
  };

  // Helper function to resolve player names dynamically in dev sandbox mode
  const getPlayerLabel = (roundNum: number, mIdx: number, slot: 1 | 2): { name: string } => {
    if (!devFillDummy) {
      if (roundNum === 1) {
        const isReal = mIdx < bracketPreviewData.numRealMatches;
        if (slot === 1) {
          return {
            name: isReal
              ? `Player ${mIdx * 2 + 1}`
              : `Player ${bracketPreviewData.numRealMatches * 2 + (mIdx - bracketPreviewData.numRealMatches) + 1}`,
          };
        }
        return {
          name: isReal ? `Player ${mIdx * 2 + 2}` : 'BYE (No Opponent)',
        };
      }
      return { name: 'Winner TBD' };
    }

    // Dev mode with dummy names
    const dummyNames = [
      'Magnus Carlsen', 'Hikaru Nakamura', 'Fabiano Caruana', 'Alireza Firouzja',
      'Gukesh D', 'Praggnanandhaa', 'Nodirbek A.', 'Ian Nepomniachtchi',
      'Ding Liren', 'Wesley So', 'Anish Giri', 'Levon Aronian',
      'Shakhriyar M.', 'Maxime V.L.', 'Vidit Gujrathi', 'Richard Rapport'
    ];

    if (roundNum === 1) {
      const isReal = mIdx < bracketPreviewData.numRealMatches;
      const idxA = mIdx * 2;
      const idxB = mIdx * 2 + 1;
      if (slot === 1) {
        return { name: dummyNames[idxA % dummyNames.length] };
      }
      return { name: isReal ? dummyNames[idxB % dummyNames.length] : 'BYE (Auto Advance)' };
    }

    // For rounds > 1, resolve winner from previous round match pair
    const prevRound = roundNum - 1;
    const prevMatchIdx = mIdx * 2 + (slot === 1 ? 0 : 1);
    const winnerChoice = simulatedWinners[`R${prevRound}_M${prevMatchIdx}`];
    if (winnerChoice) {
      return getPlayerLabel(prevRound, prevMatchIdx, winnerChoice);
    }

    return { name: `Winner of R${prevRound} M#${prevMatchIdx + 1}` };
  };

  // Helper to resolve the LOSER of a match (automatically placed into Losers Bracket)
  const getLoserLabel = (roundNum: number, mIdx: number): string => {
    const matchKey = `R${roundNum}_M${mIdx}`;
    const winnerChoice = simulatedWinners[matchKey];
    if (winnerChoice) {
      // Return the OPPOSITE slot (loser)
      const loserSlot = winnerChoice === 1 ? 2 : 1;
      return getPlayerLabel(roundNum, mIdx, loserSlot).name;
    }
    return `Loser of R${roundNum} Match #${mIdx + 1}`;
  };

  const handleToggleWinner = (matchKey: string, slot: 1 | 2) => {
    if (!devSandbox) return;
    setSimulatedWinners((prev) => ({
      ...prev,
      [matchKey]: prev[matchKey] === slot ? (slot === 1 ? 2 : 1) : slot,
    }));
  };

  // Mathematical center coordinate calculation for pixel-perfect line alignment
  const MATCH_HEIGHT = 110;
  const GAP_HEIGHT = 26;
  const UNIT_HEIGHT = MATCH_HEIGHT + GAP_HEIGHT;

  const getMatchCenterY = (r: number, m: number): number => {
    if (r === 1) {
      return m * UNIT_HEIGHT + MATCH_HEIGHT / 2;
    }
    return (getMatchCenterY(r - 1, m * 2) + getMatchCenterY(r - 1, m * 2 + 1)) / 2;
  };

  const totalTreeHeight = Math.max(300, bracketPreviewData.numMatchesRound1 * UNIT_HEIGHT);

  // Winners Bracket Champion name (for Grand Finals)
  const winnersFinalWinnerSlot = simulatedWinners[`R${bracketPreviewData.totalRounds}_M0`];
  const winnersChampionName = winnersFinalWinnerSlot
    ? getPlayerLabel(bracketPreviewData.totalRounds, 0, winnersFinalWinnerSlot).name
    : '👑 Winners Bracket Champion';

  // Dynamic Losers Bracket helper
  const totalLosersRounds = Math.max(1, 2 * (bracketPreviewData.totalRounds - 1));

  const getLosersMatchPlayerLabel = (
    lr: number,
    mIdx: number,
    slot: 1 | 2
  ): string => {
    if (lr === 1) {
      const wMatchIdx = mIdx * 2 + (slot === 1 ? 0 : 1);
      if (wMatchIdx < bracketPreviewData.numRealMatches) {
        return `🛡️ ${getLoserLabel(1, wMatchIdx)}`;
      }
      return 'BYE (Auto Advance)';
    }

    if (lr % 2 === 1) {
      const prevLr = lr - 1;
      const prevMIdx = mIdx * 2 + (slot === 1 ? 0 : 1);
      const prevChoice = simulatedWinners[`L_${prevLr}_M_${prevMIdx}`];
      if (prevChoice) {
        return getLosersMatchPlayerLabel(prevLr, prevMIdx, prevChoice);
      }
      return `Winner of L-R${prevLr} M#${prevMIdx + 1}`;
    } else {
      if (slot === 1) {
        const prevLr = lr - 1;
        const prevChoice = simulatedWinners[`L_${prevLr}_M_${mIdx}`];
        if (prevChoice) {
          return getLosersMatchPlayerLabel(prevLr, mIdx, prevChoice);
        }
        return `Winner of L-R${prevLr} M#${mIdx + 1}`;
      } else {
        const wRound = Math.floor((lr + 2) / 2);
        return `🛡️ ${getLoserLabel(wRound, mIdx)}`;
      }
    }
  };

  const losersFinalWinnerSlot = simulatedWinners[`L_${totalLosersRounds}_M_0`];
  const losersChampionName = losersFinalWinnerSlot
    ? getLosersMatchPlayerLabel(totalLosersRounds, 0, losersFinalWinnerSlot)
    : '🛡️ Losers Bracket Champion';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-6xl xl:max-w-7xl w-full p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-200 text-[var(--cl-text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--cl-border)]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--cl-primary)]/15 border border-[var(--cl-primary)]/30 flex items-center justify-center text-[var(--cl-primary-dark)] dark:text-[var(--cl-primary-light)] shadow-md shadow-[var(--cl-primary)]/10">
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold shrink-0">
            {error}
          </div>
        )}

        {/* Responsive Grid */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Controls (Sticky) */}
            <div className="md:col-span-5 lg:col-span-4 space-y-4 md:sticky md:top-0 bg-[var(--cl-surface-900)] z-10 pb-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--cl-primary-dark)] dark:text-[var(--cl-primary-light)] border-b border-[var(--cl-border)]/40 pb-1 flex items-center gap-1.5">
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
                  className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all font-medium"
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
                  className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all resize-none font-medium"
                />
              </div>

              {/* Scheduled Start Time */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Scheduled Start Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all font-bold"
                />
                <span className="text-[10px] text-[var(--cl-text-muted)] mt-1 block">Leave empty to open registration immediately</span>
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
                    className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all cursor-pointer font-bold"
                  >
                    <option value={2} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">2 Players (Finals Only)</option>
                    <option value={3} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">3 Players (1 BYE + Finals)</option>
                    <option value={4} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">4 Players (2 Rounds)</option>
                    <option value={5} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">5 Players (3 BYEs + Semis)</option>
                    <option value={6} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">6 Players (2 BYEs + Semis)</option>
                    <option value={7} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">7 Players (1 BYE + Semis)</option>
                    <option value={8} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">8 Players (3 Rounds)</option>
                    <option value={10} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">10 Players (6 BYEs + Quarters)</option>
                    <option value={12} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">12 Players (4 BYEs + Quarters)</option>
                    <option value={16} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">16 Players (4 Rounds)</option>
                    <option value={24} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">24 Players (8 BYEs + 5 Rounds)</option>
                    <option value={32} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">32 Players (5 Rounds)</option>
                  </select>
                </div>

                {/* Time Control */}
                <div>
                  <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Time Control
                  </label>
                  <select
                    value={timeControl}
                    onChange={(e) => setTimeControl(Number(e.target.value))}
                    className="w-full bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl px-3 py-2 text-xs text-[var(--cl-text-primary)] focus:outline-none focus:border-[var(--cl-primary)] transition-all cursor-pointer font-bold"
                  >
                    <option value={3} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">3 Min (Blitz)</option>
                    <option value={5} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">5 Min (Rapid)</option>
                    <option value={10} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">10 Min (Classical)</option>
                    <option value={15} className="bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]">15 Min (Long)</option>
                  </select>
                </div>
              </div>

              {/* Tournament Type */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Match Mode
                  </span>
                  {!isAdmin && (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Casual Only (Members)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => isAdmin && setType('ranked')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      !isAdmin
                        ? 'opacity-40 cursor-not-allowed bg-[var(--cl-surface-950)] border-[var(--cl-border)]/40 text-[var(--cl-text-muted)]'
                        : type === 'ranked'
                        ? 'bg-[var(--cl-primary)]/15 border-[var(--cl-primary)] text-[var(--cl-text-primary)] shadow-sm cursor-pointer'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-secondary)] hover:bg-white/5 cursor-pointer'
                    }`}
                  >
                    {!isAdmin ? <Lock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />} Ranked (ELO & Rep)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('casual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'casual'
                        ? 'bg-[var(--cl-accent)]/15 border-[var(--cl-accent)] text-[var(--cl-text-primary)] shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-secondary)] hover:bg-white/5'
                    }`}
                  >
                    Casual (Practice)
                  </button>
                </div>
              </div>

              {/* Elimination Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--cl-text-primary)] mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Elimination Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEliminationMode('single')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      eliminationMode === 'single'
                        ? 'bg-rose-500/15 border-rose-500 text-[var(--cl-text-primary)] shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-secondary)] hover:bg-white/5'
                    }`}
                  >
                    <span>⚡ Single Knockout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEliminationMode('double')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      eliminationMode === 'double'
                        ? 'bg-cyan-500/15 border-cyan-500 text-[var(--cl-text-primary)] shadow-sm'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)]/60 text-[var(--cl-text-secondary)] hover:bg-white/5'
                    }`}
                  >
                    <span>🛡️ Double Knockout</span>
                  </button>
                </div>
              </div>

              {/* 🛠️ Dev Testing Controls */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> 🛠️ Dev Sandbox Testing Controls
                  </div>
                  <button
                    type="button"
                    onClick={() => setDevSandbox(!devSandbox)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      devSandbox ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {devSandbox ? 'SANDBOX ACTIVE' : 'ENABLE TEST MODE'}
                  </button>
                </div>

                {devSandbox && (
                  <div className="space-y-2 pt-1 border-t border-purple-500/20">
                    <p className="text-[11px] text-[var(--cl-text-muted)] leading-relaxed">
                      Click any player slot to pick a winner! Losers are automatically tagged & dropped into <strong className="text-cyan-400">Losers Bracket</strong>!
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDevFillDummy(!devFillDummy)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-200 border border-purple-500/40 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3" />
                        {devFillDummy ? 'Reset Player Names' : 'Fill Grandmaster Names'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatedWinners({})}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Clear Sim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Interactive Bracket Preview */}
            <div className="md:col-span-7 lg:col-span-8 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl p-4 space-y-4 flex flex-col h-full min-h-[360px]">
              <div className="flex items-center justify-between border-b border-[var(--cl-border)]/50 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-extrabold text-[var(--cl-text-primary)] uppercase tracking-wider">
                    {eliminationMode === 'double' ? '👑 Winners Bracket Preview' : '🏆 Tournament Bracket Preview'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30">
                  {bracketPreviewData.totalRounds + (eliminationMode === 'double' ? 1 : 0)} Rounds | {bracketPreviewData.targetBracketSize} Slots
                </span>
              </div>

              {/* Bracket Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-[10px]">
                <div className="p-2.5 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]">
                  <span className="text-[var(--cl-text-secondary)] block text-[9px] font-bold">Round 1 Live Matches</span>
                  <span className="font-extrabold text-[var(--cl-primary-dark)] dark:text-[var(--cl-primary-light)] text-xs">{bracketPreviewData.numRealMatches} Live Game{bracketPreviewData.numRealMatches > 1 ? 's' : ''}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]">
                  <span className="text-[var(--cl-text-secondary)] block text-[9px] font-bold">Round 1 BYEs</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs">{bracketPreviewData.numByeMatches} Auto BYE{bracketPreviewData.numByeMatches !== 1 ? 's' : ''}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)]">
                  <span className="text-[var(--cl-text-secondary)] block text-[9px] font-bold">Round 2 Advancing</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-400 text-xs">{bracketPreviewData.numMatchesRound1} Players</span>
                </div>
              </div>

              {/* Scrollable Live Visual Bracket Preview */}
              <div className="flex-1 overflow-x-auto custom-scrollbar p-1">
                <div className="flex gap-10 min-w-max pb-2 relative" style={{ height: `${totalTreeHeight + 50}px` }}>
                  {Array.from({ length: bracketPreviewData.totalRounds }, (_, i) => i + 1).map((roundNum) => {
                    const matchesCount = bracketPreviewData.targetBracketSize / Math.pow(2, roundNum);
                    const isDouble = eliminationMode === 'double';
                    const hasNextRound = roundNum < bracketPreviewData.totalRounds;

                    return (
                      <div key={roundNum} className="w-64 sm:w-72 relative flex flex-col">
                        <div className="text-center py-1.5 px-2 rounded-lg bg-[var(--cl-surface-900)] border border-[var(--cl-border)] font-bold mb-4">
                          <span className="text-xs font-extrabold text-[var(--cl-text-primary)] block">
                            {getRoundName(roundNum, bracketPreviewData.totalRounds, isDouble)}
                          </span>
                          <span className="text-[10px] text-[var(--cl-text-secondary)] font-mono font-semibold">
                            {matchesCount} Match{matchesCount > 1 ? 'es' : ''}
                          </span>
                        </div>

                        {/* Match Cards Positioned at Exact Center Y */}
                        <div className="relative flex-1">
                          {Array.from({ length: matchesCount }, (_, mIdx) => {
                            const isRealRound1Match = roundNum === 1 && mIdx < bracketPreviewData.numRealMatches;
                            const isByeRound1Match = roundNum === 1 && mIdx >= bracketPreviewData.numRealMatches;
                            const centerY = getMatchCenterY(roundNum, mIdx);

                            const playerA = getPlayerLabel(roundNum, mIdx, 1);
                            const playerB = getPlayerLabel(roundNum, mIdx, 2);

                            const matchKey = `R${roundNum}_M${mIdx}`;
                            const chosenWinner = simulatedWinners[matchKey];

                            return (
                              <div
                                key={mIdx}
                                style={{ top: `${centerY - MATCH_HEIGHT / 2}px`, height: `${MATCH_HEIGHT}px` }}
                                className={`absolute w-full bg-[var(--cl-surface-900)] border rounded-xl p-3 space-y-2 shadow-sm z-10 ${
                                  isRealRound1Match ? 'border-[var(--cl-primary)]' : 'border-[var(--cl-border)]'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono mb-1 font-bold">
                                  <span className="text-[var(--cl-text-secondary)]">Match #{mIdx + 1}</span>
                                  {devSandbox && <span className="text-purple-400 text-[9px] font-mono">DEV CLICK TO WIN</span>}
                                  {!devSandbox && isRealRound1Match && <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">LIVE MATCH</span>}
                                  {!devSandbox && isByeRound1Match && <span className="text-amber-700 dark:text-amber-400 font-extrabold">BYE ADVANCE</span>}
                                  {!devSandbox && roundNum > 1 && <span className="text-[var(--cl-text-muted)] font-semibold">WAITING</span>}
                                </div>

                                {/* Player A Slot */}
                                <div
                                  onClick={() => handleToggleWinner(matchKey, 1)}
                                  className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                                    devSandbox ? 'cursor-pointer hover:border-purple-400' : ''
                                  } ${
                                    chosenWinner === 1
                                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 font-extrabold'
                                      : isByeRound1Match
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                      : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] border border-[var(--cl-border)]/40'
                                  }`}
                                >
                                  <span className="truncate">{playerA.name}</span>
                                  {chosenWinner === 1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                  {!chosenWinner && isByeRound1Match && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                                </div>

                                {/* Player B Slot */}
                                <div
                                  onClick={() => handleToggleWinner(matchKey, 2)}
                                  className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                                    devSandbox ? 'cursor-pointer hover:border-purple-400' : ''
                                  } ${
                                    chosenWinner === 2
                                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 font-extrabold'
                                      : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] border border-[var(--cl-border)]/40'
                                  }`}
                                >
                                  <span className="truncate">{playerB.name}</span>
                                  {chosenWinner === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                </div>
                              </div>
                            );
                          })}

                          {/* 100% Mathematically Exact SVG Connectors for Pairs */}
                          {hasNextRound && matchesCount >= 2 && (
                            <svg className="absolute -right-10 top-0 w-10 h-full pointer-events-none text-[var(--cl-primary)] overflow-visible z-0">
                              {Array.from({ length: matchesCount / 2 }, (_, pIdx) => {
                                const y1 = getMatchCenterY(roundNum, pIdx * 2);
                                const y2 = getMatchCenterY(roundNum, pIdx * 2 + 1);
                                const yMid = (y1 + y2) / 2;

                                return (
                                  <g key={pIdx}>
                                    <line x1="0" y1={y1} x2="20" y2={y1} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="0" y1={y2} x2="20" y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="20" y1={y1} x2="20" y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="20" y1={yMid} x2="40" y2={yMid} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </g>
                                );
                              })}
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Ultimate Column: 🏆 Grand Finals (for Double Elimination) */}
                  {eliminationMode === 'double' && (
                    <div className="w-64 sm:w-72 relative flex flex-col">
                      <div className="text-center py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 font-bold mb-4">
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 block flex items-center justify-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-500" /> 🏆 Grand Finals
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                          Ultimate Championship
                        </span>
                      </div>

                      <div className="relative flex-1">
                        <div
                          style={{ top: `${getMatchCenterY(bracketPreviewData.totalRounds, 0) - 60}px` }}
                          className="absolute w-full bg-[var(--cl-surface-900)] border-2 border-amber-500/60 rounded-xl p-3.5 space-y-2.5 shadow-xl bg-gradient-to-b from-[var(--cl-surface-900)] via-amber-500/10 to-[var(--cl-surface-900)] z-10"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                            <span>ULTIMATE FINALE</span>
                            <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">DOUBLE ELIM</span>
                          </div>
                          <div className="p-2.5 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 flex items-center justify-between">
                            <span className="truncate">👑 {winnersChampionName}</span>
                            <span className="text-[10px] font-mono shrink-0">1st Seed</span>
                          </div>
                          <div className="p-2.5 rounded-lg text-xs font-extrabold bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border border-cyan-500/40 flex items-center justify-between">
                            <span className="truncate">🛡️ {losersChampionName}</span>
                            <span className="text-[10px] font-mono shrink-0">2nd Seed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Double Elimination: Dedicated Dynamic Losers Bracket Preview */}
              {eliminationMode === 'double' && (
                <div className="mt-4 pt-4 border-t border-cyan-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-extrabold text-[var(--cl-text-primary)] uppercase tracking-wider">
                        🛡️ Losers Bracket Preview ({totalLosersRounds} Rounds)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded border border-cyan-500/30">
                      Auto Loser Drop Simulation
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar p-1">
                    {(() => {
                      const numL1Slots = Math.max(1, Math.pow(2, Math.max(0, bracketPreviewData.totalRounds - 2)));
                      const losersTreeHeight = Math.max(200, numL1Slots * UNIT_HEIGHT);

                      const getModalLosersSlotCenterY = (lr: number, sIdx: number): number => {
                        if (lr === 1 || lr === 2) {
                          return sIdx * UNIT_HEIGHT + MATCH_HEIGHT / 2;
                        }
                        if (lr % 2 === 1) {
                          return (getModalLosersSlotCenterY(lr - 1, sIdx * 2) + getModalLosersSlotCenterY(lr - 1, sIdx * 2 + 1)) / 2;
                        }
                        return getModalLosersSlotCenterY(lr - 1, sIdx);
                      };

                      return (
                        <div className="flex gap-10 min-w-max pb-2 relative" style={{ height: `${losersTreeHeight + 50}px` }}>
                          {Array.from({ length: totalLosersRounds }, (_, i) => i + 1).map((lr) => {
                            const k = Math.floor((lr + 1) / 2);
                            const expectedSlots = Math.max(1, Math.pow(2, Math.max(0, bracketPreviewData.totalRounds - 1 - k)));
                            const isLosersFinal = lr === totalLosersRounds;
                            const hasNextRound = lr < totalLosersRounds;

                            return (
                              <div key={`modal-losers-${lr}`} className="w-64 sm:w-72 relative flex flex-col">
                                <div className="text-center py-1.5 px-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[var(--cl-text-primary)] font-bold z-10 mb-4">
                                  <span className="text-xs font-extrabold block">
                                    {isLosersFinal ? '🏆 Losers Final' : `Losers Round ${lr}`}
                                  </span>
                                  <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono font-semibold">
                                    {expectedSlots} Match{expectedSlots > 1 ? 'es' : ''}
                                  </span>
                                </div>

                                <div className="relative flex-1">
                                  {Array.from({ length: expectedSlots }, (_, mIdx) => {
                                    const matchKey = `L_${lr}_M_${mIdx}`;
                                    const chosenWinner = simulatedWinners[matchKey];
                                    const centerY = getModalLosersSlotCenterY(lr, mIdx);

                                    const player1Name = getLosersMatchPlayerLabel(lr, mIdx, 1);
                                    const player2Name = getLosersMatchPlayerLabel(lr, mIdx, 2);

                                    return (
                                      <div
                                        key={mIdx}
                                        style={{ top: `${centerY - MATCH_HEIGHT / 2}px`, height: `${MATCH_HEIGHT}px` }}
                                        className="absolute w-full bg-[var(--cl-surface-900)] border border-cyan-500/40 rounded-xl p-3 space-y-2 shadow-sm z-10"
                                      >
                                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300">
                                          <span>Match #{mIdx + 1}</span>
                                          <span>{isLosersFinal ? 'LOSERS FINALS' : 'LOSERS MATCH'}</span>
                                        </div>

                                        {/* Slot 1 */}
                                        <div
                                          onClick={() => handleToggleWinner(matchKey, 1)}
                                          className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                                            devSandbox ? 'cursor-pointer hover:border-purple-400' : ''
                                          } ${
                                            chosenWinner === 1
                                              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 font-extrabold'
                                              : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] border border-[var(--cl-border)]/40'
                                          }`}
                                        >
                                          <span className="truncate">{player1Name}</span>
                                          {chosenWinner === 1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                        </div>

                                        {/* Slot 2 */}
                                        <div
                                          onClick={() => handleToggleWinner(matchKey, 2)}
                                          className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                                            devSandbox ? 'cursor-pointer hover:border-purple-400' : ''
                                          } ${
                                            chosenWinner === 2
                                              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 font-extrabold'
                                              : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] border border-[var(--cl-border)]/40'
                                          }`}
                                        >
                                          <span className="truncate">{player2Name}</span>
                                          {chosenWinner === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* SVG Connector Lines */}
                                  {hasNextRound && (
                                    <svg className="absolute -right-10 top-0 w-10 h-full pointer-events-none text-[var(--cl-primary)] overflow-visible z-0">
                                      {lr % 2 === 1 ? (
                                        Array.from({ length: expectedSlots }, (_, sIdx) => {
                                          const y = getModalLosersSlotCenterY(lr, sIdx);
                                          return (
                                            <line
                                              key={`ml-conn-${sIdx}`}
                                              x1="0" y1={y} x2="40" y2={y}
                                              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            />
                                          );
                                        })
                                      ) : (
                                        Array.from({ length: Math.floor(expectedSlots / 2) }, (_, pIdx) => {
                                          const y1 = getModalLosersSlotCenterY(lr, pIdx * 2);
                                          const y2 = getModalLosersSlotCenterY(lr, pIdx * 2 + 1);
                                          const yMid = (y1 + y2) / 2;

                                          return (
                                            <g key={`ml-merge-${pIdx}`}>
                                              <line x1="0" y1={y1} x2="20" y2={y1} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                              <line x1="0" y1={y2} x2="20" y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                              <line x1="20" y1={y1} x2="20" y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                              <line x1="20" y1={yMid} x2="40" y2={yMid} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </g>
                                          );
                                        })
                                      )}
                                    </svg>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="sticky bottom-0 bg-[var(--cl-surface-900)] pt-3 pb-1 border-t border-[var(--cl-border)]/60 flex items-center justify-end gap-3 shrink-0 z-30 shadow-lg">
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
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[var(--cl-primary)] to-[var(--cl-primary-light)] text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-[var(--cl-primary)]/20 disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5"
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
