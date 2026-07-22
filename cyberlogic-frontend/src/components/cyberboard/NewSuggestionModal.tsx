import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import type { CyberboardColumn } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";

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
  const [colorTag, setColorTag] = useState(COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
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

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium">
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
          placeholder="e.g., Annual Hackathon 2026, Cybersecurity Workshop"
          required
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Description & Details
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the objective, target audience, format, or preliminary requirements..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Target Dates Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Start Date
          </label>
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            End Date
          </label>
          <input
            type="date"
            value={activityEndDate}
            onChange={(e) => setActivityEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Priority & Color Tag */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Priority Level
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
            Color Accent
          </label>
          <div className="flex items-center gap-1.5 pt-1">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorTag(color)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                  colorTag === color ? "scale-125 ring-2 ring-white" : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Submit CTAs */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold hover:bg-surface-800 transition-all cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="px-5 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSubmitting ? "Submitting..." : "Submit Suggestion"}</span>
        </button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title="Suggest Activity Idea"
        initialSnap="3/4"
      >
        {formBody}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
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
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          {formBody}
        </div>
      </div>
    </div>
  );
}
