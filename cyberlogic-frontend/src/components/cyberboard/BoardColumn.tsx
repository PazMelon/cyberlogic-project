import React, { useState } from "react";
import { Plus, MoreVertical, Trash2, Lock, Settings, GripVertical } from "lucide-react";
import type { CyberboardColumn, CyberboardCard } from "../../utils/api";
import BoardCard from "./BoardCard";

interface BoardColumnProps {
  column: CyberboardColumn;
  boardType?: string;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  isAdmin?: boolean;
  isHighlighted?: boolean;
  highlightedCardIds?: Set<number>;
  onCardClick: (card: CyberboardCard) => void;
  onVoteToggle: (cardId: number, e: React.MouseEvent) => void;
  onDeleteCard: (cardId: number, e: React.MouseEvent) => void;
  onAddSuggestionClick: (columnId: number) => void;
  onCardDrop: (cardId: number, targetColumnId: number) => void;
  onColumnDrop?: (draggedColumnId: number, targetColumnId: number, positionDirection?: "before" | "after") => void;
  onDeleteColumn?: (columnId: number) => void;
  onConfigureColumnClick?: (column: CyberboardColumn) => void;
  onShowToast?: (message: string, type?: "error" | "info" | "success") => void;
  onCardDragStart?: (e: React.DragEvent, card: CyberboardCard) => void;
  onCardDragEnd?: (e: React.DragEvent, card: CyberboardCard) => void;
}

export default function BoardColumn({
  column,
  boardType = "activity",
  currentUserId,
  userRole,
  boardHostId,
  isAdmin,
  isHighlighted = false,
  highlightedCardIds,
  onCardClick,
  onVoteToggle,
  onDeleteCard,
  onAddSuggestionClick,
  onCardDrop,
  onColumnDrop,
  onDeleteColumn,
  onConfigureColumnClick,
  onShowToast,
  onCardDragStart,
  onCardDragEnd,
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<"left" | "right" | "card" | null>(null);
  const [isColumnDragging, setIsColumnDragging] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isHost = boardHostId && currentUserId ? boardHostId === currentUserId : false;
  const canManageColumn = isHost || isAdmin;

  const allowedRoles = column.allowed_roles || [];
  const allowedUsers = column.allowed_users || [];
  const hasRestrictions = allowedRoles.length > 0 || allowedUsers.length > 0;

  let isAllowedToDrop = true;
  let isAllowedToMoveOut = true;
  if (hasRestrictions && !canManageColumn) {
    const roleMatch = allowedRoles.length > 0 && userRole && allowedRoles.includes(userRole);
    const userMatch = allowedUsers.length > 0 && currentUserId && allowedUsers.includes(currentUserId);
    isAllowedToDrop = Boolean(roleMatch || userMatch);
    isAllowedToMoveOut = Boolean(roleMatch || userMatch);
  }

  const handleColumnDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/cyberboard-column", column.id.toString());
    e.dataTransfer.effectAllowed = "move";
    setIsColumnDragging(true);
  };

  const handleColumnDragEnd = () => {
    setIsColumnDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const isLeft = e.clientX < midX;

    const types = Array.from(e.dataTransfer.types);
    const isColumnDrag = types.includes("application/cyberboard-column");

    if (isColumnDrag) {
      setDropIndicator(isLeft ? "left" : "right");
      e.dataTransfer.dropEffect = "move";
    } else {
      setDropIndicator("card");
      if (!isAllowedToDrop) {
        e.dataTransfer.dropEffect = "none";
      } else {
        e.dataTransfer.dropEffect = "move";
      }
    }

    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropIndicator(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const activeIndicator = dropIndicator;
    setIsDragOver(false);
    setDropIndicator(null);

    // Check if dropping a column
    const colIdStr = e.dataTransfer.getData("application/cyberboard-column");
    if (colIdStr) {
      const draggedColId = parseInt(colIdStr, 10);
      if (!isNaN(draggedColId) && draggedColId !== column.id && onColumnDrop) {
        onColumnDrop(draggedColId, column.id, activeIndicator === "left" ? "before" : "after");
      }
      return;
    }

    // Otherwise dropping a card
    if (!isAllowedToDrop) {
      if (onShowToast) {
        onShowToast(`Permission Denied: You do not have permission to move cards into '${column.title}'.`, "error");
      }
      return;
    }

    const cardIdStr = e.dataTransfer.getData("text/plain");
    if (cardIdStr && !cardIdStr.startsWith("column-")) {
      const cardId = parseInt(cardIdStr, 10);
      if (!isNaN(cardId)) {
        onCardDrop(cardId, column.id);
      }
    }
  };

  const rawCards = column.cards || [];
  const cards = rawCards.filter(
    (c, index, self) => index === self.findIndex((item) => item.id === c.id)
  );

  const getAddText = () => {
    switch (boardType) {
      case "ideas":
        return { emptyCta: "+ Submit an Idea", buttonText: "Add idea card" };
      case "brainstorming":
        return { emptyCta: "+ Add a Topic", buttonText: "Add topic card" };
      case "roadmap":
        return { emptyCta: "+ Add Milestone", buttonText: "Add milestone card" };
      case "activity":
      default:
        return { emptyCta: "+ Suggest an Idea", buttonText: "Add card" };
    }
  };

  const addText = getAddText();

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-72 sm:w-80 flex-shrink-0 bg-surface-900/80 backdrop-blur-md rounded-2xl border transition-all duration-200 ease-out flex flex-col max-h-full ${
        isHighlighted ? "animate-realtime-glow" : ""
      } ${
        isColumnDragging
          ? "opacity-30 scale-95 border-dashed border-primary shadow-inner"
          : "hover:shadow-lg"
      } ${
        isDragOver
          ? dropIndicator === "left"
            ? "translate-x-1.5 border-primary/80 shadow-2xl scale-[1.01]"
            : dropIndicator === "right"
            ? "-translate-x-1.5 border-primary/80 shadow-2xl scale-[1.01]"
            : isAllowedToDrop
            ? "border-primary/60 bg-primary/5 shadow-xl shadow-primary/10 scale-[1.01]"
            : "border-error/60 bg-error/5 shadow-xl shadow-error/10 scale-[1.01]"
          : "border-border/80"
      }`}
    >
      {/* Column Insertion Indicator Bar - Left */}
      {dropIndicator === "left" && (
        <div className="absolute -left-2.5 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary rounded-full shadow-[0_0_12px_rgba(6,182,212,0.9)] animate-pulse z-30 flex items-center justify-center pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-950 shadow-lg animate-bounce" />
        </div>
      )}

      {/* Column Insertion Indicator Bar - Right */}
      {dropIndicator === "right" && (
        <div className="absolute -right-2.5 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary rounded-full shadow-[0_0_12px_rgba(6,182,212,0.9)] animate-pulse z-30 flex items-center justify-center pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-950 shadow-lg animate-bounce" />
        </div>
      )}

      {/* Column Header (Draggable Handle for Column Sorting) */}
      <div
        draggable={canManageColumn}
        onDragStart={handleColumnDragStart}
        onDragEnd={handleColumnDragEnd}
        className={`p-3.5 border-b border-border/60 flex items-center justify-between flex-shrink-0 ${
          canManageColumn ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {canManageColumn && (
            <GripVertical className="w-4 h-4 text-text-muted/60 hover:text-text-primary flex-shrink-0 cursor-grab" />
          )}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color || "#06b6d4" }}
          />
          <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary truncate">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-800 text-text-muted text-[10px] font-bold border border-border">
            {cards.length}
          </span>
          {hasRestrictions && (
            <span
              className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
              title={
                isAllowedToDrop
                  ? "Drop permissions restricted to designated roles/users"
                  : "You do not have permission to drag cards here"
              }
            >
              <Lock className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {isAllowedToDrop && (
            <button
              type="button"
              onClick={() => onAddSuggestionClick(column.id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
              title="Add card to column"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {canManageColumn && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-1 w-44 bg-surface-800 border border-border rounded-xl shadow-xl z-20 py-1 text-xs space-y-0.5">
                  {onConfigureColumnClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        onConfigureColumnClick(column);
                      }}
                      className="w-full text-left px-3 py-2 text-text-primary hover:bg-surface-700 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-primary" />
                      Configure Restrictions
                    </button>
                  )}

                  {onDeleteColumn && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false);
                        if (cards.length > 0) {
                          if (onShowToast) {
                            onShowToast(`Cannot delete column '${column.title}' because it contains ${cards.length} task(s). Move or archive the cards first.`, "error");
                          }
                          return;
                        }
                        onDeleteColumn(column.id);
                      }}
                      className="w-full text-left px-3 py-2 text-error hover:bg-error/10 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-error" />
                      Delete Column
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[160px]" onMouseDown={(e) => e.stopPropagation()}>
        {/* Card Insertion Line Indicator when dragging over column */}
        {dropIndicator === "card" && isAllowedToDrop && (
          <div className="relative py-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary rounded-full shadow-[0_0_12px_rgba(6,182,212,0.9)] animate-pulse flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-surface-950 shadow-md" />
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">No cards here yet</p>
            {isAllowedToDrop && (
              <button
                type="button"
                onClick={() => onAddSuggestionClick(column.id)}
                className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                {addText.emptyCta}
              </button>
            )}
          </div>
        ) : (
          cards.map((card, idx) => (
            <BoardCard
              key={card.id ? `card-${card.id}` : `card-idx-${idx}`}
              card={card}
              boardType={boardType}
              currentUserId={currentUserId}
              boardHostId={boardHostId}
              isAdmin={isAdmin}
              isHighlighted={highlightedCardIds?.has(card.id)}
              isDraggable={isAllowedToMoveOut}
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
      {isAllowedToDrop && (
        <div className="p-2.5 border-t border-border/40 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onAddSuggestionClick(column.id)}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-border/60 hover:border-primary/50 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addText.buttonText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
