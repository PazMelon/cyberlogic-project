import { useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Shield, CheckCircle, Trash2, Edit3 } from "lucide-react";
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
  allComments: ForumCommentMapped[];
  depth?: number;
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
  allComments,
  depth = 0
}: CommentItemProps) {
  const { user } = useAuth();
  const { showConfirm } = useDialog();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

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

  return (
    <div className="space-y-2">
      <div
        className={`flex items-start gap-2.5 text-xs sm:text-sm transition-all py-2 px-1 ${
          isSolution
            ? "border border-success bg-success/5 rounded-lg p-2.5 sm:p-3 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
            : "border-none bg-transparent"
        } ${(comment as any).animate || ""}`}
      >
        <Link to={comment.authorUsername ? `/app/u/${comment.authorUsername}` : `/app/profile/${comment.authorId}`} className="hover:opacity-80 flex-shrink-0 mt-0.5">
          <img
            src={comment.authorAvatar}
            alt={comment.author}
            className="w-7 h-7 rounded-full bg-surface-700 object-cover border border-border/30"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={comment.authorUsername ? `/app/u/${comment.authorUsername}` : `/app/profile/${comment.authorId}`} className="font-semibold text-text-secondary hover:text-primary transition-colors">
                u/{comment.authorUsername || comment.author.toLowerCase().replace(/\s+/g, "")}
              </Link>
              {comment.authorRole !== "Member" && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.25 text-[9px] font-bold rounded bg-primary/10 text-primary border border-primary/20">
                  <Shield className="w-2.5 h-2.5" /> {comment.authorRole}
                </span>
              )}
              {comment.authorId === threadAuthorId && (
                <span className="inline-flex items-center text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.25 rounded border border-accent/25 uppercase tracking-wide">
                  OP
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-muted">{comment.createdAt}</span>
          </div>

          {/* Solution Banner */}
          {isSolution && (
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded-full mb-2">
              <CheckCircle className="w-3 h-3 fill-success/10" /> Accepted Solution
            </div>
          )}

          {showEditForm ? (
            <div className="mt-2">
              <CommentForm
                initialValue={comment.content}
                onSubmit={handleUpdateComment}
                onCancel={() => setShowEditForm(false)}
                buttonText="Save Edits"
                autoFocus
              />
            </div>
          ) : (
            <div className="text-text-primary">
              <SpoilerGate isSpoiler={comment.isSpoiler}>
                <RedactedFormatter content={comment.content} isRedacted={comment.isRedacted} />
              </SpoilerGate>
            </div>
          )}

          {/* Comment Action Toolbar */}
          {!showEditForm && (
            <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-text-muted border-t border-border/10 pt-1.5">
              {/* Vote controls */}
              <VoteControl
                score={comment.likes}
                userVote={comment.userVote}
                onVote={(direction) => onVote(comment.id, direction)}
                orientation="horizontal"
                size="sm"
                animateClass={(comment as any).voteAnimate}
              />

              {/* Reply */}
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

              {/* Accepted Answer selection toggle */}
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

              {/* Edit Comment */}
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
            </div>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="pl-4 border-l-2 border-border/45 hover:border-primary/50 transition-colors duration-200">
          <CommentForm
            placeholder={`Reply to u/${comment.authorUsername || comment.author.toLowerCase().replace(/\s+/g, "")}...`}
            buttonText="Post Reply"
            onSubmit={handlePostReply}
            onCancel={() => setShowReplyForm(false)}
            autoFocus
          />
        </div>
      )}

      {/* Recursive replies rendering */}
      {childReplies.length > 0 && (
        <div className="pl-4 border-l-2 border-border/45 hover:border-primary/50 transition-colors duration-200 space-y-2 pt-1">
          {childReplies.map((reply) => (
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
              allComments={allComments}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
