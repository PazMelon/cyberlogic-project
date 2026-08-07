import {
  X,
  Users,
  Share2,
  Settings,
  History,
  SlidersHorizontal,
  Circle,
  FileSpreadsheet,
  FolderKanban,
  LayoutGrid,
  GanttChart,
  UserCheck,
  KeyRound,
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
  onViewModeChange?: (mode: "board" | "gantt") => void;
  onCopyShareLink: () => void;
  onOpenSettings?: () => void;
  onOpenBoardAuditLog: () => void;
  onOpenMediaVault: () => void;
  onOpenJoinRequests?: () => void;
  onGenerateInviteLink?: () => void;
  pendingRequestsCount?: number;
  onExportToExcel?: () => void;
}

export default function BoardControlsSidebar({
  isOpen,
  onClose,
  board,
  activeCollaboratorsCount,
  boardPresenceUsers = {},
  copiedLink,
  canManageBoard,
  viewMode = "board",
  onViewModeChange,
  onCopyShareLink,
  onOpenSettings,
  onOpenBoardAuditLog,
  onOpenMediaVault,
  onOpenJoinRequests,
  onGenerateInviteLink,
  pendingRequestsCount = 0,
  onExportToExcel,
}: BoardControlsSidebarProps) {
  const collaborators = Object.values(boardPresenceUsers);

  return (
    <>
      {/* Click-Outside Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[9995] w-full sm:w-96 bg-surface-900 shadow-2xl border-l border-border/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
      {/* Drawer Header */}
      <div className="h-16 px-5 border-b border-border/80 flex items-center justify-between bg-surface-900/90 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Board Extended Controls</h2>
            <p className="text-[11px] text-text-muted">Vault, View Options & Presence</p>
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
        {/* View Mode Switcher (For Roadmap Boards) */}
        {onViewModeChange && board.type === "roadmap" && (
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Board Display Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-950/60 border border-border/60">
              <button
                type="button"
                onClick={() => {
                  onViewModeChange("board");
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  viewMode === "board"
                    ? "bg-primary text-surface-950 shadow-md"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-800"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Kanban Board</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onViewModeChange("gantt");
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  viewMode === "gantt"
                    ? "bg-primary text-surface-950 shadow-md"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-800"
                }`}
              >
                <GanttChart className="w-4 h-4" />
                <span>Gantt Roadmap</span>
              </button>
            </div>
          </div>
        )}

        {/* Board Vault & Media Trigger Button */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Resources & Vault
          </label>
          <button
            type="button"
            onClick={() => {
              onOpenMediaVault();
              onClose();
            }}
            className="w-full p-3.5 rounded-2xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30 group-hover:scale-110 transition-transform">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-text-primary group-hover:text-primary transition-colors">
                  Media & Links Vault
                </p>
                <p className="text-[10px] text-text-muted font-normal">
                  View card resources & general board uploads
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Open Vault
            </span>
          </button>
        </div>

        {/* Section: Quick Action Tools */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Quick Actions
          </label>

          {onOpenJoinRequests && (
            <button
              type="button"
              onClick={() => {
                onOpenJoinRequests();
                onClose();
              }}
              className="w-full px-4 py-3 rounded-xl border border-warning/30 bg-warning/10 hover:bg-warning/20 text-xs font-bold text-warning flex items-center justify-between transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
                <span>Pending Join Requests</span>
              </div>
              {pendingRequestsCount > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-warning text-surface-950 animate-pulse">
                  {pendingRequestsCount} New
                </span>
              ) : (
                <span className="text-[10px] text-text-muted font-medium">View</span>
              )}
            </button>
          )}

          {board.visibility === "private" && onGenerateInviteLink ? (
            <button
              type="button"
              onClick={() => {
                onGenerateInviteLink();
                onClose();
              }}
              className="w-full px-4 py-3 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span>Create 6-Hour Single-Use Invite</span>
              </div>
              <span className="text-[10px] text-primary font-bold px-1.5 py-0.5 rounded-full bg-primary/20">6h Single-Use</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onCopyShareLink();
                onClose();
              }}
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
          )}

          {board.type === "roadmap" && onExportToExcel && (
            <button
              type="button"
              onClick={() => {
                onExportToExcel();
                onClose();
              }}
              className="w-full px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-2.5 transition-all cursor-pointer group shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span>Export Board to Excel (.xlsx)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenBoardAuditLog();
              onClose();
            }}
            className="w-full px-4 py-3 rounded-xl border border-border/80 bg-surface-950/40 hover:bg-surface-800 text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-all cursor-pointer group"
          >
            <History className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>View Board Activity Audit Logs</span>
          </button>

          {canManageBoard && onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-full px-4 py-3 rounded-xl border border-border/80 bg-surface-950/40 hover:bg-surface-800 text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-all cursor-pointer group"
            >
              <Settings className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
              <span>Board Settings & Permissions</span>
            </button>
          )}
        </div>

        {/* Section: Active Collaborators */}
        <div className="space-y-3 pt-2 border-t border-border/60">
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
      </div>
    </div>
  </>
);
}
