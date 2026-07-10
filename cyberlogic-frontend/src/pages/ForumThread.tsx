import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Eye,
  Share2,
  Flag,
  CheckCircle,
  Award,
  Bookmark,
  Info,
  Calendar,
  MessageSquare,
  Pin,
  Lock,
  Unlock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useDialog } from "../utils/useDialog";
import {
  fetchForumThread,
  fetchForumComments,
  createForumComment,
  updateForumComment,
  deleteForumComment,
  voteThread,
  voteComment,
  toggleThreadPin,
  toggleThreadClose,
  toggleThreadSolve,
  fetchForumCategories,
  voteForumPoll,
  closeForumPoll
} from "../utils/api";
import type {
  ForumThreadMapped,
  ForumCommentMapped,
  ForumCategoryMapped
} from "../utils/api";
import {
  VoteControl,
  CommentTree,
  CommentForm,
  SpoilerGate,
  RedactedFormatter,
  ImageCarousel,
  FullscreenImageViewer
} from "../components/forum";

export default function ForumThread() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const { showAlert } = useDialog();

  const [thread, setThread] = useState<ForumThreadMapped | null>(null);
  const [comments, setComments] = useState<ForumCommentMapped[]>([]);
  const [categories, setCategories] = useState<ForumCategoryMapped[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVotingPoll, setIsVotingPoll] = useState(false);

  // Auth checking for toggle buttons
  const isThreadOwner = user && thread && user.id === thread.authorId;
  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");

  const loadData = async () => {
    if (!threadId) return;
    try {
      setIsLoading(true);
      const [threadData, commentsData, categoriesData] = await Promise.all([
        fetchForumThread(Number(threadId)),
        fetchForumComments(Number(threadId)),
        fetchForumCategories()
      ]);
      setThread(threadData);
      setComments(commentsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load thread details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [threadId]);

  useEffect(() => {
    if (!user || !threadId) return;
    const saved = JSON.parse(localStorage.getItem(`cl-saved-threads-${user.id}`) || "[]");
    setIsSaved(saved.some((t: any) => t.id === Number(threadId)));
  }, [threadId, user]);

  const handleToggleSave = () => {
    if (!user || !thread) return;
    const key = `cl-saved-threads-${user.id}`;
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    let newSaved;
    if (isSaved) {
      newSaved = saved.filter((t: any) => t.id !== thread.id);
      setIsSaved(false);
    } else {
      if (!saved.some((t: any) => t.id === thread.id)) {
        newSaved = [...saved, thread];
      } else {
        newSaved = saved;
      }
      setIsSaved(true);
    }
    localStorage.setItem(key, JSON.stringify(newSaved));
  };

  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!threadId) return;

    const unsubscribe = subscribe(`forums:thread:${threadId}`, (payload) => {
      if (payload.event === "comment_created") {
        setComments((prev) => {
          if (prev.some((c) => c.id === payload.comment.id)) return prev;
          return [...prev, { ...payload.comment, animate: "animate-message-arrive" }];
        });
      } else if (payload.event === "thread_solved") {
        setThread((prev) =>
          prev ? { ...prev, solved: payload.solved, solutionCommentId: payload.solutionCommentId } : null
        );
        setComments((prev) =>
          prev.map((c) => ({
            ...c,
            isBestAnswer: c.id === payload.solutionCommentId,
          }))
        );
      } else if (payload.event === "thread_voted") {
        setThread((prev) => {
          if (!prev) return null;
          const isUpvote = payload.likes > prev.likes;
          return {
            ...prev,
            likes: payload.likes,
            voteAnimate: isUpvote ? "animate-vote-up" : "animate-vote-down",
          };
        });
      } else if (payload.event === "comment_voted") {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== payload.commentId) return c;
            const isUpvote = payload.likes > c.likes;
            return {
              ...c,
              likes: payload.likes,
              voteAnimate: isUpvote ? "animate-vote-up" : "animate-vote-down",
            };
          })
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [threadId, subscribe]);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-24 bg-surface-800 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-64 bg-surface-900/30 rounded-xl border border-border/50" />
            <div className="h-96 bg-surface-900/30 rounded-xl border border-border/50" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-48 bg-surface-900/30 rounded-xl border border-border/50" />
            <div className="h-48 bg-surface-900/30 rounded-xl border border-border/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Thread Not Found</h2>
        <p className="text-text-muted mb-4">The thread you're looking for doesn't exist.</p>
        <Link to="/app/forums" className="text-primary hover:text-primary-light font-medium">
          Back to Forums
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === thread.categoryId);

  const selectedColorClass =
    category?.color === "primary"
      ? "bg-primary/10 border-primary/20 text-primary"
      : category?.color === "accent"
      ? "bg-accent/10 border-accent/20 text-accent"
      : category?.color === "success"
      ? "bg-success/10 border-success/20 text-success"
      : category?.color === "error"
      ? "bg-error/10 border-error/20 text-error"
      : "bg-warning/10 border-warning/20 text-warning";

  const handleThreadVoteAction = async (direction: "up" | "down") => {
    try {
      const val = direction === "up" ? 1 : -1;
      const res = await voteThread(thread.id, val);
      setThread({
        ...thread,
        likes: res.vote_score,
        userVote: res.user_vote
      });
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleCommentVoteAction = async (commentId: number, direction: "up" | "down") => {
    try {
      const val = direction === "up" ? 1 : -1;
      const res = await voteComment(commentId, val);
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? { ...c, likes: res.vote_score, userVote: res.user_vote }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to vote comment:", err);
    }
  };

  const handlePostTopComment = async (content: string, isSpoiler?: boolean, isRedacted?: boolean) => {
    if (!thread) return;
    const newComment = await createForumComment(thread.id, { content, is_spoiler: isSpoiler, is_redacted: isRedacted });
    setComments([...comments, newComment]);
  };

  const handlePostReply = async (parentId: number, content: string, isSpoiler?: boolean, isRedacted?: boolean) => {
    if (!thread) return;
    const newComment = await createForumComment(thread.id, { content, parent_id: parentId, is_spoiler: isSpoiler, is_redacted: isRedacted });
    setComments([...comments, newComment]);
  };

  const handleEditComment = async (commentId: number, content: string, isSpoiler?: boolean, isRedacted?: boolean) => {
    const updated = await updateForumComment(commentId, { content, is_spoiler: isSpoiler, is_redacted: isRedacted });
    setComments(comments.map((c) => (c.id === commentId ? updated : c)));
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteForumComment(commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const handleSelectSolution = async (commentId: number | null) => {
    try {
      const updatedThread = await toggleThreadSolve(thread.id, commentId);
      setThread(updatedThread);
    } catch (err) {
      console.error("Failed to set thread solution:", err);
    }
  };

  const handleTogglePin = async () => {
    try {
      const updated = await toggleThreadPin(thread.id);
      setThread(updated);
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleToggleClose = async () => {
    try {
      const updated = await toggleThreadClose(thread.id);
      setThread(updated);
    } catch (err) {
      console.error("Failed to toggle close status:", err);
    }
  };

  const handleVotePoll = async (optionId: number) => {
    if (!thread || !thread.poll || isVotingPoll) return;
    if (!user) {
      showAlert({
        title: "Authentication Required",
        message: "You must be logged in to vote.",
        type: "warning",
      });
      return;
    }
    try {
      setIsVotingPoll(true);
      const updatedPoll = await voteForumPoll(thread.poll.id, optionId);
      setThread({
        ...thread,
        poll: updatedPoll
      });
    } catch (err: any) {
      showAlert({
        title: "Vote Failed",
        message: err.message || "Failed to submit vote.",
        type: "error",
      });
    } finally {
      setIsVotingPoll(false);
    }
  };

  const handleClosePoll = async () => {
    if (!thread || !thread.poll) return;
    try {
      const updatedPoll = await closeForumPoll(thread.poll.id);
      setThread({
        ...thread,
        poll: updatedPoll
      });
    } catch (err: any) {
      showAlert({
        title: "Failed to Close Poll",
        message: err.message || "Failed to close poll.",
        type: "error",
      });
    }
  };

  // Condition to allow thread author to select solution
  const canSelectSolution = !!(user && category?.type === "support" && isThreadOwner);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/app/forums"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Forums
      </Link>

      {/* 2-Column Reddit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post and Comments */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Thread Card */}
          <div className="glass rounded-xl overflow-hidden border border-border flex">
            {/* Reddit Vote Panel */}
            <div className="hidden sm:flex flex-col items-center gap-1 py-4 px-3 bg-surface-900/30 border-r border-border/50 text-center w-12 flex-shrink-0">
              <VoteControl
                score={thread.likes}
                userVote={thread.userVote}
                onVote={handleThreadVoteAction}
                orientation="vertical"
                size="md"
                animateClass={thread.voteAnimate}
              />
            </div>

            {/* Post Detail Body */}
            <div className="flex-1 p-5 sm:p-6 space-y-4">
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${selectedColorClass}`}
                  >
                    {category.name}
                  </span>
                )}
                {thread.solved && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-2.5 h-2.5" /> Solved
                  </span>
                )}
                {thread.pinned && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                {thread.closed && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-error bg-error/10 border border-error/20 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" /> Closed
                  </span>
                )}

                <span className="text-[10px] text-text-muted">
                  Posted by{" "}
                  <Link to={thread.authorUsername ? `/app/u/${thread.authorUsername}` : `/app/profile/${thread.authorId}`} className="font-semibold text-text-secondary hover:text-primary transition-colors">
                    u/{thread.authorUsername || thread.author.toLowerCase().replace(/\s+/g, "")}
                  </Link>
                </span>
                <span className="text-[10px] text-text-muted">{thread.createdAt}</span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary leading-tight">
                {thread.title}
              </h1>

              {/* Post Content HTML */}
              <SpoilerGate isSpoiler={thread.isSpoiler}>
                <div className="text-sm text-text-secondary leading-relaxed space-y-3 pt-2">
                  <RedactedFormatter content={thread.content} isRedacted={thread.isRedacted} />
                </div>
                {thread.images && thread.images.length > 0 && (
                  <ImageCarousel
                    images={thread.images}
                    onImageClick={(imgIndex) => {
                      setActiveImageIndex(imgIndex);
                      setIsViewerOpen(true);
                    }}
                  />
                )}
              </SpoilerGate>

              {/* Poll Section */}
              {thread.poll && (
                <div className="mt-6 p-4 rounded-xl bg-surface-900/50 border border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-primary rounded-full inline-block" />
                      {thread.poll.question}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        thread.poll.isClosed 
                          ? "bg-error/10 text-error border border-error/20" 
                          : "bg-success/10 text-success border border-success/20 animate-pulse"
                      }`}>
                        {thread.poll.isClosed ? "Poll Closed" : "Active Poll"}
                      </span>
                      {/* Close Poll Option for author/admin */}
                      {!thread.poll.isClosed && (isThreadOwner || isAdmin) && (
                        <button
                          type="button"
                          onClick={handleClosePoll}
                          className="text-[10px] text-error hover:text-error-light hover:underline font-bold transition-all cursor-pointer"
                        >
                          Close Poll
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {thread.poll.options.map((option) => {
                      const percentage = thread.poll!.totalVotes > 0 
                        ? Math.round((option.votesCount / thread.poll!.totalVotes) * 100) 
                        : 0;
                      const hasVotedThis = thread.poll!.userVotedOptionId === option.id;
                      const canVote = !thread.poll!.isClosed && user;

                      return (
                        <div key={option.id} className="relative group/opt">
                          {/* Vote Option Button/Card */}
                          <button
                            type="button"
                            disabled={!canVote}
                            onClick={() => handleVotePoll(option.id)}
                            className={`w-full text-left relative overflow-hidden rounded-xl border p-3 flex items-center justify-between transition-all ${
                              hasVotedThis 
                                ? "border-primary bg-primary/5" 
                                : canVote 
                                  ? "border-border/60 bg-surface-950/40 hover:border-primary/40 hover:bg-surface-900/40" 
                                  : "border-border/30 bg-surface-950/20"
                            } ${!canVote ? "cursor-default" : "cursor-pointer"}`}
                          >
                            {/* Fill Percentage bar */}
                            <div 
                              className={`absolute left-0 top-0 bottom-0 transition-all duration-500 pointer-events-none ${
                                hasVotedThis ? "bg-primary/10" : "bg-white/5"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />

                            <span className="relative text-xs font-semibold text-text-secondary flex items-center gap-2">
                              {hasVotedThis && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
                              {option.optionText}
                            </span>

                            <span className="relative text-xs font-bold text-text-primary flex items-center gap-1">
                              <span>{option.votesCount} votes</span>
                              <span className="text-text-muted">({percentage}%)</span>
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-text-muted flex justify-between">
                    <span>Total Votes: {thread.poll.totalVotes}</span>
                    {!user && !thread.poll.isClosed && (
                      <span className="text-primary font-medium">Log in to cast your vote</span>
                    )}
                  </div>
                </div>
              )}

              {/* Post Footer Action Toolbar */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {comments.length} comments
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {thread.views} views
                </span>

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-2.5 border-l border-border/40 pl-3">
                    <button
                      type="button"
                      onClick={handleTogglePin}
                      className={`inline-flex items-center gap-1 hover:text-warning transition-colors font-medium cursor-pointer ${
                        thread.pinned ? "text-warning" : ""
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{thread.pinned ? "Unpin" : "Pin"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleClose}
                      className={`inline-flex items-center gap-1 hover:text-error transition-colors font-medium cursor-pointer ${
                        thread.closed ? "text-error" : ""
                      }`}
                    >
                      {thread.closed ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1 hover:text-primary transition-colors ml-auto cursor-pointer ${
                    isSaved ? "text-primary font-medium" : ""
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-primary/20" : ""}`} />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-accent transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-error transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </div>
          </div>

          {/* Comments/Replies Section */}
          <div className="glass rounded-xl p-5 sm:p-6 space-y-6">
            <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-heading)] border-b border-border pb-3">
              Comments ({comments.length})
            </h2>

            {/* Comment Form for new top level comment */}
            {thread.closed ? (
              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-medium">
                <Lock className="w-4 h-4" /> This thread is closed and no longer accepting comments.
              </div>
            ) : user ? (
              <div className="flex gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-surface-700 mt-1 flex-shrink-0 object-cover"
                />
                <div className="flex-1">
                  <CommentForm onSubmit={handlePostTopComment} placeholder="Add a comment..." />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-surface-900/30 border border-border/40 text-text-muted rounded-xl text-xs text-center">
                Please login to participate in discussions.
              </div>
            )}

            {/* Nested Comments Tree */}
            <div className="pt-2">
              <CommentTree
                comments={comments}
                threadAuthorId={thread.authorId}
                isThreadClosed={thread.closed}
                solutionCommentId={thread.solutionCommentId}
                canSelectSolution={canSelectSolution}
                onSelectSolution={handleSelectSolution}
                onVote={handleCommentVoteAction}
                onReply={handlePostReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Panels */}
        <div className="lg:col-span-4">
          <div className="space-y-6 sticky top-20">
            {/* About Category/Community Card */}
            <div className="glass rounded-xl overflow-hidden border border-border">
              <div className="h-4 bg-gradient-to-r from-primary/35 to-accent/35" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Category details
                  </h3>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary leading-tight">
                    {category?.name || "Forums"}
                  </h4>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {category?.description || "Exchange cyber knowledge with members."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-border">
                  <div>
                    <span className="text-[10px] text-text-muted block">Total Threads</span>
                    <span className="text-xs font-bold text-text-primary">
                      {category?.threadCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Type</span>
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      {category?.type || "discussion"}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-text-muted space-y-1">
                  <p className="font-semibold text-text-secondary uppercase">Community Rules:</p>
                  <p>1. Respect each other.</p>
                  <p>2. Do not share illegal exploits/cracks.</p>
                  <p>3. Use appropriate category tags.</p>
                </div>
              </div>
            </div>

            {/* Original Poster Card */}
            <div className="glass rounded-xl p-4 border border-border space-y-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" /> About Author
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={thread.authorAvatar}
                  alt={thread.author}
                  className="w-10 h-10 rounded-full bg-surface-700 object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-text-primary">{thread.author}</p>
                  <span className="inline-flex items-center text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.25 rounded mt-0.5 uppercase tracking-wide">
                    {thread.authorRole}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined Cyberlogic Club</span>
              </div>
              <Link
                to={thread.authorUsername ? `/app/u/${thread.authorUsername}` : `/app/profile/${thread.authorId}`}
                className="w-full flex items-center justify-center py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary text-xs font-semibold border border-border transition-all"
              >
                View Author Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
      {thread?.images && (
        <FullscreenImageViewer
          images={thread.images}
          initialIndex={activeImageIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
