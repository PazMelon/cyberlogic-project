import React, { useState } from "react";
import { Plus, MoreVertical, Trash2, Lock, Settings } from "lucide-react";
import type { CyberboardColumn, CyberboardCard } from "../../utils/api";
import BoardCard from "./BoardCard";

interface BoardColumnProps {
  column: CyberboardColumn;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  isAdmin?: boolean;
  onCardClick: (card: CyberboardCard) => void;
  onVoteToggle: (cardId: number, e: React.MouseEvent) => void;
  onDeleteCard: (cardId: number, e: React.MouseEvent) => void;
  onAddSuggestionClick: (columnId: number) => void;
  onCardDrop: (cardId: number, targetColumnId: number) => void;
  onDeleteColumn?: (columnId: number) => void;
  onConfigureColumnClick?: (column: CyberboardColumn) => void;
  onShowToast?: (message: string, type?: "error" | "info" | "success") => void;
  onCardDragStart?: (e: React.DragEvent, card: CyberboardCard) => void;
  onCardDragEnd?: (e: React.DragEvent, card: CyberboardCard) => void;
}

export default function BoardColumn({
  column,
  currentUserId,
  userRole,
  boardHostId,
  isAdmin,
  onCardClick,
  onVoteToggle,
  onDeleteCard,
  onAddSuggestionClick,
  onCardDrop,
  onDeleteColumn,
  onConfigureColumnClick,
  onShowToast,
  onCardDragStart,
  onCardDragEnd,
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isHost = boardHostId && currentUserId ? boardHostId === currentUserId : false;
  const canManageColumn = isHost || isAdmin;

  const allowedRoles = column.allowed_roles || [];
  const allowedUsers = column.allowed_users || [];
  const hasRestrictions = allowedRoles.length > 0 || allowedUsers.length > 0;

  let isAllowedToDrop = true;
  if (hasRestrictions && !canManageColumn) {
    const roleMatch = allowedRoles.length > 0 && userRole && allowedRoles.includes(userRole);
    const userMatch = allowedUsers.length > 0 && currentUserId && allowedUsers.includes(currentUserId);
    isAllowedToDrop = Boolean(roleMatch || userMatch);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAllowedToDrop) {
      e.dataTransfer.dropEffect = "none";
    } else {
      e.dataTransfer.dropEffect = "move";
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isAllowedToDrop) {
      if (onShowToast) {
        onShowToast(`Permission Denied: You do not have permission to move cards into '${column.title}'.`, "error");
      }
      return;
    }

    const cardIdStr = e.dataTransfer.getData("text/plain");
    if (cardIdStr) {
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-72 sm:w-80 flex-shrink-0 bg-surface-900/80 backdrop-blur-md rounded-2xl border transition-all flex flex-col max-h-full ${
        isDragOver
          ? isAllowedToDrop
            ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
            : "border-error/60 bg-error/5 shadow-lg shadow-error/10"
          : "border-border/80"
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddSuggestionClick(column.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            title="Add card to column"
          >
            <Plus className="w-4 h-4" />
          </button>

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
          cards.map((card, idx) => (
            <BoardCard
              key={card.id ? `card-${card.id}` : `card-idx-${idx}`}
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
