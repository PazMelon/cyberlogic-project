import React, { useState } from "react";
import { X, ThumbsUp, Calendar, Send, Trash2, MessageSquare } from "lucide-react";
import type { CyberboardCard } from "../../utils/api";

interface CardDetailModalProps {
  card: CyberboardCard | null;
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

  const comments = card.comments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border-t border-x sm:border border-border rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe Handle */}
        <div className="sm:hidden w-12 h-1 bg-text-muted/30 rounded-full mx-auto my-2.5 flex-shrink-0 cursor-pointer" onClick={onClose} />

        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  card.priority === "high"
                    ? "bg-error/15 text-error border-error/30"
                    : card.priority === "low"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {card.priority} priority
              </span>

              {card.activity_date && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-800 text-text-secondary text-xs border border-border">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {formatDate(card.activity_date)}
                    {card.activity_end_date ? ` to ${formatDate(card.activity_end_date)}` : ""}
                  </span>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-text-primary leading-snug mt-1">
              {card.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-800 rounded-xl transition-all cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Owner Profile Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-800/60 border border-border/50">
            <div className="flex items-center gap-3">
              <img
                src={card.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
                alt={card.user?.name || "Member"}
                className="w-9 h-9 rounded-full border border-primary/30 object-cover"
              />
              <div>
                <p className="text-xs text-text-muted">Suggested by</p>
                <p className="text-sm font-semibold text-text-primary">
                  {card.user?.name || "Club Member"}
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                    {card.user?.role || "member"}
                  </span>
                </p>
              </div>
            </div>

            {/* Upvote Button */}
            <button
              type="button"
              onClick={() => onVoteToggle(card.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                card.has_voted
                  ? "bg-primary text-surface-950 shadow-md shadow-primary/20"
                  : "bg-surface-800 text-text-primary hover:bg-surface-700 border border-border"
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${card.has_voted ? "fill-surface-950" : ""}`} />
              <span>{card.has_voted ? "Upvoted" : "Upvote Idea"} ({card.votes_count || 0})</span>
            </button>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Activity Details & Proposal
            </h3>
            <div className="p-4 rounded-xl bg-surface-800/40 border border-border/40 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {card.description || "No detailed description provided."}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Discussion & Feedback ({comments.length})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-4">
                  No comments yet. Be the first to give feedback!
                </p>
              ) : (
                comments.map((comment) => {
                  const canDeleteComment = comment.user_id === currentUserId || isAdmin;
                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-xl bg-surface-800/60 border border-border/40 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={comment.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=comment"}
                            alt={comment.user?.name || "User"}
                            className="w-5 h-5 rounded-full border border-border object-cover"
                          />
                          <span className="font-semibold text-text-primary">
                            {comment.user?.name || "Member"}
                          </span>
                        </div>

                        {canDeleteComment && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-text-muted hover:text-error transition-colors p-1 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary pl-7">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment or suggestion..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-primary text-surface-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-primary-light disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        {canDeleteCard && (
          <div className="p-4 border-t border-border bg-surface-950/40 flex justify-between items-center">
            <button
              type="button"
              onClick={() => onDeleteCard(card.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 border border-error/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete Suggestion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
