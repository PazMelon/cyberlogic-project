import React, { useState } from "react";
import { CheckSquare, Plus, Trash2, GripVertical } from "lucide-react";
import type { CyberboardChecklistItem, CyberboardCard, CyberboardColumn } from "../../../utils/api";

interface TaskChecklistSectionProps {
  checklist?: CyberboardChecklistItem[];
  completionPercentage?: number;
  subCards?: CyberboardCard[];
  columns?: CyberboardColumn[];
  cardColumnId?: number;
  cardId?: number;
  allBoardCards?: CyberboardCard[];
  onToggleItem: (itemId: string) => Promise<void>;
  onAddItem: (text: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onReorderChecklist: (items: CyberboardChecklistItem[]) => Promise<void>;
  onManualCompletionChange: (value: number) => void;
  canEdit?: boolean;
}

export const TaskChecklistSection: React.FC<TaskChecklistSectionProps> = ({
  checklist = [],
  completionPercentage = 0,
  subCards = [],
  columns = [],
  cardId,
  allBoardCards = [],
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onReorderChecklist,
  onManualCompletionChange,
  canEdit = true,
}) => {
  const [newItemText, setNewItemText] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Determine overall completion rate considering subcards if present
  const liveSubcards = (allBoardCards || []).filter(
    (c) => c.parent_id === cardId && !c.is_archived
  );
  const subcardsList = liveSubcards.length > 0 ? liveSubcards : subCards;

  let computedRate = completionPercentage;
  const hasSubcards = subcardsList.length > 0 && columns && columns.length > 0;
  const hasChecklist = checklist.length > 0;

  let subcardsRate = 0;
  if (hasSubcards) {
    const lastColPosition = columns.reduce((max, c) => Math.max(max, c.position ?? 0), 0);
    const completedSubcardsCount = subcardsList.filter((sc) => {
      const col = columns.find((c) => c.id === sc.column_id);
      if (!col) return false;
      return (
        col.status_type === "completed" ||
        col.title.toLowerCase().includes("done") ||
        col.title.toLowerCase().includes("completed") ||
        (col.position !== undefined && col.position === lastColPosition && lastColPosition > 0)
      );
    }).length;
    subcardsRate = (completedSubcardsCount / subcardsList.length) * 100;
  }

  let checklistRate = 0;
  if (hasChecklist) {
    const completedCount = checklist.filter((i) => i.completed).length;
    checklistRate = (completedCount / checklist.length) * 100;
  }

  if (hasChecklist && hasSubcards) {
    computedRate = Math.round(checklistRate * 0.5 + subcardsRate * 0.5);
  } else if (hasChecklist) {
    computedRate = Math.round(checklistRate);
  } else if (hasSubcards) {
    computedRate = Math.round(subcardsRate);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const text = newItemText.trim();
    setNewItemText("");
    await onAddItem(text);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;

    const updated = [...checklist];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(idx, 0, item);
    setDraggedIndex(idx);
    onReorderChecklist(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="p-4 rounded-2xl bg-surface-800/40 border border-border/50 space-y-3">
      {/* Header & Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>Task Completion Rate & Checklist</span>
          </h4>

          <span
            className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              computedRate === 100
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : computedRate > 50
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-surface-700 text-text-muted border-border/60"
            }`}
          >
            {computedRate}% Done
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 rounded-full bg-surface-900 overflow-hidden border border-border/40 relative">
          <div
            className={`h-full transition-all duration-300 ${
              computedRate === 100
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                : "bg-gradient-to-r from-primary to-cyan-400"
            }`}
            style={{ width: `${computedRate}%` }}
          />
        </div>

        {hasSubcards && (
          <p className="text-[11px] text-text-muted italic pt-0.5">
            Note: Completion rate is auto-calculated based on sub-tasks status and checklist items.
          </p>
        )}
      </div>

      {/* Checklist Items List (Unchecked on top, checked on bottom) */}
      {checklist.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {[...checklist]
            .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
            .map((item) => {
              const originalIndex = checklist.findIndex((i) => i.id === item.id);
              return (
                <div
                  key={item.id}
                  draggable={canEdit}
                  onDragStart={() => handleDragStart(originalIndex)}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all group ${
                    draggedIndex === originalIndex ? "opacity-40 bg-surface-700 border-primary" : ""
                  } ${
                    item.completed
                      ? "bg-surface-900/40 border-border/30 text-text-muted"
                      : "bg-surface-800/80 border-border/60 text-text-primary hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {canEdit && (
                      <GripVertical className="w-3.5 h-3.5 text-text-muted/40 group-hover:text-text-muted cursor-grab active:cursor-grabbing flex-shrink-0" />
                    )}

                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggleItem(item.id)}
                      disabled={!canEdit}
                      className="w-4 h-4 rounded-md accent-primary cursor-pointer flex-shrink-0"
                    />

                    <span
                      className={`truncate ${
                        item.completed ? "line-through text-text-muted" : "font-medium"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error rounded-lg transition-all cursor-pointer flex-shrink-0 ml-2"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Add New Checklist Item Form */}
      {canEdit && (
        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add a checklist item..."
            className="flex-1 px-3 py-2 rounded-xl bg-surface-900/80 border border-border/60 text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}

      {/* Manual Percentage Slider (Only if no checklist items and no subcards) */}
      {checklist.length === 0 && !hasSubcards && canEdit && (
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted font-medium">Manual Completion Slider:</span>
            <span className="font-bold text-primary">{completionPercentage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={completionPercentage}
            onChange={(e) => onManualCompletionChange(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default TaskChecklistSection;
