import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import type { CyberboardColumn } from "../../utils/api";

interface NewSuggestionModalProps {
  boardId: number;
  columns: CyberboardColumn[];
  defaultColumnId?: number;
  onClose: () => void;
  onSubmit: (data: {
    column_id?: number;
    title: string;
    description?: string;
    activity_date?: string;
    activity_end_date?: string;
    priority?: "low" | "medium" | "high";
    color_tag?: string;
  }) => Promise<void>;
}

const COLOR_PRESETS = [
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#ef4444", // Red
];

export default function NewSuggestionModal({
  columns,
  defaultColumnId,
  onClose,
  onSubmit,
}: NewSuggestionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState<number | undefined>(
    defaultColumnId || columns[0]?.id
  );
  const [activityDate, setActivityDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [colorTag, setColorTag] = useState<string>("#06b6d4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for your suggestion.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        column_id: columnId,
        title: title.trim(),
        description: description.trim() || undefined,
        activity_date: activityDate || undefined,
        activity_end_date: activityEndDate || undefined,
        priority,
        color_tag: colorTag,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit suggestion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Submit Activity Suggestion
              </h2>
              <p className="text-xs text-text-muted">
                Propose an activity or project idea for the club
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error">
              {error}
            </div>
          )}

          {/* Target Column */}
          {columns.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Board Stage / Column
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.icon} {col.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Activity Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Activity Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Capture The Flag Boot Camp"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Proposal / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the activity plan, goals, target audience, and required setup..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Planned Date
              </label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={activityEndDate}
                min={activityDate}
                onChange={(e) => setActivityEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                    priority === p
                      ? p === "high"
                        ? "bg-error/20 border-error text-error"
                        : p === "medium"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-surface-800 border-border text-text-muted hover:bg-surface-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Color Tag Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Color Tag
            </label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColorTag(hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    colorTag === hex ? "border-white scale-110 shadow-md" : "border-transparent"
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Submitting..." : "Submit Suggestion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
