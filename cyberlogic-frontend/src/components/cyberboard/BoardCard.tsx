import React from "react";
import { ThumbsUp, MessageSquare, Calendar, Trash2, Paperclip } from "lucide-react";
import type { CyberboardCard } from "../../utils/api";
import PhaseBadge from "./ui/PhaseBadge";
import PriorityBadge from "./ui/PriorityBadge";

import MentionText from "./MentionText";

interface BoardCardProps {
  card: CyberboardCard;
  boardType?: string;
  currentUserId?: number;
  boardHostId?: number;
  isAdmin?: boolean;
  isHighlighted?: boolean;
  isDraggable?: boolean;
  onCardClick: (card: CyberboardCard) => void;
  onVoteToggle: (cardId: number, e: React.MouseEvent) => void;
  onDelete?: (cardId: number, e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, card: CyberboardCard) => void;
  onDragEnd?: (e: React.DragEvent, card: CyberboardCard) => void;
}

export default function BoardCard({
  card,
  boardType = "activity",
  currentUserId,
  boardHostId,
  isAdmin,
  isHighlighted = false,
  isDraggable = true,
  onCardClick,
  onVoteToggle,
  onDelete,
  onDragStart,
  onDragEnd,
}: BoardCardProps) {
  const isOwner = card.user_id === currentUserId;
  const isHost = boardHostId && currentUserId ? boardHostId === currentUserId : false;
  const canDelete = isOwner || isHost || isAdmin;

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", card.id.toString());
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) {
      onDragStart(e, card);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.stopPropagation();
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

  const showDateBadge = boardType !== "ideas" && boardType !== "brainstorming";
  const formattedStartDate = formatDate(card.activity_date);
  const formattedEndDate = formatDate(card.activity_end_date);

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onCardClick(card)}
      className={`group relative bg-surface-800/80 hover:bg-surface-800 border border-border/80 hover:border-primary/40 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-200 space-y-3 ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isHighlighted ? "animate-realtime-glow" : ""}`}
      style={{
        borderLeftColor: card.color_tag || undefined,
        borderLeftWidth: card.color_tag ? "4px" : undefined,
      }}
    >
      {/* Header: Priority & Delete Action */}
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={card.priority} size="sm" />

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
        <MentionText content={card.title} />
      </h4>

      {/* Description Snippet (if available) */}
      {card.description && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-sans">
          <MentionText content={card.description} />
        </p>
      )}

      {/* Badges Bar: Date & Sub-Tasks & Assignee */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {showDateBadge && formattedStartDate && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-900/60 text-text-secondary text-[10px] font-medium border border-border/50">
            <Calendar className="w-3 h-3 text-primary" />
            <span>
              {formattedStartDate}
              {formattedEndDate ? ` – ${formattedEndDate}` : ""}
            </span>
          </div>
        )}

        {card.sub_cards && card.sub_cards.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-900/60 text-primary text-[10px] font-medium border border-primary/20">
            <span>{card.sub_cards.length} sub-tasks</span>
          </div>
        )}

        <PhaseBadge phase={card.phase} size="sm" />

        {card.attachments && card.attachments.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20" title={`${card.attachments.length} Attachment(s)`}>
            <Paperclip className="w-3 h-3 text-emerald-400" />
            <span>{card.attachments.length}</span>
          </div>
        )}

        {card.assigned_users && card.assigned_users.length > 0 ? (
          <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
            {card.assigned_users.slice(0, 3).map((u) => (
              <img
                key={`card-badge-${u.id}`}
                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                alt={u.first_name}
                title={`Assigned: ${u.first_name} ${u.last_name}`}
                className="w-4 h-4 rounded-full object-cover border border-surface-800 ring-1 ring-primary/40"
              />
            ))}
            {card.assigned_users.length > 3 && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 rounded-full border border-primary/20">
                +{card.assigned_users.length - 3}
              </span>
            )}
          </div>
        ) : card.assigned_user ? (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-900/60 text-text-primary text-[10px] font-semibold border border-border/50" title={`Assigned to ${card.assigned_user.first_name} ${card.assigned_user.last_name}`}>
            <img
              src={card.assigned_user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.assigned_user.first_name)}&background=06b6d4&color=fff`}
              alt={card.assigned_user.first_name}
              className="w-3.5 h-3.5 rounded-full object-cover"
            />
            <span>@{card.assigned_user.username || card.assigned_user.first_name}</span>
          </div>
        ) : null}
      </div>

      {/* Footer: Owner info & Upvotes/Comments */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
        {/* Card Owner */}
        <div className="flex items-center gap-1.5 min-w-0" title={`Submitted by ${card.user?.name || "Member"}`}>
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
            title={card.has_voted ? "Remove Upvote" : "Upvote"}
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
