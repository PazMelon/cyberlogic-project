import type { ForumCommentMapped } from "../../utils/api";
import { CommentItem } from "./CommentItem";

interface CommentTreeProps {
  comments: ForumCommentMapped[];
  threadAuthorId: number;
  isThreadClosed: boolean;
  solutionCommentId: number | null;
  canSelectSolution: boolean;
  onSelectSolution: (commentId: number | null) => void;
  onVote: (commentId: number, direction: "up" | "down") => void;
  onReply: (parentId: number, content: string) => Promise<void>;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

export function CommentTree({
  comments,
  threadAuthorId,
  isThreadClosed,
  solutionCommentId,
  canSelectSolution,
  onSelectSolution,
  onVote,
  onReply,
  onEdit,
  onDelete
}: CommentTreeProps) {
  // Find top level comments: where parentId is null
  // Note: if there is any orphan comment, treat it as top-level
  const parentCommentIds = new Set(comments.map((c) => c.id));
  const topLevelComments = comments.filter(
    (c) => c.parentId === null || !parentCommentIds.has(c.parentId)
  );

  if (comments.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-border/40 rounded-xl">
        <p className="text-text-muted text-sm">No comments yet. Be the first to join the discussion!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {topLevelComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          threadAuthorId={threadAuthorId}
          isThreadClosed={isThreadClosed}
          solutionCommentId={solutionCommentId}
          canSelectSolution={canSelectSolution}
          onSelectSolution={onSelectSolution}
          onVote={onVote}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          allComments={comments}
        />
      ))}
    </div>
  );
}
