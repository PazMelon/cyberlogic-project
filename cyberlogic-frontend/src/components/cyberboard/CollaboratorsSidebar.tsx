import React, { useEffect, useState } from "react";
import { Users, X, ShieldCheck, UserX } from "lucide-react";
import type { CyberboardBoard, DirectoryMember } from "../../utils/api";
import { fetchDirectory } from "../../utils/api";

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
  const [offlineMembers, setOfflineMembers] = useState<DirectoryMember[]>([]);

  useEffect(() => {
    if (board.visibility !== "private") return;

    let isMounted = true;
    const loadDirectory = async () => {
      try {
        const directory = await fetchDirectory();
        if (!isMounted || !directory) return;

        const onlineIds = new Set(collaborators.map((c) => c.id));
        const allowedIds = new Set(board.allowed_members || []);

        const offline = directory.filter((m) => {
          if (onlineIds.has(m.id)) return false;
          if (allowedIds.size > 0 && !allowedIds.has(m.id) && m.id !== board.creator_id) {
            return false;
          }
          return true;
        });

        setOfflineMembers(offline);
      } catch (err) {
        console.error("Failed to load directory for exclusive board collaborators:", err);
      }
    };

    loadDirectory();
    return () => {
      isMounted = false;
    };
  }, [board.visibility, board.allowed_members, board.creator_id, collaborators]);

  const isPrivate = board.visibility === "private";

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-80 sm:w-84 border-l border-border/80 bg-surface-900 flex flex-col z-50 h-full overflow-hidden shadow-2xl animate-in slide-in-from-right duration-250">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2 bg-surface-950/60">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            {isPrivate ? "Exclusive Collaborators" : `Collaborators (${collaborators.length})`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-800 transition-all cursor-pointer"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {/* Live Online Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
            <span>Live Online ({collaborators.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="space-y-2">
            {collaborators.length === 0 ? (
              <div className="p-3 rounded-xl bg-surface-950/40 border border-border/40 text-xs text-text-muted italic text-center">
                No active collaborators online
              </div>
            ) : (
              collaborators.map((collab) => (
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
              ))
            )}
          </div>
        </div>

        {/* Offline Members Section (Exclusive/Private Board) */}
        {isPrivate && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
              <span>Offline Members ({offlineMembers.length})</span>
              <span className="w-2 h-2 rounded-full bg-surface-600" />
            </div>

            <div className="space-y-2">
              {offlineMembers.length === 0 ? (
                <div className="p-3 rounded-xl bg-surface-950/30 border border-border/40 text-xs text-text-muted italic text-center">
                  All board members are currently online
                </div>
              ) : (
                offlineMembers.map((member) => (
                  <div
                    key={`offline-${member.id}`}
                    className="p-2.5 rounded-xl bg-surface-950/40 border border-border/30 flex items-center gap-2.5 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          member.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=334155&color=94a3b8`
                        }
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-border/60 object-cover grayscale"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-surface-900" />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-text-secondary truncate">
                          {member.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-800 text-text-muted text-[9px] font-bold border border-border/50">
                          Offline
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted truncate">
                        Not currently active
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
