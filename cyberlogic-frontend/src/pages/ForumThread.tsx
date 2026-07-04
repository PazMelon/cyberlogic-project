import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Eye,
  Share2,
  Flag,
  CheckCircle,
  Award,
  Send,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Info,
  Calendar,
  MessageSquare,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumThreads, forumReplies, forumCategories } from "../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";
import { Button } from "../components/ui";

export default function ForumThread() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const thread = forumThreads.find((t) => t.id === Number(threadId));
  const initialReplies = forumReplies.filter((r) => r.threadId === Number(threadId));

  const [isLoading, setIsLoading] = useState(true);
  const [replies, setReplies] = useState(initialReplies);
  const [replyText, setReplyText] = useState("");

  const [threadVote, setThreadVote] = useState<"up" | "down" | null>(null);
  const [threadLikes, setThreadLikes] = useState(thread?.likes || 0);

  const [replyVotes, setReplyVotes] = useState<Record<number, "up" | "down" | null>>({});
  const [replyLikes, setReplyLikes] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    initialReplies.forEach((r) => {
      initial[r.id] = r.likes;
    });
    return initial;
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

  const category = forumCategories.find((c) => c.id === thread.categoryId);

  const handleThreadVote = (type: "up" | "down") => {
    if (threadVote === type) {
      setThreadVote(null);
      setThreadLikes(threadLikes + (type === "up" ? -1 : 1));
    } else {
      let delta = type === "up" ? 1 : -1;
      if (threadVote !== null) {
        delta *= 2;
      }
      setThreadVote(type);
      setThreadLikes(threadLikes + delta);
    }
  };

  const handleReplyVote = (replyId: number, type: "up" | "down") => {
    const currentVote = replyVotes[replyId] || null;
    const currentLikesVal = replyLikes[replyId] ?? 0;

    if (currentVote === type) {
      setReplyVotes({ ...replyVotes, [replyId]: null });
      setReplyLikes({ ...replyLikes, [replyId]: currentLikesVal + (type === "up" ? -1 : 1) });
    } else {
      let delta = type === "up" ? 1 : -1;
      if (currentVote !== null) {
        delta *= 2;
      }
      setReplyVotes({ ...replyVotes, [replyId]: type });
      setReplyLikes({ ...replyLikes, [replyId]: currentLikesVal + delta });
    }
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;

    const newReply = {
      id: Date.now(),
      threadId: thread.id,
      author: user.name,
      authorAvatar: user.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
      authorRole: user.role || "Member",
      content: replyText,
      likes: 0,
      createdAt: "Just now",
      isBestAnswer: false,
    };

    setReplies([...replies, newReply]);
    setReplyLikes({ ...replyLikes, [newReply.id]: 0 });
    setReplyText("");
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
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
              <button
                type="button"
                onClick={() => handleThreadVote("up")}
                className={`p-1 rounded hover:bg-white/5 transition-colors ${
                  threadVote === "up" ? "text-primary" : "text-text-muted hover:text-text-primary"
                }`}
                aria-label="Upvote"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <span className={`text-xs font-bold font-mono ${
                threadVote === "up" ? "text-primary" : threadVote === "down" ? "text-error" : "text-text-primary"
              }`}>
                {threadLikes}
              </span>
              <button
                type="button"
                onClick={() => handleThreadVote("down")}
                className={`p-1 rounded hover:bg-white/5 transition-colors ${
                  threadVote === "down" ? "text-error" : "text-text-muted hover:text-text-primary"
                }`}
                aria-label="Downvote"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Post Detail Body */}
            <div className="flex-1 p-5 sm:p-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="flex items-center gap-2">
                    <SkeletonLine widthClass="w-16" heightClass="h-4" />
                    <SkeletonLine widthClass="w-32" heightClass="h-3" />
                  </div>
                  <SkeletonLine widthClass="w-5/6" heightClass="h-7" />
                  <div className="space-y-2 pt-2">
                    <SkeletonLine widthClass="w-full" heightClass="h-4" />
                    <SkeletonLine widthClass="w-full" heightClass="h-4" />
                    <SkeletonLine widthClass="w-2/3" heightClass="h-4" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Header Info */}
                  <div className="flex flex-wrap items-center gap-2">
                    {category && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${selectedColorClass}`}>
                        {category.name}
                      </span>
                    )}
                    {thread.solved && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" /> Solved
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">
                      Posted by <span className="font-medium text-text-secondary">u/{thread.author.toLowerCase().replace(/\s+/g, "")}</span>
                    </span>
                    <span className="text-[10px] text-text-muted">{thread.createdAt}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary leading-tight">
                    {thread.title}
                  </h1>

                  {/* Post Content HTML */}
                  <div className="text-sm text-text-secondary leading-relaxed space-y-3 whitespace-pre-wrap pt-2">
                    {thread.content}
                  </div>

                  {/* Post Footer Action Toolbar */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {replies.length} comments
                    </span>
                    <span className="inline-flex items-center gap-1 sm:hidden">
                      <Heart className="w-3.5 h-3.5" /> {threadLikes} likes
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {thread.views} views
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsSaved(!isSaved)}
                      className={`inline-flex items-center gap-1 hover:text-primary transition-colors ml-auto ${
                        isSaved ? "text-primary font-medium" : ""
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-primary/20" : ""}`} />
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 hover:text-error transition-colors">
                      <Flag className="w-3.5 h-3.5" /> Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Comments/Replies Section */}
          <div className="glass rounded-xl p-5 sm:p-6 space-y-6">
            <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-heading)] border-b border-border pb-3">
              Comments ({replies.length})
            </h2>

            {/* Comment Form */}
            {user && (
              <form onSubmit={handlePostReply} className="flex gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-surface-700 mt-1 flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!replyText.trim()}
                      variant="primary"
                      className="px-4 py-2 text-xs"
                      icon={<Send className="w-3 h-3" />}
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Replies List */}
            <div className="space-y-4 pt-2">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <SkeletonCircle className="w-8 h-8 bg-surface-800 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonLine widthClass="w-1/4" heightClass="h-3" />
                        <SkeletonLine widthClass="w-full" heightClass="h-4" />
                        <SkeletonLine widthClass="w-5/6" heightClass="h-4" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                replies.map((reply) => {
                  const currentVote = replyVotes[reply.id] || null;
                  const currentLikes = replyLikes[reply.id] ?? reply.likes;

                  return (
                    <div key={reply.id} className="flex items-start gap-3 text-sm group">
                      <img
                        src={reply.authorAvatar}
                        alt={reply.author}
                        className="w-8 h-8 rounded-full bg-surface-700 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0 bg-surface-900/20 rounded-xl p-3.5 border border-border/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-text-secondary">
                            u/{reply.author.toLowerCase().replace(/\s+/g, "")}
                          </span>
                          <span className="text-[10px] text-text-muted">{reply.createdAt}</span>
                        </div>
                        <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{reply.content}</p>

                        {/* Reply Action Toolbar */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-text-muted border-t border-border/10 pt-2.5">
                          <div className="flex items-center gap-1.5 bg-surface-850 px-2 py-0.5 rounded-lg border border-border/45">
                            <button
                              type="button"
                              onClick={() => handleReplyVote(reply.id, "up")}
                              className={`hover:text-primary transition-colors ${
                                currentVote === "up" ? "text-primary" : ""
                              }`}
                              aria-label="Upvote reply"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-[10px] font-bold font-mono ${
                              currentVote === "up" ? "text-primary" : currentVote === "down" ? "text-error" : "text-text-muted"
                            }`}>
                              {currentLikes}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReplyVote(reply.id, "down")}
                              className={`hover:text-error transition-colors ${
                                currentVote === "down" ? "text-error" : ""
                              }`}
                              aria-label="Downvote reply"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button type="button" className="text-[11px] font-medium hover:text-primary transition-colors">
                            Reply
                          </button>
                          
                          <button type="button" className="text-[11px] font-medium hover:text-error transition-colors ml-auto">
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <SkeletonLine widthClass="w-1/2" heightClass="h-4" />
                    <SkeletonLine widthClass="w-full" heightClass="h-3" />
                    <SkeletonLine widthClass="w-5/6" heightClass="h-3" />
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-text-primary leading-tight">
                      {category?.name || "Forums"}
                    </h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {category?.description || "Exchange cyber knowledge with members."}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-border">
                  <div>
                    <span className="text-[10px] text-text-muted block">Total Threads</span>
                    <span className="text-xs font-bold text-text-primary">
                      {isLoading ? <SkeletonLine widthClass="w-6" heightClass="h-3.5" /> : (category?.threadCount || 10)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Members Online</span>
                    <span className="text-xs font-bold text-success">🟢 14</span>
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
              {isLoading ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <SkeletonCircle className="w-10 h-10 bg-surface-800" />
                  <div className="space-y-2 flex-1">
                    <SkeletonLine widthClass="w-1/2" heightClass="h-3.5" />
                    <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <img
                      src={thread.authorAvatar}
                      alt={thread.author}
                      className="w-10 h-10 rounded-full bg-surface-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-text-primary">{thread.author}</p>
                      <span className="inline-flex items-center text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.25 rounded mt-0.5 uppercase tracking-wide">
                        Original Poster
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined July 2025</span>
                  </div>
                  <Link
                    to={`/app/profile?name=${encodeURIComponent(thread.author)}`}
                    className="w-full flex items-center justify-center py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary text-xs font-semibold border border-border transition-all"
                  >
                    View Author Profile
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
