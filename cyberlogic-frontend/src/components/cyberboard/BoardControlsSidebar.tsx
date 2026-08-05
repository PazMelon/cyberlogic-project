import {
  X,
  Users,
  Share2,
  Settings,
  History,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Circle,
  FileSpreadsheet,
} from "lucide-react";
import type { CyberboardBoard } from "../../utils/api";
import type { BoardPresenceUser } from "../../hooks/useCyberboardRealtime";

interface BoardControlsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  board: CyberboardBoard;
  activeCollaboratorsCount: number;
  boardPresenceUsers?: Record<number, BoardPresenceUser>;
  copiedLink: boolean;
  canManageBoard?: boolean;
  viewMode?: "board" | "gantt";
  onCopyShareLink: () => void;
  onOpenSettings?: () => void;
  onOpenBoardAuditLog: () => void;
  onExportToExcel?: () => void;
  groupBy?: "phase" | "column" | "priority" | "assignee";
  onGroupByChange?: (mode: "phase" | "column" | "priority" | "assignee") => void;
  timeScale?: "month" | "week" | "day";
  onTimeScaleChange?: (mode: "month" | "week" | "day") => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export default function BoardControlsSidebar({
  isOpen,
  onClose,
  activeCollaboratorsCount,
  boardPresenceUsers = {},
  copiedLink,
  canManageBoard,
  viewMode = "board",
  onCopyShareLink,
  onOpenSettings,
  onOpenBoardAuditLog,
  onExportToExcel,
  groupBy = "phase",
  onGroupByChange,
  timeScale = "month",
  onTimeScaleChange,
  zoomLevel = 100,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: BoardControlsSidebarProps) {
  if (!isOpen) return null;

  const collaborators = Object.values(boardPresenceUsers);

  return (
    <div className="fixed top-0 right-0 bottom-0 z-50 w-80 sm:w-96 bg-surface-900 shadow-2xl border-l border-border/80 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="h-16 px-5 border-b border-border/80 flex items-center justify-between bg-surface-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Board Controls</h2>
            <p className="text-[11px] text-text-muted">Settings, View Options & Presence</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
          title="Close Controls Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        {/* Section 1: Gantt Roadmap View Controls (Visible when in Gantt mode) */}
        {viewMode === "gantt" && (
          <div className="space-y-4 bg-surface-950/60 p-4 rounded-2xl border border-border/60">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Gantt View Controls</span>
            </div>

            {/* Grouping Selector */}
            {onGroupByChange && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-muted">Group Tasks By:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["phase", "column", "priority", "assignee"] as const).map((mode) => (
                    <button
                      key={`sidebar-group-${mode}`}
                      onClick={() => onGroupByChange(mode)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        groupBy === mode
                          ? "bg-primary text-surface-950 border-primary font-bold shadow-xs"
                          : "bg-surface-800/80 text-text-secondary border-border/60 hover:text-text-primary hover:bg-surface-700/60"
                      }`}
                    >
                      {mode === "phase"
                        ? "Phases"
                        : mode === "column"
                        ? "Columns"
                        : mode === "priority"
                        ? "Priority"
                        : "Assignee"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scale Selector */}
            {onTimeScaleChange && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-muted">Time Scale Granularity:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["month", "week", "day"] as const).map((mode) => (
                    <button
                      key={`sidebar-scale-${mode}`}
                      onClick={() => onTimeScaleChange(mode)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${
                        timeScale === mode
                          ? "bg-primary text-surface-950 border-primary font-bold shadow-xs"
                          : "bg-surface-800/80 text-text-secondary border-border/60 hover:text-text-primary hover:bg-surface-700/60"
                      }`}
                    >
                      {mode}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            {onZoomIn && onZoomOut && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-muted">Gantt Zoom Level:</label>
                <div className="flex items-center justify-between bg-surface-800/90 p-2 rounded-xl border border-border/60">
                  <button
                    onClick={onZoomOut}
                    disabled={zoomLevel <= 50}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 disabled:opacity-30 transition-all cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span
                    onClick={onResetZoom}
                    className="text-xs font-bold text-text-primary font-mono cursor-pointer hover:text-primary transition-colors"
                    title="Reset Zoom to 100%"
                  >
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={onZoomIn}
                    disabled={zoomLevel >= 250}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 disabled:opacity-30 transition-all cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Active Collaborators */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
              <Users className="w-4 h-4 text-primary" />
              <span>Active Collaborators</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
              {activeCollaboratorsCount} Online
            </span>
          </div>

          <div className="space-y-2">
            {collaborators.length === 0 ? (
              <div className="p-3 rounded-xl bg-surface-950/40 border border-border/40 text-xs text-text-muted italic text-center">
                Viewing alone right now
              </div>
            ) : (
              collaborators.map((user) => (
                <div
                  key={`presence-${user.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950/40 border border-border/40 hover:bg-surface-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=06b6d4&color=fff`
                        }
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/20"
                      />
                      <Circle className="w-2.5 h-2.5 absolute bottom-0 right-0 fill-emerald-400 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{user.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{user.status || "Viewing board"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Quick Action Tools */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Quick Actions
          </label>

          <button
            type="button"
            onClick={onCopyShareLink}
            className="w-full px-4 py-3 rounded-xl border border-border/80 bg-surface-950/40 hover:bg-surface-800 text-xs font-semibold text-text-primary flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Share Board Link</span>
            </div>
            {copiedLink ? (
              <span className="text-[10px] font-bold text-emerald-400">Copied!</span>
            ) : (
              <span className="text-[10px] text-text-muted font-medium">Copy</span>
            )}
          </button>

          {onExportToExcel && (
            <button
              type="button"
              onClick={onExportToExcel}
              className="w-full px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-2.5 transition-all cursor-pointer group shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span>Export Board to Excel (.xlsx)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenBoardAuditLog}
            className="w-full px-4 py-3 rounded-xl border border-border/80 bg-surface-950/40 hover:bg-surface-800 text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-all cursor-pointer group"
          >
            <History className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>View Board Activity Audit Logs</span>
          </button>

          {canManageBoard && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full px-4 py-3 rounded-xl border border-border/80 bg-surface-950/40 hover:bg-surface-800 text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-all cursor-pointer group"
            >
              <Settings className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Board Settings & Permissions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
