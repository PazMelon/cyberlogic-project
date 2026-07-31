import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import type { CyberboardColumn } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";
import MentionTextArea from "../ui/MentionTextArea";

interface NewSuggestionModalProps {
  boardId: number;
  columns: CyberboardColumn[];
  boardType?: string;
  defaultColumnId?: number;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  isAdmin?: boolean;
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
  boardType = "activity",
  defaultColumnId,
  currentUserId,
  userRole,
  boardHostId,
  isAdmin,
  onClose,
  onSubmit,
}: NewSuggestionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isColumnAllowed = (col: CyberboardColumn) => {
    const isHost = boardHostId && currentUserId ? boardHostId === currentUserId : false;
    if (isHost || isAdmin) return true;
    const allowedRoles = col.allowed_roles || [];
    const allowedUsers = col.allowed_users || [];
    if (allowedRoles.length === 0 && allowedUsers.length === 0) return true;
    const roleMatch = allowedRoles.length > 0 && userRole && allowedRoles.includes(userRole);
    const userMatch = allowedUsers.length > 0 && currentUserId && allowedUsers.includes(currentUserId);
    return Boolean(roleMatch || userMatch);
  };

  const allowedColumns = columns.filter(isColumnAllowed);

  const initialColumnId = () => {
    if (defaultColumnId && allowedColumns.some((col) => col.id === defaultColumnId)) {
      return defaultColumnId;
    }
    return allowedColumns[0]?.id || columns[0]?.id;
  };

  const [columnId, setColumnId] = useState<number | undefined>(initialColumnId);
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

  // Board Type labels helper
  const isDateVisible = boardType === "activity" || boardType === "roadmap";

  const getFormCopy = () => {
    switch (boardType) {
      case "ideas":
        return {
          modalTitle: "Submit New Idea",
          subtitle: "Post a new suggestion or feature idea to the board",
          titleLabel: "Idea Title",
          titlePlaceholder: "e.g. Add dark mode toggle, Mobile app notifications",
          descLabel: "Description & Concept Details",
          descPlaceholder: "Describe your idea, benefits, and implementation thoughts...",
          submitButton: "Submit Idea",
        };
      case "brainstorming":
        return {
          modalTitle: "Add Brainstorming Topic",
          subtitle: "Propose a concept or topic for team discussion",
          titleLabel: "Topic / Concept Title",
          titlePlaceholder: "e.g. Gamification in coding workshops, AI Bot integration",
          descLabel: "Notes & Discussion Points",
          descPlaceholder: "Outline key questions, concepts, or discussion points...",
          submitButton: "Add Topic",
        };
      case "roadmap":
        return {
          modalTitle: "Add Roadmap Milestone",
          subtitle: "Add a project milestone or feature target",
          titleLabel: "Milestone / Feature Title",
          titlePlaceholder: "e.g. v2.0 API Overhaul, Student Portal Beta",
          descLabel: "Milestone Scope & Deliverables",
          descPlaceholder: "Detail key deliverables, dependencies, and requirements...",
          submitButton: "Add Milestone",
        };
      case "activity":
      default:
        return {
          modalTitle: "Submit Activity Suggestion",
          subtitle: "Propose an activity or event for the club schedule",
          titleLabel: "Activity Title",
          titlePlaceholder: "e.g. Annual Hackathon 2026, Cybersecurity Workshop",
          descLabel: "Description & Details",
          descPlaceholder: "Describe the objective, target audience, format, or preliminary requirements...",
          submitButton: "Submit Activity",
        };
    }
  };

  const copy = getFormCopy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (columnId) {
      const selectedCol = columns.find((c) => c.id === columnId);
      if (selectedCol && !isColumnAllowed(selectedCol)) {
        setError("You do not have permission to submit to this stage/column.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        column_id: columnId,
        title: title.trim(),
        description: description.trim() || undefined,
        activity_date: isDateVisible ? activityDate || undefined : undefined,
        activity_end_date: isDateVisible ? activityEndDate || undefined : undefined,
        priority,
        color_tag: colorTag,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit card.");
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
            {columns.map((col) => {
              const allowed = isColumnAllowed(col);
              return (
                <option key={col.id} value={col.id} disabled={!allowed}>
                  {col.icon} {col.title} {!allowed ? " 🔒 (Restricted)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Generalized Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {copy.titleLabel} <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={copy.titlePlaceholder}
          required
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Generalized Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {copy.descLabel}
        </label>
        <MentionTextArea
          value={description}
          onValueChange={setDescription}
          rows={3}
          placeholder={copy.descPlaceholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Target Dates Grid (Shown ONLY if boardType supports dates) */}
      {isDateVisible && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {boardType === "roadmap" ? "Target Start Date" : "Start Date"}
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
              {boardType === "roadmap" ? "Target End Date / Deadline" : "End Date"}
            </label>
            <input
              type="date"
              value={activityEndDate}
              onChange={(e) => setActivityEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

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
          <span>{isSubmitting ? "Submitting..." : copy.submitButton}</span>
        </button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title={copy.modalTitle}
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
                {copy.modalTitle}
              </h2>
              <p className="text-xs text-text-muted">
                {copy.subtitle}
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
