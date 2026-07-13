import { useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Shield, CheckCircle, Trash2, Edit3, Flag, AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDialog } from "../../utils/useDialog";
import type { ForumCommentMapped } from "../../utils/api";
import { VoteControl } from "./VoteControl";
import { CommentForm } from "./CommentForm";
import { SpoilerGate } from "./SpoilerGate";
import { RedactedFormatter } from "./RedactedFormatter";

interface CommentItemProps {
  comment: ForumCommentMapped;
  threadAuthorId: number;
  isThreadClosed: boolean;
  solutionCommentId: number | null;
  canSelectSolution: boolean;
  onSelectSolution: (commentId: number | null) => void;
  onVote: (commentId: number, direction: "up" | "down") => void;
  onReply: (parentId: number, content: string, isSpoiler?: boolean, isRedacted?: boolean) => Promise<void>;
  onEdit: (commentId: number, content: string, isSpoiler?: boolean, isRedacted?: boolean) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onReport: (commentId: number) => void;
  allComments: ForumCommentMapped[];
  depth?: number;
  isLastReply?: boolean;
  parentIdForLastCurve?: number;
}

export function CommentItem({
  comment,
  threadAuthorId,
  isThreadClosed,
  solutionCommentId,
  canSelectSolution,
  onSelectSolution,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onReport,
  allComments,
  depth = 0,
  isLastReply = false,
  parentIdForLastCurve
}: CommentItemProps) {
  const { user } = useAuth();
  const { showConfirm } = useDialog();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isOwner = user?.id === comment.authorId;
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSolution = solutionCommentId === comment.id;

  // Filter replies (child comments of this comment)
  const childReplies = allComments.filter((c) => c.parentId === comment.id);

  const handlePostReply = async (content: string, isSpoiler?: boolean, isRedacted?: boolean) => {
    await onReply(comment.id, content, isSpoiler, isRedacted);
    setShowReplyForm(false);
  };

  const handleUpdateComment = async (content: string, isSpoiler?: boolean, isRedacted?: boolean) => {
    await onEdit(comment.id, content, isSpoiler, isRedacted);
    setShowEditForm(false);
  };

  const isRemoved = comment.content.startsWith("[This comment was removed by moderation");
  const authorDisplay = isRemoved ? "[Removed]" : `u/${comment.authorUsername || comment.author.toLowerCase().replace(/\s+/g, "")}`;
  const avatarDisplay = isRemoved ? "https://api.dicebear.com/9.x/avataaars/svg?seed=removed" : comment.authorAvatar;

  // Collapsed Thread View (Reddit-style)
  if (isCollapsed) {
    return (
      <div 
        id={`comment-${comment.id}`} 
        className="flex items-center gap-2.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer py-1.5 scroll-mt-24 bg-surface-900/10 border-l border-border/10 pl-2 rounded"
        onClick={() => setIsCollapsed(false)}
        title="Expand comment thread"
      >
        <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-800 border border-border/30 opacity-60 flex-shrink-0">
          <img src={avatarDisplay} alt={comment.author} className="w-full h-full object-cover" />
        </div>
        <span className="font-semibold text-text-secondary select-none">{authorDisplay}</span>
        <span className="text-[10px] text-text-muted">{comment.createdAt}</span>
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium">
          <Plus className="w-3 h-3" /> Expand thread ({childReplies.length} {childReplies.length === 1 ? "reply" : "replies"})
        </span>
      </div>
    );
  }

  return (
    <div id={`comment-${comment.id}`} className="space-y-2 scroll-mt-24 relative group/comment">
      {/* Sibling Connector Curve (Only for nested comments depth > 0) */}
      {depth > 0 && (
        <>
          {/* Masking box to cover the parent line below the curve on the last child.
              Starts at top-[15px] so it does not block the curve's bottom border at 14px. */}
          {isLastReply && (
            <div className="absolute -left-[12px] top-[12px] bottom-0 w-[3px] bg-surface-950 pointer-events-none z-20" />
          )}

          {/* Curved Connector Line. Width 25px and height 14px extends from parent line center (-11px) to child avatar center (14px). */}
          <div 
            className={`absolute -left-[11px] top-0 w-[25px] h-[14px] rounded-bl-lg border-l-2 border-b-2 border-border/30 pointer-events-none select-none z-10 transition-colors duration-200 last-reply-curve-${parentIdForLastCurve}`}
          />
        </>
      )}

      {/* Parent thread line collapse hitbox (Only if has child replies). 
          Starts directly under parent avatar (top-7) and runs to the bottom of parent wrapper. */}
      {childReplies.length > 0 && (
        <div 
          onClick={() => setIsCollapsed(true)}
          title="Collapse comment thread"
          className={`absolute left-[8px] top-7 bottom-0 w-[12px] group/line-hitbox-${comment.id} cursor-pointer z-10 select-none`}
        >
          {/* The Vertical Line */}
          <div className={`absolute left-[5px] top-0 bottom-0 w-[2px] bg-border/20 transition-colors duration-200 thread-line-bar-${comment.id}`} />
        </div>
      )}

      {/* Main Comment Box */}
      <div className="flex items-stretch gap-2.5 relative">
        {/* Column 1: Avatar */}
        <div className="flex flex-col items-center flex-shrink-0 w-7 relative select-none z-30">
          {isRemoved ? (
            <div className="w-7 h-7 rounded-full bg-surface-850 border border-border/30 flex items-center justify-center grayscale opacity-60">
              <img src={avatarDisplay} alt="removed" className="w-5 h-5 rounded-full object-cover" />
            </div>
          ) : (
            <Link
              to={comment.authorUsername ? `/app/u/${comment.authorUsername}` : `/app/profile/${comment.authorId}`}
              className="w-7 h-7 rounded-full bg-surface-700 border border-border/30 hover:opacity-80 transition-all flex items-center justify-center overflow-hidden"
            >
              <img src={avatarDisplay} alt={comment.author} className="w-full h-full rounded-full object-cover" />
            </Link>
          )}
        </div>

        {/* Column 2: Content (Protected with z-30) */}
        <div className="flex-1 min-w-0 space-y-2 pb-2 relative z-30">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
              {isRemoved ? (
                <span className="font-semibold text-text-muted select-none">{authorDisplay}</span>
              ) : (
                <Link
                  to={comment.authorUsername ? `/app/u/${comment.authorUsername}` : `/app/profile/${comment.authorId}`}
                  className="font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                  {authorDisplay}
                </Link>
              )}
              {!isRemoved && comment.authorRole !== "Member" && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.25 text-[9px] font-bold rounded bg-primary/10 text-primary border border-primary/20">
                  <Shield className="w-2.5 h-2.5" /> {comment.authorRole}
                </span>
              )}
              {!isRemoved && comment.authorId === threadAuthorId && (
                <span className="inline-flex items-center text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.25 rounded border border-accent/25 uppercase tracking-wide">
                  OP
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-muted">{comment.createdAt}</span>
          </div>

          {/* Solution Banner */}
          {isSolution && (
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded-full mb-1.5">
              <CheckCircle className="w-3 h-3 fill-success/10" /> Accepted Solution
            </div>
          )}

          {/* Content Box */}
          {showEditForm ? (
            <div className="mt-1">
              <CommentForm
                initialValue={comment.content}
                onSubmit={handleUpdateComment}
                onCancel={() => setShowEditForm(false)}
                buttonText="Save Edits"
                autoFocus
              />
            </div>
          ) : (
            <div className="text-text-primary text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {isRemoved ? (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-error/5 border border-error/15 text-xs text-text-muted italic select-none mt-1 shadow-inner">
                  <AlertTriangle className="w-4 h-4 text-error/85 flex-shrink-0 mt-0.5 animate-pulse" />
                  <span>{comment.content.replace(/^\[|\]$/g, "")}</span>
                </div>
              ) : (
                <SpoilerGate isSpoiler={comment.isSpoiler}>
                  <RedactedFormatter content={comment.content} isRedacted={comment.isRedacted} />
                </SpoilerGate>
              )}
            </div>
          )}

          {/* Actions Toolbar */}
          {!showEditForm && (
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-muted border-t border-border/10 pt-1.5 mt-1">
              {isRemoved ? (
                /* Simplified toolbar for moderated comments to preserve replies nesting only */
                !isThreadClosed && user && (
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reply
                  </button>
                )
              ) : (
                /* Full action options for active comments */
                <>
                  <VoteControl
                    score={comment.likes}
                    userVote={comment.userVote}
                    onVote={(direction) => onVote(comment.id, direction)}
                    orientation="horizontal"
                    size="sm"
                    animateClass={(comment as any).voteAnimate}
                  />

                  {!isThreadClosed && user && (
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  )}

                  {canSelectSolution && (
                    <button
                      type="button"
                      onClick={() => onSelectSolution(isSolution ? null : comment.id)}
                      className={`text-[11px] font-medium flex items-center gap-1 transition-colors hover:text-success cursor-pointer ${
                        isSolution ? "text-success" : "text-text-muted"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isSolution ? "Unmark Solution" : "Mark as Solution"}
                    </button>
                  )}

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setShowEditForm(true)}
                      className="flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}

                  {/* Report Comment */}
                  {!isOwner && user && (
                    <button
                      type="button"
                      onClick={() => onReport(comment.id)}
                      className="flex items-center gap-1 font-medium hover:text-error transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report
                    </button>
                  )}

                  {/* Delete Comment */}
                  {(isOwner || isAdmin) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await showConfirm({
                          title: "Delete Comment",
                          message: "Are you sure you want to delete this comment?",
                          type: "danger",
                          confirmText: "Delete",
                        });
                        if (confirmed) {
                          onDelete(comment.id);
                        }
                      }}
                      className="flex items-center gap-1 font-medium hover:text-error transition-colors cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="pt-2">
              <CommentForm
                placeholder={`Reply to u/${comment.authorUsername || comment.author.toLowerCase().replace(/\s+/g, "")}...`}
                buttonText="Post Reply"
                onSubmit={handlePostReply}
                onCancel={() => setShowReplyForm(false)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Recursive replies rendering */}
      {childReplies.length > 0 && (
        <div className={`pl-6 space-y-4 pt-2 relative replies-outer-${comment.id}`}>

          {/* Scoped CSS to highlight both the vertical line and the last child's curve when this thread line hitbox is hovered */}
          <style>{`
            .group\\/line-hitbox-${comment.id}:hover .thread-line-bar-${comment.id} {
              background-color: var(--color-primary, #06b6d4) !important;
              opacity: 0.9 !important;
            }
            .group\\/line-hitbox-${comment.id}:hover ~ .replies-outer-${comment.id} .last-reply-curve-${comment.id} {
              border-color: var(--color-primary, #06b6d4) !important;
              opacity: 0.9 !important;
            }
          `}</style>

          <div className={`space-y-4 replies-container-${comment.id}`}>
            {childReplies.map((reply, index) => {
              const isLast = index === childReplies.length - 1;
              return (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  threadAuthorId={threadAuthorId}
                  isThreadClosed={isThreadClosed}
                  solutionCommentId={solutionCommentId}
                  canSelectSolution={canSelectSolution}
                  onSelectSolution={onSelectSolution}
                  onVote={onVote}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                  allComments={allComments}
                  depth={depth + 1}
                  isLastReply={isLast}
                  parentIdForLastCurve={comment.id}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
