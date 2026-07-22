import { Users, X, ShieldCheck } from "lucide-react";
import type { CyberboardBoard } from "../../utils/api";

export interface CollaboratorItem {
  id: number;
  name: string;
  avatar?: string | null;
  role?: string;
  isMe: boolean;
  status: string;
}

interface CollaboratorsSidebarProps {
  board: CyberboardBoard;
  collaborators: CollaboratorItem[];
  onClose: () => void;
}

export default function CollaboratorsSidebar({
  board,
  collaborators,
  onClose,
}: CollaboratorsSidebarProps) {
  return (
    <aside className="w-72 border-l border-border/70 bg-surface-900/95 backdrop-blur-md flex flex-col flex-shrink-0 z-20 h-full overflow-hidden transition-all animate-in slide-in-from-right duration-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2 bg-surface-950/40">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold text-text-primary">
            Collaborators ({collaborators.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-800 transition-all cursor-pointer"
          title="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Live Online Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
            <span>Live Online ({collaborators.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div
                key={collab.id}
                className="p-2.5 rounded-xl bg-surface-800/60 border border-border/50 flex items-center gap-2.5 transition-all hover:bg-surface-800"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      collab.avatar ||
                      "https://api.dicebear.com/9.x/avataaars/svg?seed=user"
                    }
                    alt={collab.name}
                    className="w-8 h-8 rounded-full border border-border object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface-900" />
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {collab.name}
                    </span>
                    {collab.isMe && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted truncate">
                    {collab.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board Creator Section */}
        {board.creator && (
          <div className="space-y-2.5 pt-4 border-t border-border/50">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Board Host
            </span>
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2.5">
              <img
                src={
                  board.creator.avatar ||
                  "https://api.dicebear.com/9.x/avataaars/svg?seed=creator"
                }
                alt={board.creator.name}
                className="w-8 h-8 rounded-full border border-primary/40 object-cover"
              />
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary truncate">
                    {board.creator.name}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </div>
                <p className="text-[10px] text-primary/80 font-medium">
                  Board Host
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
