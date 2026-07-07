import { Link } from "react-router";
import { MessageSquare, ThumbsUp, ArrowRight, Flame, CheckCircle2 } from "lucide-react";
import type { ForumThreadMapped, ForumCategoryMapped } from "../../utils/api";

interface CategoryNewestCardProps {
  category: ForumCategoryMapped;
  threads: ForumThreadMapped[];
}

export function CategoryNewestCard({ category, threads }: CategoryNewestCardProps) {
  // Get newest 10 threads in this category
  const newestThreads = threads
    .filter((t) => t.categoryId === category.id)
    .sort((a, b) => b.id - a.id)
    .slice(0, 10);

  // Map category color class to border color class
  const colorMap: Record<string, string> = {
    primary: "border-primary/20 hover:border-primary/40",
    accent: "border-accent/20 hover:border-accent/40",
    success: "border-success/20 hover:border-success/40",
    error: "border-error/20 hover:border-error/40",
    warning: "border-warning/20 hover:border-warning/40",
  };

  const textColors: Record<string, string> = {
    primary: "text-primary hover:text-primary-light",
    accent: "text-accent hover:text-accent-light",
    success: "text-success hover:text-success-light",
    error: "text-error hover:text-error-light",
    warning: "text-warning hover:text-warning-light",
  };

  const bgColors: Record<string, string> = {
    primary: "bg-primary",
    accent: "bg-accent",
    success: "bg-success",
    error: "bg-error",
    warning: "bg-warning",
  };

  const borderClass = colorMap[category.color] || "border-border/40";
  const textColorClass = textColors[category.color] || "text-primary";
  const bgClass = bgColors[category.color] || "bg-primary";

  return (
    <div className={`glass rounded-2xl p-5 h-[390px] flex flex-col border transition-all ${borderClass}`}>
      <div className="flex items-center justify-between mb-4 border-b border-border/10 pb-2">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-sm font-semibold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${bgClass} shrink-0`} />
            <span className="truncate">{category.name}</span>
            <span className="text-[9px] font-medium bg-white/5 text-text-muted px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-wide shrink-0">Newest</span>
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5 truncate">{category.description}</p>
        </div>
        <Link
          to={`/app/forums?category=${category.id}`}
          className={`text-xs font-semibold ${textColorClass} hover:underline transition-all flex items-center gap-0.5 shrink-0`}
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin pr-1">
        {newestThreads.length > 0 ? (
          newestThreads.map((thread) => {
            const engagementScore = thread.replyCount * 3 + thread.likes * 2 + thread.views;
            return (
              <div
                key={thread.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-border/30 transition-all gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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

                {/* Pronounced Metrics */}
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
          })
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-6 h-6 text-text-muted/40 mx-auto mb-1" />
            <p className="text-[11px] text-text-muted font-medium">No threads in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
