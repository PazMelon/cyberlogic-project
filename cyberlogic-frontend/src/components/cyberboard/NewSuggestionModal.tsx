import React, { useState, useEffect } from "react";
import { X, Sparkles, Layers, Calendar, Tag, AlertCircle, Clock, CheckSquare, Plus, Trash2 } from "lucide-react";
import type { CyberboardColumn, CyberboardCard, CyberboardAttachment, CyberboardChecklistItem } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";
import MentionTextArea from "../ui/MentionTextArea";
import SearchableAssigneePicker from "./SearchableAssigneePicker";
import SearchableTaskPicker from "./SearchableTaskPicker";

interface NewSuggestionModalProps {
  boardId: number;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  boardPhases?: Array<{ name: string; color: string }>;
  columns: CyberboardColumn[];
  allCards?: CyberboardCard[];
  defaultParentId?: number;
  boardType?: string;
  defaultColumnId?: number;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  isAdmin?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    column_id?: number;
    parent_id?: number | null;
    predecessor_id?: number | null;
    assigned_user_id?: number | null;
    assigned_user_ids?: number[] | null;
    title: string;
    description?: string;
    activity_date?: string;
    activity_end_date?: string;
    priority?: "low" | "medium" | "high";
    color_tag?: string;
    phase?: string;
    attachments?: CyberboardAttachment[] | null;
    checklist?: CyberboardChecklistItem[] | null;
    completion_percentage?: number | null;
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
  boardVisibility = "public",
  allowedMembers = [],
  boardPhases = [],
  columns,
  allCards = [],
  defaultParentId,
  boardType = "activity",
  defaultColumnId,
  currentUserId,
  userRole,
  boardHostId,
  isAdmin,
  onClose,
  onSubmit,
}: NewSuggestionModalProps) {
  const safeBoardPhases = boardPhases || [];
  const safeColumns = columns || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [parentId, setParentId] = useState<number | undefined>(defaultParentId);

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

  const allowedColumns = safeColumns.filter(isColumnAllowed);

  const initialColumnId = () => {
    if (defaultColumnId && allowedColumns.some((col) => col.id === defaultColumnId)) {
      return defaultColumnId;
    }
    return allowedColumns[0]?.id || safeColumns[0]?.id;
  };

  const [columnId, setColumnId] = useState<number | undefined>(initialColumnId);
  const [phase, setPhase] = useState<string>(() => safeBoardPhases[0]?.name || "");
  const [predecessorId, setPredecessorId] = useState<number | undefined>(undefined);
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

  // Filter available parent cards for sub-task assignment
  const availableParentCards = (allCards.length > 0 ? allCards : columns.flatMap((c) => c.cards || [])).filter(
    (c) => !c.parent_id
  );

  const availablePredecessorCards = allCards.length > 0 ? allCards : columns.flatMap((c) => c.cards || []);

  const isDateVisible = boardType === "activity" || boardType === "roadmap";

  const getFormCopy = () => {
    switch (boardType) {
      case "ideas":
        return {
          modalTitle: "Submit New Idea",
          subtitle: "Propose a new feature, improvement, or creative concept",
          titleLabel: "Idea Title",
          titlePlaceholder: "e.g. Add dark mode toggle to dashboard",
          descLabel: "Detailed Concept & Context",
          descPlaceholder: "Describe your idea, benefits, or implementation notes...",
          submitButton: "Submit Idea",
        };
      case "brainstorming":
        return {
          modalTitle: "New Discussion Topic",
          subtitle: "Start a open topic for team feedback & collaborative discussion",
          titleLabel: "Topic Title",
          titlePlaceholder: "e.g. Brainstorming session for anniversary event",
          descLabel: "Topic Background",
          descPlaceholder: "Outline key questions or context for the team...",
          submitButton: "Post Topic",
        };
      case "roadmap":
        return {
          modalTitle: "Add Roadmap Initiative / Sub-Task",
          subtitle: "Define a project milestone, feature deliverable, or sub-task",
          titleLabel: "Task / Deliverable Title",
          titlePlaceholder: "e.g. Auth System Overhaul, Database Migration Sprint",
          descLabel: "Deliverables & Scope",
          descPlaceholder: "Detail key objectives, technical dependencies, and target goals...",
          submitButton: "Add to Roadmap",
        };
      case "activity":
      default:
        return {
          modalTitle: "Propose Event / Activity",
          subtitle: "Create a scheduled activity or task on the board",
          titleLabel: "Activity Title",
          titlePlaceholder: "e.g. Flutter Bootcamp 2026, CS Gaming Social Night",
          descLabel: "Activity Details",
          descPlaceholder: "Add description, agenda, venue link, or target goals...",
          submitButton: "Create Activity",
        };
    }
  };

  const copy = getFormCopy();

  const [checklist, setChecklist] = useState<CyberboardChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: CyberboardChecklistItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistText("");
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!columnId) {
      setError("Please select a target column.");
      return;
    }

    const computedRate = checklist.length > 0
      ? Math.round((checklist.filter((i) => i.completed).length / checklist.length) * 100)
      : completionPercentage;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        column_id: columnId,
        parent_id: parentId || null,
        predecessor_id: predecessorId || null,
        assigned_user_id: assignedUserIds[0] || null,
        assigned_user_ids: assignedUserIds,
        title: title.trim(),
        description: description.trim() || undefined,
        activity_date: activityDate || undefined,
        activity_end_date: activityEndDate || undefined,
        priority,
        color_tag: colorTag,
        phase: phase || undefined,
        checklist: checklist.length > 0 ? checklist : null,
        completion_percentage: computedRate,
      });
      onClose();
    } catch (err: any) {
      console.error("Failed to create card:", err);
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBody = (
    <form id="new-suggestion-form" onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Task Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
          {copy.titleLabel} <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={copy.titlePlaceholder}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
        />
      </div>

      {/* Task Checklist & Completion Monitoring Section */}
      <div className="space-y-3 p-4 rounded-2xl bg-surface-900/80 border border-border/80 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Task Checklist & Initial Completion</span>
          </div>
          {checklist.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
              {checklist.length} items
            </span>
          )}
        </div>

        {/* Existing Checklist Items List */}
        {checklist.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-800/80 border border-border/60 text-xs">
                <span className="font-medium text-text-primary truncate">{item.text}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="text-text-muted hover:text-error p-1 rounded-lg hover:bg-surface-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Checklist Item Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newChecklistText}
            onChange={(e) => setNewChecklistText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddChecklistItem();
              }
            }}
            placeholder="Add a checklist item (e.g. Write unit tests)..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddChecklistItem}
            disabled={!newChecklistText.trim()}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-surface-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Manual Completion Percentage (Shown when no checklist items added) */}
        {checklist.length === 0 && (
          <div className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted font-semibold">Initial Manual Completion Rate:</span>
              <span className="font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                className="flex-1 accent-emerald-500 h-2 rounded-lg bg-surface-800 cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-16 px-2 py-1 rounded-lg bg-surface-800 border border-border text-xs text-center font-bold text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid Controls Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Target Stage / Column */}
        {columns.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Board Stage / Column
            </label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
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

        {/* Searchable Assignee Picker (Permission-Scoped) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
            Assigned Members
          </label>
          <SearchableAssigneePicker
            value={assignedUserIds}
            onChange={(uIds) => setAssignedUserIds(uIds)}
            boardVisibility={boardVisibility}
            allowedMembers={allowedMembers}
            boardHostId={boardHostId}
          />
        </div>
      </div>

      {/* Sub-Task & Priority Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Parent Task Selector (Optional Sub-card) */}
        {availableParentCards.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Parent Task (Optional Sub-Task)
            </label>
            <SearchableTaskPicker
              value={parentId || null}
              onChange={(id) => setParentId(id || undefined)}
              cards={availableParentCards}
              emptyLabel="None (Top-Level Parent Task)"
            />
          </div>
        )}

        {/* Priority Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
            Priority Level
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="low">🟢 Low Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="high">🔴 High Priority</option>
          </select>
        </div>
      </div>

      {/* SDLC Phase Selector (Waterfall / Agile / Custom) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          ⚡ Project Phase / Sprint
        </label>
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
        >
          {safeBoardPhases.length > 0 ? (
            safeBoardPhases.map((p, idx) => (
              <option key={`b-phase-${idx}`} value={p.name}>
                {p.name}
              </option>
            ))
          ) : (
            <option value="">No SDLC Phase Assigned</option>
          )}
        </select>
      </div>

      {/* Predecessor Task Selector (Dependency Link) */}
      {availablePredecessorCards.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Predecessor Task (Dependency Link)
          </label>
          <SearchableTaskPicker
            value={predecessorId || null}
            onChange={(id) => setPredecessorId(id || undefined)}
            cards={availablePredecessorCards}
            emptyLabel="No Predecessor (Independent Task)"
          />
        </div>
      )}

      {/* Target Dates Grid */}
      {isDateVisible && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
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
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {boardType === "roadmap" ? "Target Deadline" : "End Date"}
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

      {/* Accent Color Tag */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" />
          Color Tag Accent
        </label>
        <div className="flex items-center gap-2 pt-1">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setColorTag(color)}
              className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                colorTag === color ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-surface-900 shadow-md" : "opacity-80 hover:opacity-100 hover:scale-110"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Submit CTAs */}
      {!isMobile && (
        <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold hover:bg-surface-800 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? "Submitting..." : copy.submitButton}</span>
          </button>
        </div>
      )}
    </form>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title={copy.modalTitle}
        initialSnap="3/4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold hover:bg-surface-800 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="new-suggestion-form"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting..." : copy.submitButton}</span>
            </button>
          </div>
        }
      >
        {formBody}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-surface-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Sparkles className="w-5 h-5" />
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
        <div className="p-6 overflow-y-auto scrollbar-thin">
          {formBody}
        </div>
      </div>
    </div>
  );
}
