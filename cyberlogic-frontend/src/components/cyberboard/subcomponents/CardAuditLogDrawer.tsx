import React, { useState } from "react";
import { History, Clock } from "lucide-react";
import type { CyberboardCardActivity } from "../../../utils/api";
import { getAvatarUrl } from "../../../utils/api";

interface CardAuditLogDrawerProps {
  activities: CyberboardCardActivity[];
  formatDateTime: (dateStr?: string | null) => string;
}

export const CardAuditLogDrawer: React.FC<CardAuditLogDrawerProps> = ({
  activities = [],
  formatDateTime,
}) => {
  const [visibleCount, setVisibleCount] = useState(20);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (visibleCount < activities.length) {
        setVisibleCount((prev) => prev + 20);
      }
    }
  };

  return (
    <div className="w-full p-4 flex flex-col flex-1 h-full overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <History className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Card Activity Audit Log
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
          {activities.length} logs
        </span>
      </div>

      <p className="text-[11px] text-text-muted mb-4 leading-relaxed flex-shrink-0">
        Audit trail of card actions and updates. Excludes discussion comments.
      </p>

      <div onScroll={handleScroll} className="space-y-4 flex-1 overflow-y-auto scrollbar-thin pr-1 min-h-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Clock className="w-6 h-6 text-text-muted mx-auto opacity-50" />
            <p className="text-xs text-text-muted italic">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, visibleCount).map((act) => {
              const userName = act.user
                ? `${act.user.first_name || ""} ${act.user.last_name || ""}`.trim() ||
                  act.user.name ||
                  act.user.username ||
                  "Member"
                : "Member";
              const userAvatar = getAvatarUrl(
                act.user?.avatar || (act.user as any)?.avatar_path,
                userName
              );

              return (
                <div
                  key={act.id}
                  className="relative pl-5 pb-3 border-l-2 border-border/60 last:border-l-0 space-y-1 group"
                >
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary ring-4 ring-surface-900" />

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-4 h-4 rounded-full border border-border object-cover flex-shrink-0"
                      />
                      <span className="text-[11px] font-bold text-text-primary truncate">
                        {userName}
                      </span>
                    </div>
                    <span className="text-[9px] text-text-muted whitespace-nowrap">
                      {formatDateTime(act.created_at)}
                    </span>
                  </div>

                  {(() => {
                    const moveMatch = act.description.match(
                      /Moved card from ['"](.+?)['"] to ['"](.+?)['"]/i
                    );
                    if (moveMatch) {
                      const [, fromCol, toCol] = moveMatch;
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-text-primary pl-5.5 py-0.5">
                          <span className="text-text-muted">Moved from</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30 text-[11px]">
                            {fromCol}
                          </span>
                          <span className="text-purple-400 font-bold text-xs">➔</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
                            {toCol}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs text-text-secondary leading-snug pl-5.5 font-medium">
                        {act.description}
                      </p>
                    );
                  })()}
                </div>
              );
            })}

            {visibleCount < activities.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 20, activities.length))}
                className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-bold transition-all cursor-pointer text-center my-2"
              >
                Load More Logs ({activities.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardAuditLogDrawer;
