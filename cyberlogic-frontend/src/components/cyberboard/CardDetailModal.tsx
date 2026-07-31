import React, { useState, useEffect } from "react";
import { X, ThumbsUp, Calendar, Send, Trash2, MessageSquare } from "lucide-react";
import type { CyberboardCard } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";

interface CardDetailModalProps {
  card: CyberboardCard | null;
  boardType?: string;
  currentUserId?: number;
  isAdmin?: boolean;
  onClose: () => void;
  onVoteToggle: (cardId: number) => void;
  onAddComment: (cardId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onDeleteCard: (cardId: number) => void;
}

export default function CardDetailModal({
  card,
  boardType = "activity",
  currentUserId,
  isAdmin,
  onClose,
  onVoteToggle,
  onAddComment,
  onDeleteComment,
  onDeleteCard,
}: CardDetailModalProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!card) return null;

  const isOwner = card.user_id === currentUserId;
  const canDeleteCard = isOwner || isAdmin;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(card.id, newComment.trim());
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const rawComments = card.comments || [];
  const comments = rawComments.filter(
    (cm, index, self) => index === self.findIndex((c) => c.id === cm.id)
  );

  const showDateSection = boardType !== "ideas" && boardType !== "brainstorming" && (card.activity_date || card.activity_end_date);

  const modalBody = (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {boardType === "ideas" || boardType === "brainstorming" ? "Description & Concept Details" : "Description & Details"}
        </h4>
        <div className="p-4 rounded-xl bg-surface-800/60 border border-border/50 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {card.description || "No detailed description provided."}
        </div>
      </div>

      {/* Target Dates (Activity & Roadmap only) */}
      {showDateSection && (
        <div className="p-4 rounded-xl bg-surface-800/40 border border-border/50 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold uppercase tracking-wider">
              {boardType === "roadmap" ? "Milestone Schedule:" : "Event Schedule:"}
            </span>
          </div>

          <div className="flex items-center gap-3 font-medium text-text-primary">
            {card.activity_date && <span>Start: {formatDate(card.activity_date)}</span>}
            {card.activity_end_date && <span>End: {formatDate(card.activity_end_date)}</span>}
          </div>
        </div>
      )}

      {/* Upvote CTA Section */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-text-primary">
            {boardType === "ideas" ? "Support this idea" : boardType === "brainstorming" ? "Support this topic" : "Support this suggestion"}
          </h4>
          <p className="text-xs text-text-muted">
            Upvote to let project leads and members know community interest level
          </p>
        </div>

        <button
          type="button"
          onClick={() => onVoteToggle(card.id)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            card.has_voted
              ? "bg-primary text-surface-950 shadow-md shadow-primary/20 scale-105"
              : "bg-surface-800 text-text-primary hover:bg-surface-700 border border-border"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${card.has_voted ? "fill-surface-950" : ""}`} />
          <span>{card.votes_count || 0} Votes</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Comments ({comments.length})</span>
          </h4>
        </div>

        {/* New Comment Input */}
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-3.5 py-2 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-text-muted italic text-center py-4">
              No comments yet. Start the conversation!
            </p>
          ) : (
            comments.map((cm) => {
              const canDeleteCm = cm.user_id === currentUserId || isAdmin;
              return (
                <div
                  key={cm.id}
                  className="p-3 rounded-xl bg-surface-800/50 border border-border/40 space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          cm.user?.avatar ||
                          "https://api.dicebear.com/9.x/avataaars/svg?seed=user"
                        }
                        alt={cm.user?.name || "User"}
                        className="w-5 h-5 rounded-full border border-border object-cover"
                      />
                      <span className="text-xs font-bold text-text-primary">
                        {cm.user?.name || "Member"}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {formatDate(cm.created_at)}
                      </span>
                    </div>

                    {canDeleteCm && (
                      <button
                        type="button"
                        onClick={() => onDeleteComment(cm.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error rounded-md transition-all cursor-pointer"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed pl-7 whitespace-pre-wrap">
                    {cm.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Card Button */}
      {canDeleteCard && (
        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={() => onDeleteCard(card.id)}
            className="px-3.5 py-2 rounded-xl text-error bg-error/10 hover:bg-error/20 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Card</span>
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title={card.title}
        initialSnap="3/4"
      >
        {modalBody}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div
          className="p-5 border-b border-border flex items-center justify-between"
          style={{
            borderTopColor: card.color_tag || undefined,
            borderTopWidth: card.color_tag ? "4px" : undefined,
          }}
        >
          <div className="space-y-1 min-w-0 pr-4">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border inline-block ${
                card.priority === "high"
                  ? "bg-error/15 text-error border-error/30"
                  : card.priority === "low"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {card.priority} priority
            </span>
            <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">
              {card.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">{modalBody}</div>
      </div>
    </div>
  );
}
