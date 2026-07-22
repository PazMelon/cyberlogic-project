import { Link } from "react-router";
import { ArrowLeft, Radio, Share2, Plus, Users } from "lucide-react";
import type { CyberboardBoard } from "../../utils/api";

interface BoardHeaderProps {
  board: CyberboardBoard;
  totalCardsCount: number;
  isConnected: boolean;
  activeCollaboratorsCount: number;
  showCollaborators: boolean;
  copiedLink: boolean;
  onToggleCollaborators: () => void;
  onCopyShareLink: () => void;
  onSuggestActivityClick: () => void;
}

export default function BoardHeader({
  board,
  totalCardsCount,
  isConnected,
  activeCollaboratorsCount,
  showCollaborators,
  copiedLink,
  onToggleCollaborators,
  onCopyShareLink,
  onSuggestActivityClick,
}: BoardHeaderProps) {
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
          <h1 className="text-sm sm:text-base font-bold text-text-primary truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs md:max-w-md">
            {board.title}
          </h1>

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

        <button
          type="button"
          onClick={onCopyShareLink}
          className="p-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          title="Share Board Link"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">{copiedLink ? "Copied!" : "Share"}</span>
        </button>

        <button
          type="button"
          onClick={onSuggestActivityClick}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>Suggest <span className="hidden sm:inline">Activity</span></span>
        </button>
      </div>
    </div>
  );
}
