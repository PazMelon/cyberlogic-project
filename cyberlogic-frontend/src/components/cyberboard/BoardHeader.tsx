import { Link } from "react-router";
import { ArrowLeft, Radio, Share2, Plus, Users, Pin, Lock, Settings, History, LayoutGrid, GanttChart } from "lucide-react";
import type { CyberboardBoard } from "../../utils/api";

interface BoardHeaderProps {
  board: CyberboardBoard;
  totalCardsCount: number;
  isConnected: boolean;
  activeCollaboratorsCount: number;
  showCollaborators: boolean;
  copiedLink: boolean;
  canManageBoard?: boolean;
  viewMode?: "board" | "gantt";
  onViewModeChange?: (mode: "board" | "gantt") => void;
  onToggleCollaborators: () => void;
  onCopyShareLink: () => void;
  onSuggestActivityClick: () => void;
  onOpenSettings?: () => void;
  onOpenBoardAuditLog: () => void;
}

export default function BoardHeader({
  board,
  totalCardsCount,
  isConnected,
  activeCollaboratorsCount,
  showCollaborators,
  copiedLink,
  canManageBoard,
  viewMode = "board",
  onViewModeChange,
  onToggleCollaborators,
  onCopyShareLink,
  onSuggestActivityClick,
  onOpenSettings,
  onOpenBoardAuditLog,
}: BoardHeaderProps) {
  const getActionLabel = (type?: string) => {
    switch (type) {
      case "ideas":
        return { action: "Submit", noun: "Idea" };
      case "brainstorming":
        return { action: "Add", noun: "Topic" };
      case "roadmap":
        return { action: "Add", noun: "Milestone" };
      case "activity":
      default:
        return { action: "Suggest", noun: "Activity" };
    }
  };

  const getBoardTypeBadge = (type?: string) => {
    switch (type) {
      case "ideas":
        return { label: "💡 Idea Box", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "brainstorming":
        return { label: "🧠 Brainstorming", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "roadmap":
        return { label: "🚀 Roadmap", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "activity":
      default:
        return { label: "📅 Activity Board", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "system":
        return { label: "🛡️ System", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
      case "projects_tech":
        return { label: "💻 Projects & Tech", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "events_social":
        return { label: "🚀 Events & Socials", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "others":
        return { label: "💡 Others", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "club_related":
      default:
        return { label: "🎓 Club Related", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    }
  };

  const actionText = getActionLabel(board.type);
  const typeBadge = getBoardTypeBadge(board.type);
  const catBadge = getCategoryBadge(board.category);

  return (
    <div className="bg-surface-900/95 backdrop-blur-md border-b border-border/80 px-3 py-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 flex-shrink-0 sticky top-0 z-10 shadow-xs h-14 sm:h-16">
      {/* Title & Metadata (Single Line) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Link
          to="/app/cyberboard"
          className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all flex-shrink-0"
          title="Back to All Boards"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-bold text-text-primary truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs md:max-w-md">
            {board.title}
          </h1>

          {board.visibility === "private" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 flex-shrink-0">
              <Lock className="w-3 h-3" />
              <span>Private</span>
            </span>
          )}

          {board.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex-shrink-0">
              <Pin className="w-3 h-3 fill-amber-400" />
              <span className="hidden sm:inline">Pinned</span>
            </span>
          )}

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 hidden sm:inline-block ${catBadge.bg}`}>
            {catBadge.label}
          </span>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 hidden md:inline-block ${typeBadge.bg}`}>
            {typeBadge.label}
          </span>

          <span className="px-2 py-0.5 rounded-full bg-surface-800 text-text-secondary text-[10px] font-bold border border-border flex-shrink-0 hidden xs:inline-block">
            {totalCardsCount} cards
          </span>

          {isConnected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex-shrink-0">
              <Radio className="w-3 h-3 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </span>
          )}
        </div>
      </div>

      {/* Action CTAs Toolbar (Single Line, Right-Aligned) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* View Switcher: Board vs Gantt Roadmap */}
        {onViewModeChange && (
          <div className="flex items-center p-1 rounded-xl bg-surface-800 border border-border">
            <button
              type="button"
              onClick={() => onViewModeChange("board")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-primary text-surface-950 shadow-xs font-bold"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-700/50"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("gantt")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "gantt"
                  ? "bg-primary text-surface-950 shadow-xs font-bold"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-700/50"
              }`}
              title="Gantt Roadmap View"
            >
              <GanttChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Roadmap</span>
            </button>
          </div>
        )}
        {/* Activity Audit Log Button */}
        <button
          type="button"
          onClick={onOpenBoardAuditLog}
          className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          title="Board Activity Audit Logs"
        >
          <History className="w-4 h-4 flex-shrink-0 text-primary" />
          <span className="hidden xl:inline">Activity Logs</span>
        </button>

        {/* Collaborators Button */}
        <button
          type="button"
          onClick={onToggleCollaborators}
          className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            showCollaborators
              ? "bg-primary/20 border-primary/40 text-primary shadow-xs"
              : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
          }`}
          title="Toggle Active Collaborators Panel"
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">Collaborators</span>
          <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
            {activeCollaboratorsCount}
          </span>
        </button>

        {/* Share Link Button */}
        <button
          type="button"
          onClick={onCopyShareLink}
          className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          title="Share Board Link"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">{copiedLink ? "Copied!" : "Share"}</span>
        </button>

        {/* Settings Button */}
        {canManageBoard && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            title="Board Settings"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        )}

        {/* Primary CTA (+ Suggest Activity / Milestone) */}
        <button
          type="button"
          onClick={onSuggestActivityClick}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>{actionText.action} <span className="hidden sm:inline">{actionText.noun}</span></span>
        </button>
      </div>
    </div>
  );
}
