import React, { useState } from "react";
import { Plus, Loader2, ExternalLink, X } from "lucide-react";
import type { CyberboardCard } from "../../../utils/api";
import { createCyberboardCard } from "../../../utils/api";
import PhaseBadge from "../ui/PhaseBadge";

interface InlineSubtaskCreatorProps {
  boardId: number;
  parentCard: CyberboardCard;
  columnId: number;
  boardPhases?: Array<{ name: string; color: string }>;
  onSubtaskCreated?: (newSubtask: CyberboardCard) => void;
  onNavigateToSubtask?: (subtask: CyberboardCard) => void;
  onShowToast?: (text: string, type?: "error" | "info" | "success") => void;
}

export const InlineSubtaskCreator: React.FC<InlineSubtaskCreatorProps> = ({
  boardId,
  parentCard,
  columnId,
  boardPhases = [],
  onSubtaskCreated,
  onNavigateToSubtask,
  onShowToast,
}) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [createdSubtask, setCreatedSubtask] = useState<CyberboardCard | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newCard = await createCyberboardCard(boardId, {
        column_id: columnId,
        parent_id: parentCard.id,
        title: title.trim(),
        phase: parentCard.phase || undefined,
        color_tag: parentCard.color_tag || undefined,
        activity_date: parentCard.activity_date || undefined,
        activity_end_date: parentCard.activity_end_date || undefined,
        priority: parentCard.priority || "medium",
      });

      setTitle("");
      setIsOpen(false);
      if (onSubtaskCreated) {
        onSubtaskCreated(newCard);
      }

      // Show the "go to subtask?" popup
      setCreatedSubtask(newCard);

      if (onShowToast) {
        onShowToast("Subtask created with inherited parent phase!", "success");
      }
    } catch (err: any) {
      console.error("Failed to create subtask:", err);
      if (onShowToast) {
        onShowToast(err.message || "Failed to create subtask", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSubtask = () => {
    if (createdSubtask && onNavigateToSubtask) {
      onNavigateToSubtask(createdSubtask);
    }
    setCreatedSubtask(null);
  };

  const handleDismissPopup = () => {
    setCreatedSubtask(null);
  };

  return (
    <>
      {/* Subtask Created Popup */}
      {createdSubtask && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Subtask Created Successfully!
            </span>
            <button
              type="button"
              onClick={handleDismissPopup}
              className="p-0.5 rounded-md hover:bg-surface-700 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-text-primary font-medium truncate pl-5">
            &ldquo;{createdSubtask.title}&rdquo;
          </p>

          <div className="flex items-center gap-2 pl-5">
            {onNavigateToSubtask && (
              <button
                type="button"
                onClick={handleGoToSubtask}
                className="px-3 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open & Edit Subtask</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismissPopup}
              className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-700 transition-colors cursor-pointer"
            >
              Stay Here
            </button>
          </div>
        </div>
      )}

      {/* Create Subtask Toggle Button */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-800/80 hover:bg-surface-800 text-text-secondary hover:text-primary text-xs font-semibold border border-dashed border-border transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subtask (Inherits Phase)</span>
        </button>
      ) : (
        /* Create Subtask Form */
        <form onSubmit={handleCreate} className="p-3 bg-surface-900 border border-primary/30 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-text-primary">
            <span>Create Subtask</span>
            {parentCard.phase && (
              <div className="flex items-center gap-1 text-[10px] text-text-muted">
                <span>Inherits:</span>
                <PhaseBadge phase={parentCard.phase} boardPhases={boardPhases} size="sm" />
              </div>
            )}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Subtask title..."
            autoFocus
            className="w-full px-3 py-1.5 text-xs bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 text-xs font-medium text-text-muted hover:text-text-primary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-3 py-1 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              <span>Create</span>
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default InlineSubtaskCreator;
