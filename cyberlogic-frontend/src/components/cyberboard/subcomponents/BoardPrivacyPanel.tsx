import React from "react";
import { Lock, Globe, Search, RefreshCw, Check } from "lucide-react";
import type { CollaboratorOption } from "../shared/cyberboardTypes";

interface BoardPrivacyPanelProps {
  visibility: "public" | "private";
  setVisibility: (v: "public" | "private") => void;
  allowedMembers: number[];
  setAllowedMembers: React.Dispatch<React.SetStateAction<number[]>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoadingDirectory: boolean;
  sortedExclusiveMembers: CollaboratorOption[];
  ownerId?: number;
}

export const BoardPrivacyPanel: React.FC<BoardPrivacyPanelProps> = ({
  visibility,
  setVisibility,
  allowedMembers,
  setAllowedMembers,
  searchQuery,
  setSearchQuery,
  isLoadingDirectory,
  sortedExclusiveMembers,
  ownerId,
}) => {
  const toggleMemberSelection = (userId: number) => {
    setAllowedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
          Board Access Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              visibility === "public"
                ? "bg-primary/10 border-primary shadow-xs"
                : "bg-surface-800/80 border-border/60 hover:border-border"
            }`}
          >
            <Globe className={`w-5 h-5 mt-0.5 flex-shrink-0 ${visibility === "public" ? "text-primary" : "text-text-muted"}`} />
            <div>
              <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span>Public Board</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 font-bold">Standard</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Open to all verified club members. Anyone can view, submit cards, and comment.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              visibility === "private"
                ? "bg-amber-500/10 border-amber-500 shadow-xs"
                : "bg-surface-800/80 border-border/60 hover:border-border"
            }`}
          >
            <Lock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${visibility === "private" ? "text-amber-400" : "text-text-muted"}`} />
            <div>
              <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span>Private Board</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] border border-amber-500/30 font-bold">Restricted</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Hidden from public listing. Only explicitly allowed members can view and interact.
              </p>
            </div>
          </button>
        </div>
      </div>

      {visibility === "private" && (
        <div className="space-y-3 pt-2 border-t border-border/40 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Permitted Board Members ({allowedMembers.length + (ownerId ? 1 : 0)})
            </label>
            {isLoadingDirectory && (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                Loading Directory...
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {sortedExclusiveMembers.map((member) => {
              const isOwner = ownerId && member.id === ownerId;
              const isSelected = isOwner || allowedMembers.includes(member.id);

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    if (!isOwner) toggleMemberSelection(member.id);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    isOwner
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300 cursor-not-allowed"
                      : isSelected
                      ? "bg-primary/10 border-primary/40 text-text-primary cursor-pointer"
                      : "bg-surface-800/40 border-border/40 text-text-muted hover:border-border cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=06b6d4&color=fff`}
                      alt={member.name}
                      className="w-6 h-6 rounded-full object-cover border border-border/60"
                    />
                    <span className="font-semibold text-text-primary">{member.name}</span>
                    {isOwner && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-400 text-surface-950">
                        Owner
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-surface-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPrivacyPanel;
