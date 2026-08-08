import React, { useRef, useEffect } from "react";
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

  // Persistent User Cache to remember comment authors across card updates / re-fetches
  const userCacheRef = useRef<Record<string, any>>({});

  // Cache any valid user object from comments or assigned users
  useEffect(() => {
    comments.forEach((cm) => {
      const uId = cm.user_id || cm.user?.id;
      if (uId && cm.user) {
        userCacheRef.current[String(uId)] = cm.user;
      }
    });

    cardAssignedUsers.forEach((u) => {
      if (u && u.id) {
        userCacheRef.current[String(u.id)] = u;
      }
    });
  }, [comments, cardAssignedUsers]);

  const handleReplyComment = (cm: any) => {
    const authorHandle = cm.user?.username || cm.user?.name || "member";
    const mentionTag = `@${authorHandle.replace(/\s+/g, "")} `;
    setNewComment((prev) => {
      if (prev.includes(mentionTag.trim())) return prev;
      return prev ? `${prev} ${mentionTag}` : mentionTag;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 sm:p-4">
      {/* Top Header (Fixed) */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50 flex-shrink-0">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Comments ({comments.length})</span>
        </h4>
      </div>

      {/* Middle Comments List (The ONLY Scroll Container) */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 py-2 pr-1 min-h-0">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted italic bg-surface-800/30 rounded-xl border border-border/40 p-4">
            No discussion comments yet. Be the first to share a note or update!
          </div>
        ) : (
          <>
            {visibleComments.map((cm) => {
              const commentUserId = cm.user_id || cm.user?.id;
              const canDelete =
                isAdmin ||
                (currentUserId && commentUserId && Number(currentUserId) === Number(commentUserId)) ||
                (boardHostId && currentUserId && Number(currentUserId) === Number(boardHostId));

              // 1. Check user relation directly on comment
              let userObj = cm.user;

              // 2. Check persistent user cache
              if (!userObj && commentUserId) {
                userObj = userCacheRef.current[String(commentUserId)];
              }

              // 3. Check assigned users
              if (!userObj && commentUserId) {
                userObj = cardAssignedUsers.find((u: any) => Number(u.id) === Number(commentUserId));
              }

              // Resolve author display name
              let authorName = "";
              if (userObj) {
                authorName =
                  userObj.first_name || userObj.last_name
                    ? `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim()
                    : userObj.name || userObj.username;
              }

              if (!authorName) {
                authorName =
                  cm.first_name || cm.last_name
                    ? `${cm.first_name || ""} ${cm.last_name || ""}`.trim()
                    : cm.user_name || cm.author_name || cm.name || cm.username || "Member";
              }

              const avatarUrl = getAvatarUrl(
                userObj?.avatar || cm.avatar || cm.user_avatar,
                authorName
              );

              return (
                <div
                  key={`card-comment-${cm.id}`}
                  className="p-3 rounded-2xl bg-surface-800/60 border border-border/50 space-y-1.5 transition-all hover:bg-surface-800/80 group/comment"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={avatarUrl}
                        alt={authorName}
                        className="w-5 h-5 rounded-full object-cover border border-border flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-text-primary truncate">
                        {authorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] text-text-muted">{formatDate(cm.created_at)}</span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(cm.id)}
                          className="p-1 text-text-muted hover:text-error opacity-0 group-hover/comment:opacity-100 transition-opacity cursor-pointer rounded-md hover:bg-surface-700"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap pl-7">
                    <MentionText content={cm.content} />
                  </div>

                  {/* Comment Footer Actions */}
                  <div className="flex items-center justify-end pt-1 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => handleReplyComment(cm)}
                      className="text-[10px] font-bold text-text-muted hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
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
                className="w-full py-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl border border-cyan-500/20 transition-all cursor-pointer text-center"
              >
                Load More Comments ({comments.length - visibleCommentsCount} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {/* Sticky Bottom Comment Editor Box */}
      <form
        onSubmit={onSubmitComment}
        className="flex-shrink-0 pt-2.5 border-t border-border/60 bg-surface-900 space-y-2"
      >
        <div className="rounded-2xl bg-surface-800/90 border border-border/80 p-2.5 shadow-inner space-y-2 focus-within:border-cyan-500/60 transition-all">
          <MentionTextArea
            value={newComment}
            onValueChange={setNewComment}
            maxLength={1000}
            rows={2}
            className="text-xs p-2 bg-transparent border-0 min-h-[50px] max-h-[120px] resize-none shadow-none text-text-primary placeholder:text-text-muted/60 focus:ring-0 focus:outline-none"
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
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
          <span className="text-[10px] text-text-muted/80">
            Use <strong className="text-cyan-400 font-extrabold">@name</strong> to mention members
          </span>

          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-surface-950 font-extrabold text-xs hover:bg-cyan-400 flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all disabled:opacity-40"
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
    </div>
  );
};

export default CardCommentsSection;
