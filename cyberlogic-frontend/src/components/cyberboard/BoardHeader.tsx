import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Radio,
  Share2,
  Plus,
  Users,
  Pin,
  Lock,
  Settings,
  History,
  LayoutGrid,
  GanttChart,
  MoreVertical,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";
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
  showControlsSidebar?: boolean;
  onToggleControlsSidebar?: () => void;
  onToggleCollaborators: () => void;
  onCopyShareLink: () => void;
  onSuggestActivityClick: () => void;
  onOpenSettings?: () => void;
  onOpenBoardAuditLog: () => void;
  onExportToExcel?: () => void;
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
  showControlsSidebar,
  onToggleControlsSidebar,
  onToggleCollaborators,
  onCopyShareLink,
  onSuggestActivityClick,
  onOpenSettings,
  onOpenBoardAuditLog,
  onExportToExcel,
}: BoardHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="bg-surface-900/95 backdrop-blur-md border-b border-border/80 px-3 py-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 flex-shrink-0 sticky top-0 z-30 shadow-xs h-14 sm:h-16">
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
          <h1 className="text-sm sm:text-base font-bold text-text-primary truncate max-w-[160px] sm:max-w-xs md:max-w-sm lg:max-w-md">
            {board.title}
          </h1>

          {board.visibility === "private" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 flex-shrink-0">
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Private</span>
            </span>
          )}

          {board.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex-shrink-0">
              <Pin className="w-3 h-3 fill-amber-400" />
              <span className="hidden sm:inline">Pinned</span>
            </span>
          )}

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 hidden lg:inline-block ${catBadge.bg}`}>
            {catBadge.label}
          </span>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 hidden xl:inline-block ${typeBadge.bg}`}>
            {typeBadge.label}
          </span>

          <span className="px-2 py-0.5 rounded-full bg-surface-800 text-text-secondary text-[10px] font-bold border border-border flex-shrink-0 hidden lg:inline-block">
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

      {/* Action CTAs Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 relative" ref={menuRef}>
        {/* View Switcher: Board vs Gantt Roadmap */}
        {onViewModeChange && board.type === "roadmap" && (
          <div className="flex items-center p-1 rounded-xl bg-surface-800 border border-border">
            <button
              type="button"
              onClick={() => onViewModeChange("board")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-primary text-surface-950 shadow-xs font-bold"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-700/50"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("gantt")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "gantt"
                  ? "bg-primary text-surface-950 shadow-xs font-bold"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-700/50"
              }`}
              title="Gantt Roadmap View"
            >
              <GanttChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Roadmap</span>
            </button>
          </div>
        )}

        {/* Desktop Buttons (Visible on 2xl screens >= 1440px and larger) */}
        <div className="hidden 2xl:flex items-center gap-1.5 sm:gap-2">
          {/* Activity Audit Log Button */}
          <button
            type="button"
            onClick={onOpenBoardAuditLog}
            className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            title="Board Activity Audit Logs"
          >
            <History className="w-4 h-4 flex-shrink-0 text-primary" />
            <span>Activity Logs</span>
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
            <span>Collaborators</span>
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
            <span>{copiedLink ? "Copied!" : "Share"}</span>
          </button>

          {/* Export Excel Button (Visible for Project Roadmap boards only) */}
          {board.type === "roadmap" && onExportToExcel && (
            <button
              type="button"
              onClick={onExportToExcel}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Export Board to Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Export Excel</span>
            </button>
          )}

          {/* Settings Button */}
          {canManageBoard && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Board Settings"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Settings</span>
            </button>
          )}
        </div>

        {/* Board Controls Sidebar Toggle Button (Visible on screens < 2xl) */}
        {onToggleControlsSidebar && (
          <button
            type="button"
            onClick={onToggleControlsSidebar}
            className={`2xl:hidden px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              showControlsSidebar
                ? "bg-primary/20 border-primary/40 text-primary shadow-xs"
                : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
            }`}
            title="Board Controls & Options"
          >
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0 text-primary" />
            <span>Controls</span>
          </button>
        )}

        {/* Primary CTA (+ Suggest Activity / Milestone) */}
        <button
          type="button"
          onClick={onSuggestActivityClick}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>{actionText.action} <span className="hidden xs:inline">{actionText.noun}</span></span>
        </button>

        {/* Mobile / Tablet Overflow Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className={`md:hidden p-1.5 sm:p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
            showMenu
              ? "bg-primary/20 border-primary/40 text-primary"
              : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
          }`}
          title="More Controls"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Mobile / Tablet Overflow Dropdown Menu */}
        {showMenu && (
          <div className="md:hidden absolute top-full right-0 mt-2 w-56 rounded-2xl bg-surface-900 border border-border/80 shadow-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {board.type === "roadmap" && onExportToExcel && (
              <button
                type="button"
                onClick={() => {
                  onExportToExcel();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Board to Excel (.xlsx)</span>
              </button>
            )}

            {onToggleControlsSidebar && (
              <button
                type="button"
                onClick={() => {
                  onToggleControlsSidebar();
                  setShowMenu(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  showControlsSidebar
                    ? "bg-primary/15 text-primary"
                    : "text-text-primary hover:bg-surface-800"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>Board Controls Drawer</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onToggleCollaborators();
                setShowMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                showCollaborators
                  ? "bg-primary/15 text-primary"
                  : "text-text-primary hover:bg-surface-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Collaborators</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {activeCollaboratorsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenBoardAuditLog();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-800 flex items-center gap-2 transition-colors"
            >
              <History className="w-4 h-4 text-primary" />
              <span>Activity Logs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCopyShareLink();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Share Link</span>
              </div>
              {copiedLink && <span className="text-[10px] font-bold text-emerald-400">Copied!</span>}
            </button>

            {canManageBoard && onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-800 flex items-center gap-2 transition-colors border-t border-border/40 mt-1 pt-2"
              >
                <Settings className="w-4 h-4 text-text-muted" />
                <span>Board Settings</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

