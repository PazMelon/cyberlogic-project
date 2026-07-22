import React from "react";
import { ThumbsUp, MessageSquare, Calendar, Trash2 } from "lucide-react";
import type { CyberboardCard } from "../../utils/api";

interface BoardCardProps {
  card: CyberboardCard;
  currentUserId?: number;
  isAdmin?: boolean;
  onCardClick: (card: CyberboardCard) => void;
  onVoteToggle: (cardId: number, e: React.MouseEvent) => void;
  onDelete?: (cardId: number, e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, card: CyberboardCard) => void;
  onDragEnd?: (e: React.DragEvent, card: CyberboardCard) => void;
}

export default function BoardCard({
  card,
  currentUserId,
  isAdmin,
  onCardClick,
  onVoteToggle,
  onDelete,
  onDragStart,
  onDragEnd,
}: BoardCardProps) {
  const isOwner = card.user_id === currentUserId;
  const canDelete = isOwner || isAdmin;

  // Priority color badge mapping
  const priorityStyles = {
    high: "bg-error/15 text-error border-error/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", card.id.toString());
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) {
      onDragStart(e, card);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e, card);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formattedStartDate = formatDate(card.activity_date);
  const formattedEndDate = formatDate(card.activity_end_date);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onCardClick(card)}
      className="group relative bg-surface-800/80 hover:bg-surface-800 border border-border/80 hover:border-primary/40 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-grab active:cursor-grabbing space-y-3"
      style={{
        borderLeftColor: card.color_tag || undefined,
        borderLeftWidth: card.color_tag ? "4px" : undefined,
      }}
    >
      {/* Header: Priority & Delete Action */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
            priorityStyles[card.priority] || priorityStyles.medium
          }`}
        >
          {card.priority} priority
        </span>

        {canDelete && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(card.id, e);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-all cursor-pointer"
            title="Delete Card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card Title */}
      <h4 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {card.title}
      </h4>

      {/* Description Snippet (if available) */}
      {card.description && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-sans">
          {card.description}
        </p>
      )}

      {/* Activity Date Badge */}
      {formattedStartDate && (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-900/60 text-text-secondary text-[11px] font-medium border border-border/50">
          <Calendar className="w-3 h-3 text-primary" />
          <span>
            {formattedStartDate}
            {formattedEndDate ? ` – ${formattedEndDate}` : ""}
          </span>
        </div>
      )}

      {/* Footer: Owner info & Upvotes/Comments */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
        {/* Card Owner */}
        <div className="flex items-center gap-1.5 min-w-0" title={`Idea by ${card.user?.name || "Member"}`}>
          <img
            src={card.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
            alt={card.user?.name || "User"}
            className="w-5 h-5 rounded-full border border-border object-cover flex-shrink-0"
          />
          <span className="text-[11px] font-medium text-text-muted truncate">
            {card.user?.first_name || card.user?.name || "Member"}
          </span>
        </div>

        {/* Interactive Actions: Vote & Comments Count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onVoteToggle(card.id, e);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              card.has_voted
                ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                : "bg-surface-900/80 text-text-muted hover:text-text-primary hover:bg-surface-900"
            }`}
            title={card.has_voted ? "Remove Upvote" : "Upvote Suggestion"}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${card.has_voted ? "fill-primary text-primary" : ""}`} />
            <span>{card.votes_count || 0}</span>
          </button>

          <div className="flex items-center gap-1 text-text-muted text-xs px-1" title="Comments">
            <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
            <span>{card.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
