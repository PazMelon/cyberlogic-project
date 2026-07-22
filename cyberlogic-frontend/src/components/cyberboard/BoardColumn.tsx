import React, { useState } from "react";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import type { CyberboardColumn, CyberboardCard } from "../../utils/api";
import BoardCard from "./BoardCard";

interface BoardColumnProps {
  column: CyberboardColumn;
  currentUserId?: number;
  isAdmin?: boolean;
  onCardClick: (card: CyberboardCard) => void;
  onVoteToggle: (cardId: number, e: React.MouseEvent) => void;
  onDeleteCard: (cardId: number, e: React.MouseEvent) => void;
  onAddSuggestionClick: (columnId: number) => void;
  onCardDrop: (cardId: number, targetColumnId: number) => void;
  onDeleteColumn?: (columnId: number) => void;
  onCardDragStart?: (e: React.DragEvent, card: CyberboardCard) => void;
  onCardDragEnd?: (e: React.DragEvent, card: CyberboardCard) => void;
}

export default function BoardColumn({
  column,
  currentUserId,
  isAdmin,
  onCardClick,
  onVoteToggle,
  onDeleteCard,
  onAddSuggestionClick,
  onCardDrop,
  onDeleteColumn,
  onCardDragStart,
  onCardDragEnd,
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardIdStr = e.dataTransfer.getData("text/plain");
    if (cardIdStr) {
      const cardId = parseInt(cardIdStr, 10);
      if (!isNaN(cardId)) {
        onCardDrop(cardId, column.id);
      }
    }
  };

  const cards = column.cards || [];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-72 lg:w-80 flex-shrink-0 flex flex-col max-h-full rounded-2xl bg-surface-900/90 border transition-all duration-200 ${
        isDragOver
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border/60"
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-border/50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{column.icon || "📌"}</span>
          <h3 className="text-sm font-bold text-text-primary truncate">
            {column.title}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-800 text-text-secondary border border-border/50"
            style={{ color: column.color || undefined }}
          >
            {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddSuggestionClick(column.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            title="Add card to column"
          >
            <Plus className="w-4 h-4" />
          </button>

          {isAdmin && onDeleteColumn && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-1 w-40 bg-surface-800 border border-border rounded-xl shadow-xl z-20 py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptions(false);
                      onDeleteColumn(column.id);
                    }}
                    className="w-full text-left px-3 py-2 text-error hover:bg-error/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Column
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[160px]">
        {cards.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">No cards here yet</p>
            <button
              type="button"
              onClick={() => onAddSuggestionClick(column.id)}
              className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              + Suggest an Idea
            </button>
          </div>
        ) : (
          cards.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCardClick={onCardClick}
              onVoteToggle={onVoteToggle}
              onDelete={onDeleteCard}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
            />
          ))
        )}
      </div>

      {/* Quick Add Footer */}
      <div className="p-2.5 border-t border-border/40 flex-shrink-0">
        <button
          type="button"
          onClick={() => onAddSuggestionClick(column.id)}
          className="w-full py-2 px-3 rounded-xl border border-dashed border-border/60 hover:border-primary/50 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add suggestion card</span>
        </button>
      </div>
    </div>
  );
}
