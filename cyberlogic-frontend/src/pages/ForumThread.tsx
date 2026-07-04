import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumThreads, forumReplies, forumCategories } from "../data/mockData";

export default function ForumThread() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const thread = forumThreads.find((t) => t.id === Number(threadId));
  const initialReplies = forumReplies.filter((r) => r.threadId === Number(threadId));

  // State to manage mock replies (allows typing and posting a reply live!)
  const [replies, setReplies] = useState(initialReplies);
  const [replyText, setReplyText] = useState("");

  // Upvote/Downvote states for main thread
  const [threadVote, setThreadVote] = useState<"up" | "down" | null>(null);
  const [threadLikes, setThreadLikes] = useState(thread?.likes || 0);

  // Upvote/Downvote states for replies
  const [replyVotes, setReplyVotes] = useState<Record<number, "up" | "down" | null>>({});
  const [replyLikes, setReplyLikes] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    initialReplies.forEach((r) => {
      initial[r.id] = r.likes;
    });
    return initial;
  });

  const [isSaved, setIsSaved] = useState(false);

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
      // Undo vote
      setThreadVote(null);
      setThreadLikes(threadLikes + (type === "up" ? -1 : 1));
    } else {
      // Calculate delta
      let delta = type === "up" ? 1 : -1;
      if (threadVote !== null) {
        // If switching votes, delta is doubled
        delta *= 2;
      }
      setThreadVote(type);
      setThreadLikes(threadLikes + delta);
    }
  };

  const handleReplyVote = (replyId: number, type: "up" | "down") => {
    const currentVote = replyVotes[replyId] || null;
    const currentLikes = replyLikes[replyId] !== undefined ? replyLikes[replyId] : 0;

    if (currentVote === type) {
      setReplyVotes((prev) => ({ ...prev, [replyId]: null }));
      setReplyLikes((prev) => ({ ...prev, [replyId]: currentLikes + (type === "up" ? -1 : 1) }));
    } else {
      let delta = type === "up" ? 1 : -1;
      if (currentVote !== null) {
        delta *= 2;
      }
      setReplyVotes((prev) => ({ ...prev, [replyId]: type }));
      setReplyLikes((prev) => ({ ...prev, [replyId]: currentLikes + delta }));
    }
  };

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() === "") return;

    const newReply = {
      id: Date.now(),
      threadId: thread.id,
      author: user?.name || "John Doe",
      authorAvatar: user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=john",
      authorRole: user?.role === "admin" || user?.role === "superadmin" ? "Officer" : "Member",
      content: replyText,
      likes: 0,
      createdAt: "Just now",
      isBestAnswer: false,
    };

    setReplies((prev) => [...prev, newReply]);
    setReplyLikes((prev) => ({ ...prev, [newReply.id]: 0 }));
    setReplyText("");
  };

  const categoryColors: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    success: "bg-success/10 text-success border-success/20",
    error: "bg-error/10 text-error border-error/20",
    warning: "bg-warning/10 text-warning border-warning/20",
  };

  const selectedColorClass = categoryColors[category?.color || "primary"] || "bg-surface-700 text-text-secondary border-border";

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
              <h1 className="text-lg sm:text-xl font-extrabold text-text-primary font-[family-name:var(--font-heading)] leading-tight">
                {thread.title}
              </h1>

              {/* Content body */}
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {thread.content}
              </div>

              {/* Action Footer */}
              <div className="flex items-center gap-4 pt-4 border-t border-border text-xs text-text-muted">
                {/* Mobile upvote/downvote bar */}
                <div className="flex sm:hidden items-center gap-1.5 bg-surface-850 px-2 py-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => handleThreadVote("up")}
                    className={threadVote === "up" ? "text-primary" : ""}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="font-bold font-mono text-[10px]">{threadLikes}</span>
                  <button
                    type="button"
                    onClick={() => handleThreadVote("down")}
                    className={threadVote === "down" ? "text-error" : ""}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> {thread.views} views
                </span>

                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className={`flex items-center gap-1.5 hover:text-primary transition-colors ${
                    isSaved ? "text-primary" : ""
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" /> {isSaved ? "Saved" : "Save"}
                </button>
                
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-error transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>

            </div>
          </div>

          {/* Comment input card */}
          <div className="glass rounded-xl p-5 border border-border space-y-3">
            <div className="text-xs text-text-muted">
              Comment as <span className="font-semibold text-text-secondary">{user?.name}</span>
            </div>
            <form onSubmit={handleAddReply} className="space-y-3">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none text-xs"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Comment
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Comments ({replies.length})
            </h2>

            <div className="space-y-4">
              {replies.map((reply) => {
                const currentLikes = replyLikes[reply.id] !== undefined ? replyLikes[reply.id] : reply.likes;
                const currentVote = replyVotes[reply.id] || null;

                return (
                  <div
                    key={reply.id}
                    className={`glass rounded-xl p-4 border border-border transition-colors ${
                      reply.isBestAnswer ? "border-success/30 bg-success/5" : ""
                    }`}
                  >
                    {reply.isBestAnswer && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-success mb-3 uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5" /> Solution
                      </div>
                    )}

                    <div className="flex gap-3">
                      {/* Left: Avatar + Nesting line indicator */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <img
                          src={reply.authorAvatar}
                          alt={reply.author}
                          className="w-8 h-8 rounded-full bg-surface-700"
                        />
                        <div className="w-0.5 flex-1 bg-border/40 my-2 rounded" />
                      </div>

                      {/* Right: Comment details */}
                      <div className="flex-1 min-w-0">
                        
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold text-text-primary">{reply.author}</span>
                          <span className="text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.25 rounded">
                            {reply.authorRole}
                          </span>
                          <span className="text-[10px] text-text-muted">{reply.createdAt}</span>
                        </div>

                        {/* Content */}
                        <p className="text-xs text-text-secondary leading-relaxed">{reply.content}</p>

                        {/* Vote and reply toolbar */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                          {/* Inline vote buttons */}
                          <div className="flex items-center gap-1.5 bg-surface-850 px-2 py-0.5 rounded border border-border">
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
                              currentVote === "up" ? "text-primary" : currentVote === "down" ? "text-error" : ""
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
                  </div>
                );
              })}
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
                    <span className="text-xs font-bold text-text-primary">{category?.threadCount || 10}</span>
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
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
