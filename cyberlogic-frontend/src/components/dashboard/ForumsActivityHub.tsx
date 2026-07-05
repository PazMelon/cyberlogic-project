import { Link } from "react-router";
import { MessageSquare, Flame, CheckCircle2, ThumbsUp } from "lucide-react";
import { forumThreads, forumCategories } from "../../data/mockData";

export function ForumsActivityHub() {
  // Sort threads by engagement: (replies * 3) + (likes * 2) + views descending
  const topThreads = [...forumThreads]
    .sort((a, b) => {
      const scoreA = a.replyCount * 3 + a.likes * 2 + a.views;
      const scoreB = b.replyCount * 3 + b.likes * 2 + b.views;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  return (
    <div className="glass rounded-2xl p-5 h-[390px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent" />
          Forums Activity Hub - Top Engaged
        </h2>
        <Link
          to="/app/forums"
          className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
        >
          Go to Forums
        </Link>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {topThreads.map((thread) => {
          const cat = forumCategories.find((c) => c.id === thread.categoryId);
          const engagementScore = thread.replyCount * 3 + thread.likes * 2 + thread.views;
          return (
            <div
              key={thread.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-border/30 transition-all gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded-md border bg-${cat?.color || "primary"}/10 text-${cat?.color || "primary"} border-${cat?.color || "primary"}/30`}>
                    {cat?.name || "General"}
                  </span>
                  {thread.solved && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold bg-success/15 text-success px-1.5 py-0.25 rounded-md border border-success/30">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Solved
                    </span>
                  )}
                  {thread.pinned && (
                    <span className="text-[9px] font-bold bg-warning/15 text-warning px-1.5 py-0.25 rounded-md border border-warning/30">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <Link
                  to={`/app/forums/thread/${thread.id}`}
                  className="text-xs sm:text-sm font-semibold text-text-primary hover:text-primary transition-colors line-clamp-1 hover:underline"
                >
                  {thread.title}
                </Link>
                <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                  By <span className="text-text-primary font-medium">{thread.author}</span> · {thread.lastActivity}
                </p>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-900/30 border border-border/40 text-xs font-semibold text-text-primary" title="Replies">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>{thread.replyCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-900/30 border border-border/40 text-xs font-semibold text-text-primary" title="Likes">
                  <ThumbsUp className="w-4 h-4 text-accent" />
                  <span>{thread.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-900/30 border border-border/40 text-xs font-semibold text-text-primary" title={`Engagement Score: ${engagementScore}`}>
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{thread.views}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
