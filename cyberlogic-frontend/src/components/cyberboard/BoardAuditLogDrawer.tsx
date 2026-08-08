import { useState, useEffect, useCallback, useMemo } from "react";
import { X, History, RefreshCw, Filter, Sparkles, MoveRight, PlusCircle, Edit3, ThumbsUp, Layers, Trash2 } from "lucide-react";
import { fetchCyberboardBoardActivities, type CyberboardCardActivity } from "../../utils/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { BottomSheet } from "../ui/BottomSheet";
import { useIsMobile } from "./shared/useIsMobile";

interface BoardAuditLogDrawerProps {
  boardId: number;
  boardTitle: string;
  onClose: () => void;
  onSelectCard?: (cardId: number) => void;
}

type FilterCategory = "all" | "created" | "moved" | "updated" | "deleted" | "votes";

export default function BoardAuditLogDrawer({
  boardId,
  boardTitle,
  onClose,
  onSelectCard,
}: BoardAuditLogDrawerProps) {
  const { subscribe } = useWebSocket();
  const [activities, setActivities] = useState<CyberboardCardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const isMobile = useIsMobile(640);

  const loadActivities = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCyberboardBoardActivities(boardId);
      setActivities(data);
      setVisibleCount(20);
    } catch (err: any) {
      console.error("Failed to load board audit logs:", err);
      setError(err.message || "Failed to load activity logs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Realtime WebSocket Subscription: instant audit log update when any collaborator mutates a card
  useEffect(() => {
    if (!boardId) return;
    const unsubscribe = subscribe(`cyberboard:${boardId}`, (_payload: any, type: string) => {
      if (["card:created", "card:updated", "card:moved", "card:deleted", "card:voted"].includes(type)) {
        loadActivities(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [boardId, subscribe, loadActivities]);

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((act) => {
      if (filter === "created") return act.action === "created";
      if (filter === "moved") return act.action === "moved";
      if (filter === "updated") return act.action === "updated";
      if (filter === "deleted") return act.action === "deleted";
      if (filter === "votes") return act.action === "voted" || act.action === "unvoted";
      return true;
    });
  }, [activities, filter]);

  useEffect(() => {
    setVisibleCount(20);
  }, [filter]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 60) {
      if (visibleCount < filteredActivities.length) {
        setVisibleCount((prev) => prev + 20);
      }
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return { label: "Created", icon: PlusCircle, bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "moved":
        return { label: "Moved", icon: MoveRight, bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "updated":
        return { label: "Updated", icon: Edit3, bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "deleted":
        return { label: "Deleted", icon: Trash2, bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
      case "voted":
      case "unvoted":
        return { label: "Vote", icon: ThumbsUp, bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
      default:
        return { label: "Activity", icon: Layers, bg: "bg-surface-800 text-text-secondary border-border" };
    }
  };

  const renderContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-surface-900 text-text-primary">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-3 bg-surface-950/60 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-text-primary truncate flex items-center gap-2">
              <span>Board Audit Logs</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-800 text-text-muted text-[10px] font-semibold border border-border">
                {activities.length}
              </span>
            </h2>
            <p className="text-[11px] text-text-muted truncate">
              Activity history for <span className="font-semibold text-text-secondary">{boardTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => loadActivities(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            title="Close Sidepanel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2.5 border-b border-border/60 bg-surface-950/30 flex items-center gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mr-1" />
        {(
          [
            { id: "all", label: "All Events" },
            { id: "created", label: "Created" },
            { id: "moved", label: "Moved" },
            { id: "updated", label: "Updated" },
            { id: "deleted", label: "Deleted" },
            { id: "votes", label: "Votes" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              filter === tab.id
                ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                : "text-text-muted hover:text-text-primary hover:bg-surface-800/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Log Timeline Items */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" onScroll={handleScroll}>
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading board activities...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadActivities()}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-text-muted mx-auto opacity-50" />
            <p className="text-xs font-semibold text-text-secondary">No activity logs recorded yet.</p>
            <p className="text-[11px] text-text-muted">Card actions like creating, editing, or moving will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative pl-3 border-l border-border/80 space-y-4">
              {filteredActivities.slice(0, visibleCount).map((act) => {
                const badge = getActionBadge(act.action);
                const IconComp = badge.icon;
                const userName = act.user
                  ? act.user.name || `${act.user.first_name || ""} ${act.user.last_name || ""}`.trim()
                  : "Board Member";
                const userAvatar =
                  act.user?.avatar ||
                  "https://api.dicebear.com/9.x/avataaars/svg?seed=" + (act.user_id || "user");

                const formattedTime = act.created_at
                  ? new Date(act.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div key={act.id} className="relative pl-4 group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface-900 group-hover:scale-125 transition-all" />

                    <div className="p-3 rounded-xl bg-surface-800/60 border border-border/60 hover:bg-surface-800 transition-all space-y-2">
                      {/* Header: User + Action Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={userAvatar}
                            alt={userName}
                            className="w-5 h-5 rounded-full object-cover border border-border flex-shrink-0"
                          />
                          <span className="text-xs font-semibold text-text-primary truncate">{userName}</span>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.bg}`}>
                          <IconComp className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Description */}
                      {(() => {
                        const moveMatch = act.description.match(/Moved card from ['"](.+?)['"] to ['"](.+?)['"]/i);
                        if (moveMatch) {
                          const [, fromCol, toCol] = moveMatch;
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap text-xs text-text-primary py-0.5">
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
                        return <p className="text-xs text-text-secondary leading-snug">{act.description}</p>;
                      })()}

                      {/* Card Title Link & Timestamp Footer */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] text-text-muted">
                        {act.card ? (
                          <button
                            type="button"
                            onClick={() => onSelectCard && act.card && onSelectCard(act.card.id)}
                            className="font-medium text-primary hover:underline truncate max-w-[180px] cursor-pointer"
                          >
                            📄 {act.card.title}
                          </button>
                        ) : (
                          <span className="italic text-[10px]">Activity Log</span>
                        )}
                        <span className="flex-shrink-0 text-[10px] text-text-muted">{formattedTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCount < filteredActivities.length && (
              <div className="py-3 text-center text-xs text-text-muted font-medium flex items-center justify-center gap-2 border-t border-border/40">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Scroll down to load more ({visibleCount} of {filteredActivities.length} shown)...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} contentPaddingClass="p-0">
        <div className="h-[75vh]">{renderContent()}</div>
      </BottomSheet>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[9990] bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-[9995] w-full sm:w-96 md:w-[420px] bg-surface-900 border-l border-border/80 shadow-2xl animate-in slide-in-from-right duration-200">
        {renderContent()}
      </div>
    </>
  );
}
