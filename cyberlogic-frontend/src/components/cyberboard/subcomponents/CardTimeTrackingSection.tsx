import React, { useState } from "react";
import { Clock, Play, Pause, Plus, CheckCircle, Flame } from "lucide-react";

interface CardTimeTrackingSectionProps {
  cardId: number;
  initialEstimatedHours?: number;
  initialLoggedHours?: number;
}

export const CardTimeTrackingSection: React.FC<CardTimeTrackingSectionProps> = ({
  cardId: _cardId,
  initialEstimatedHours = 8,
  initialLoggedHours = 3.5,
}) => {
  const [estimatedHours, setEstimatedHours] = useState<number>(initialEstimatedHours);
  const [isEditingEstimate, setIsEditingEstimate] = useState<boolean>(false);
  const [loggedHours, setLoggedHours] = useState<number>(initialLoggedHours);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [logAmount, setLogAmount] = useState<string>("");
  const [logNote, setLogNote] = useState<string>("");
  const [timeLogs, setTimeLogs] = useState<Array<{ id: number; hours: number; note: string; date: string }>>([
    { id: 1, hours: 2, note: "Initial discovery & architecture design", date: "Today at 10:30 AM" },
    { id: 2, hours: 1.5, note: "Component refactoring & API bindings", date: "Yesterday at 4:15 PM" },
  ]);

  const progressPercent = Math.min(100, Math.round((loggedHours / (estimatedHours || 1)) * 100));

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(logAmount);
    if (isNaN(hrs) || hrs <= 0) return;

    const newLog = {
      id: Date.now(),
      hours: hrs,
      note: logNote.trim() || "Work log entry",
      date: "Just now",
    };

    setLoggedHours((prev) => prev + hrs);
    setTimeLogs((prev) => [newLog, ...prev]);
    setLogAmount("");
    setLogNote("");
  };

  return (
    <div className="space-y-5 p-4">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface-800/80 border border-border/70 flex flex-col gap-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-bold uppercase tracking-wider">
            <span>Logged Time</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-text-primary">{loggedHours}h</span>
            {isEditingEstimate ? (
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                onBlur={() => setIsEditingEstimate(false)}
                className="w-12 bg-surface-900 border border-cyan-500/50 text-cyan-400 text-xs px-1 rounded font-bold"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingEstimate(true)}
                className="text-xs text-text-muted hover:text-cyan-400 font-bold transition-colors cursor-pointer"
                title="Click to change estimated hours"
              >
                / {estimatedHours}h est.
              </button>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-800/80 border border-border/70 flex flex-col gap-1 shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-bold uppercase tracking-wider">
            <span>Progress</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-text-primary">{progressPercent}%</span>
            <span className="text-xs text-text-muted">complete</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
          <span>Time Logged vs Estimate</span>
          <span>{loggedHours}h of {estimatedHours}h ({progressPercent}%)</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-surface-800 border border-border/60 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Live Timer Control */}
      <div className="p-4 rounded-2xl bg-surface-900/90 border border-border/80 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold transition-all shadow-md cursor-pointer ${
              isTimerRunning
                ? "bg-amber-500 hover:bg-amber-600 animate-pulse"
                : "bg-cyan-500 hover:bg-cyan-600"
            }`}
          >
            {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-text-primary">
              {isTimerRunning ? "Timer Running..." : "Start Time Tracker"}
            </span>
            <span className="text-[11px] text-text-muted">
              {isTimerRunning ? "00:14:32 logged in session" : "Click play to start live tracking"}
            </span>
          </div>
        </div>

        {isTimerRunning && (
          <button
            type="button"
            onClick={() => {
              setIsTimerRunning(false);
              setLoggedHours((prev) => prev + 0.25);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        )}
      </div>

      {/* Manual Time Log Input Form */}
      <form onSubmit={handleAddLog} className="p-3.5 rounded-2xl bg-surface-800/50 border border-border/60 space-y-3">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
          Manual Time Log
        </span>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.25"
            placeholder="Hours (e.g. 1.5)"
            value={logAmount}
            onChange={(e) => setLogAmount(e.target.value)}
            className="bg-surface-900 border border-border/80 text-text-primary px-3 py-1.5 rounded-xl text-xs font-semibold focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Note / Description..."
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            className="col-span-2 bg-surface-900 border border-border/80 text-text-primary px-3 py-1.5 rounded-xl text-xs font-semibold focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!logAmount}
          className="w-full py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Time Entry</span>
        </button>
      </form>

      {/* Log History */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Time Log History ({timeLogs.length})
        </span>
        <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin pr-1">
          {timeLogs.map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-surface-900/60 border border-border/50 flex items-center justify-between text-xs">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold text-text-primary truncate">{log.note}</span>
                <span className="text-[10px] text-text-muted">{log.date}</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-surface-800 border border-border/60 text-cyan-400 font-bold text-xs flex-shrink-0">
                +{log.hours}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardTimeTrackingSection;
