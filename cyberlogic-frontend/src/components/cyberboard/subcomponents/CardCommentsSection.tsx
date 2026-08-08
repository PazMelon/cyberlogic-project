import React from "react";
import { MessageSquare, Send, Loader2, Trash2, Reply } from "lucide-react";
import MentionTextArea from "../../ui/MentionTextArea";
import MentionText from "../MentionText";
import { getAvatarUrl } from "../../../utils/api";
import { formatDate } from "../shared/cyberboardUtils";

interface CardCommentsSectionProps {
  comments: any[];
  newComment: string;
  setNewComment: (val: string | ((prev: string) => string)) => void;
  isSubmitting: boolean;
  visibleCommentsCount: number;
  setVisibleCommentsCount: React.Dispatch<React.SetStateAction<number>>;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  currentUserId?: number;
  boardHostId?: number;
  cardUserId?: number;
  cardAssignedUsers?: any[];
  isAdmin?: boolean;
  onSubmitComment: (e: React.FormEvent) => void;
  onDeleteComment: (commentId: number) => Promise<void>;
}

export const CardCommentsSection: React.FC<CardCommentsSectionProps> = ({
  comments,
  newComment,
  setNewComment,
  isSubmitting,
  visibleCommentsCount,
  setVisibleCommentsCount,
  boardVisibility = "public",
  allowedMembers = [],
  currentUserId,
  boardHostId,
  cardUserId,
  cardAssignedUsers = [],
  isAdmin,
  onSubmitComment,
  onDeleteComment,
}) => {
  const visibleComments = comments.slice(0, visibleCommentsCount);
  const hasMoreComments = comments.length > visibleCommentsCount;

  const handleCommentsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40 && hasMoreComments) {
      setVisibleCommentsCount((prev) => Math.min(prev + 10, comments.length));
    }
  };

  const handleReplyComment = (cm: any) => {
    const authorHandle = cm.user?.username || cm.user?.name || "member";
    const mentionTag = `@${authorHandle.replace(/\s+/g, "")} `;
    setNewComment((prev) => {
      if (prev.includes(mentionTag.trim())) return prev;
      return prev ? `${prev} ${mentionTag}` : mentionTag;
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Comments ({comments.length})</span>
        </h4>
      </div>

      <form
        onSubmit={onSubmitComment}
        className="rounded-2xl bg-surface-800/80 border border-border/80 p-3 shadow-inner space-y-2.5 focus-within:border-primary/60 transition-all"
      >
        <MentionTextArea
          value={newComment}
          onValueChange={setNewComment}
          maxLength={1000}
          allowedUserIds={
            boardVisibility === "private"
              ? [
                  ...(allowedMembers || []),
                  ...(currentUserId ? [currentUserId] : []),
                  ...(boardHostId ? [boardHostId] : []),
                  ...(cardUserId ? [cardUserId] : []),
                  ...cardAssignedUsers.map((u) => u.id),
                ]
              : undefined
          }
          isPrivateBoard={boardVisibility === "private"}
          rows={2}
          containerClassName="w-full min-w-0"
          placeholder={
            boardVisibility === "private"
              ? "Write a comment... (Use @ to mention private board members)"
              : "Write a comment... (Use @ to mention anyone or groups)"
          }
          className="w-full px-3 py-2 rounded-xl bg-surface-900/60 border border-border/40 text-xs text-text-primary focus:border-primary/80 focus:outline-none transition-all resize-y min-h-[56px] max-h-[160px]"
        />
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
          <span className="text-[11px] text-text-muted flex items-center gap-1.5">
            <span className="font-bold text-primary">@</span>{" "}
            {boardVisibility === "private" ? "Mention board members" : "Mention members or groups"}
          </span>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-light text-surface-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      <div
        onScroll={handleCommentsScroll}
        className="space-y-3 min-h-[140px] max-h-[380px] overflow-y-auto pr-1 scrollbar-thin"
      >
        {comments.length === 0 ? (
          <p className="text-xs text-text-muted italic text-center py-6">
            No comments yet. Start the conversation!
          </p>
        ) : (
          <>
            {visibleComments.map((cm) => {
              const commenterName = cm.user
                ? `${cm.user.first_name || ""} ${cm.user.last_name || ""}`.trim() || cm.user.name || cm.user.username || "Member"
                : "Member";
              const commenterAvatar = getAvatarUrl(cm.user?.avatar || (cm.user as any)?.avatar_path, commenterName);
              const canDeleteCm = cm.user_id === currentUserId || isAdmin;

              return (
                <div
                  key={cm.id}
                  className="p-3.5 rounded-xl bg-surface-800/50 border border-border/40 space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={commenterAvatar}
                        alt={commenterName}
                        className="w-5 h-5 rounded-full border border-border object-cover"
                      />
                      <span className="text-xs font-bold text-text-primary">{commenterName}</span>
                      <span className="text-[10px] text-text-muted">{formatDate(cm.created_at)}</span>
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

                  <div className="text-xs text-text-secondary leading-relaxed pl-7 whitespace-pre-wrap">
                    <MentionText content={cm.content} />
                  </div>

                  <div className="flex items-center justify-between pt-1 pl-7 border-t border-border/20">
                    <button
                      type="button"
                      onClick={() => handleReplyComment(cm)}
                      className="text-[11px] font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {hasMoreComments && (
              <button
                type="button"
                onClick={() => setVisibleCommentsCount((prev) => Math.min(prev + 10, comments.length))}
                className="w-full py-2.5 text-xs font-bold text-primary hover:text-primary-light bg-primary/10 hover:bg-primary/20 rounded-xl border border-primary/20 transition-all cursor-pointer text-center"
              >
                Load More Comments ({comments.length - visibleCommentsCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CardCommentsSection;
