import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, FileText, Layers, Calendar, Tag, AlertCircle } from "lucide-react";
import type { CyberboardCard, CyberboardColumn } from "../../../utils/api";
import SearchableTaskPicker from "../SearchableTaskPicker";

type QuickCreateType = "task" | "milestone" | "subtask";

interface GanttQuickCreateModalProps {
  type: QuickCreateType;
  phase: string;
  startDate: string;
  endDate: string;
  columns: CyberboardColumn[];
  allCards: CyberboardCard[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    phase?: string;
    activity_date?: string;
    activity_end_date?: string;
    is_milestone?: boolean;
    priority?: "low" | "medium" | "high";
    parent_id?: number | null;
    column_id?: number;
  }) => Promise<void>;
}

const TYPE_META: Record<QuickCreateType, { icon: React.ReactNode; label: string; accent: string }> = {
  task: {
    icon: <FileText className="w-5 h-5" />,
    label: "New Task",
    accent: "text-primary border-primary/40 bg-primary/10",
  },
  milestone: {
    icon: <span className="text-lg font-black leading-none">◆</span>,
    label: "New Milestone",
    accent: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  },
  subtask: {
    icon: <Layers className="w-5 h-5" />,
    label: "New Sub-Task",
    accent: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  },
};

const PRIORITY_OPTIONS: Array<{ value: "low" | "medium" | "high"; label: string; color: string }> = [
  { value: "low", label: "Low", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  { value: "medium", label: "Medium", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { value: "high", label: "High", color: "bg-rose-500/20 text-rose-400 border-rose-500/40" },
];

export default function GanttQuickCreateModal({
  type,
  phase,
  startDate,
  endDate,
  columns,
  allCards,
  onClose,
  onSubmit,
}: GanttQuickCreateModalProps) {
  const meta = TYPE_META[type];
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(startDate || "");
  const [activityEndDate, setActivityEndDate] = useState(() => {
    if (type === "milestone") return startDate || "";
    return endDate || "";
  });
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [columnId, setColumnId] = useState<number>(columns[0]?.id || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableParentCards = useMemo(() => {
    const topLevelCards = allCards.filter((c) => !c.parent_id && !c.is_archived);
    if (!phase) return topLevelCards;
    const phaseMatch = topLevelCards.filter(
      (c) => (c.phase || "").trim().toLowerCase() === phase.trim().toLowerCase()
    );
    return phaseMatch.length > 0 ? phaseMatch : topLevelCards;
  }, [allCards, phase]);

  const [parentId, setParentId] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }

    if (type === "subtask" && !parentId) {
      setError("Please select a parent task for the sub-task.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Parameters<typeof onSubmit>[0] = {
        title: trimmed,
        phase: phase || undefined,
        activity_date: activityDate || undefined,
        activity_end_date: type === "milestone" ? activityDate || undefined : activityEndDate || undefined,
        column_id: columnId || columns[0]?.id,
      };

      if (type === "milestone") {
        payload.is_milestone = true;
      }

      if (type !== "milestone") {
        payload.priority = priority;
      }

      if (type === "subtask" && parentId) {
        payload.parent_id = parentId;
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface-900 border border-border rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 rounded-t-3xl bg-surface-900">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${meta.accent}`}>
              {meta.icon}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">{meta.label}</h3>
              {phase && (
                <span className="text-[10px] font-semibold text-text-muted">
                  in <span className="text-primary font-bold">{phase}</span>
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
              {type === "milestone" ? "Milestone Name" : "Task Title"} <span className="text-rose-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) handleSubmit(); }}
              placeholder={type === "milestone" ? "e.g. Sprint 2 Release Gate" : "e.g. Implement user authentication"}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border/80 text-text-primary text-sm font-medium placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Date Fields */}
          <div className={`grid gap-3 ${type === "milestone" ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1 text-primary" />
                {type === "milestone" ? "Milestone Date" : "Start Date"}
              </label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => {
                  setActivityDate(e.target.value);
                  if (type === "milestone") setActivityEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border/80 text-text-primary text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer"
              />
            </div>
            {type !== "milestone" && (
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1 text-primary" />
                  End Date
                </label>
                <input
                  type="date"
                  value={activityEndDate}
                  onChange={(e) => setActivityEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border/80 text-text-primary text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Priority (task & subtask only) */}
          {type !== "milestone" && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                <Tag className="w-3 h-3 inline mr-1 text-primary" />
                Priority
              </label>
              <div className="flex items-center gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      priority === opt.value
                        ? opt.color + " shadow-sm"
                        : "bg-surface-800/60 text-text-muted border-border/40 hover:bg-surface-700/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column Selector */}
          {columns.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Column / Stage
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border/80 text-text-primary text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer appearance-none"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Task Picker (subtask only) */}
          {type === "subtask" && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                <Layers className="w-3 h-3 inline mr-1 text-cyan-400" />
                Parent Task
              </label>
              <SearchableTaskPicker
                cards={availableParentCards}
                value={parentId}
                onChange={(val) => setParentId(typeof val === "number" ? val : null)}
                placeholder="Search for parent task in phase..."
                emptyLabel="Select Parent Task (Required)"
                dropUp={true}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border/80 text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || (type === "subtask" && !parentId)}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              type === "milestone"
                ? "bg-amber-500 text-surface-950 hover:bg-amber-400 shadow-amber-500/20"
                : "bg-primary text-surface-950 hover:bg-primary-light shadow-primary/20"
            }`}
          >
            {isSubmitting ? (
              <span className="w-3.5 h-3.5 border-2 border-surface-950/40 border-t-surface-950 rounded-full animate-spin" />
            ) : (
              meta.icon
            )}
            <span>Create {type === "task" ? "Task" : type === "milestone" ? "Milestone" : "Sub-Task"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
