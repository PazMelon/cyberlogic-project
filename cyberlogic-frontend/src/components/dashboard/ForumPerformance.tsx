import { Link } from "react-router";
import { Flame, Eye, MessageSquare, ThumbsUp } from "lucide-react";
import type { ForumThreadMapped, ForumCategoryMapped } from "../../utils/api";

interface ForumPerformanceProps {
  user: any;
  threads: ForumThreadMapped[];
  categories: ForumCategoryMapped[];
  isLoading: boolean;
}

export default function ForumPerformance({ user, threads, categories, isLoading }: ForumPerformanceProps) {
  const myThreads = threads.filter((t) => t.authorId === user?.id);
  const totalMyThreads = myThreads.length;
  const totalMyViews = myThreads.reduce((acc, t) => acc + t.views, 0);
  const totalMyReplies = myThreads.reduce((acc, t) => acc + t.replyCount, 0);
  const totalMyLikes = myThreads.reduce((acc, t) => acc + t.likes, 0);

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Your Forum Performance
        </h2>
        <Link
          to="/app/forums"
          className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
        >
          Go to Forums
        </Link>
      </div>

      {/* Performance Mini Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-900/40 border border-border/40 p-4 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-text-secondary uppercase font-semibold">Threads Created</span>
          <p className="text-lg font-bold text-text-primary">{totalMyThreads}</p>
        </div>
        <div className="bg-surface-900/40 border border-border/40 p-4 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-text-secondary uppercase font-semibold">Total Views</span>
          <p className="text-lg font-bold text-accent">{totalMyViews}</p>
        </div>
        <div className="bg-surface-900/40 border border-border/40 p-4 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-text-secondary uppercase font-semibold">Total Replies</span>
          <p className="text-lg font-bold text-success">{totalMyReplies}</p>
        </div>
        <div className="bg-surface-900/40 border border-border/40 p-4 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-text-secondary uppercase font-semibold">Total Likes</span>
          <p className="text-lg font-bold text-warning">{totalMyLikes}</p>
        </div>
      </div>

      {/* List of User's Threads with View Counts */}
      {isLoading ? (
        <div className="h-[120px] flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : totalMyThreads === 0 ? (
        <p className="text-xs text-text-muted italic text-center py-4">
          You haven't posted any forum threads yet. Share a question or tutorial to build engagement!
        </p>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {myThreads.map((thread) => {
            const cat = categories.find((c) => c.id === thread.categoryId);
            return (
              <div key={thread.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-border/30 transition-all gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {cat && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded-md border bg-${cat.color}/10 text-${cat.color} border-${cat.color}/30`}>
                        {cat.name}
                      </span>
                    )}
                    {thread.solved && (
                      <span className="text-[9px] bg-success/15 text-success px-1.5 py-0.25 rounded-md border border-success/30 font-bold">
                        Solved
                      </span>
                    )}
                  </div>
                  <Link to={`/app/forums/thread/${thread.id}`} className="text-xs sm:text-sm font-semibold text-text-primary hover:text-primary hover:underline line-clamp-1">
                    {thread.title}
                  </Link>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 text-[11px] font-medium text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-text-muted" />
                    <span>{thread.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                    <span>{thread.replyCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-text-muted" />
                    <span>{thread.likes}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
