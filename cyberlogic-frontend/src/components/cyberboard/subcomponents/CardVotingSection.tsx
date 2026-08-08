import React from "react";
import { ShieldCheck, ThumbsUp } from "lucide-react";
import type { CyberboardCard } from "../../../utils/api";

interface CardVotingSectionProps {
  card: CyberboardCard;
  boardVisibility?: string;
  boardType?: string;
  onVoteToggle: (cardId: number) => void;
}

export const CardVotingSection: React.FC<CardVotingSectionProps> = ({
  card,
  boardVisibility = "public",
  boardType = "activity",
  onVoteToggle,
}) => {
  if (boardVisibility === "private") {
    return (
      <div className="p-4 rounded-2xl bg-surface-800/80 border border-amber-500/30 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span>Exclusive Member Voting</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] border border-amber-500/30 font-bold">Private Board</span>
              </h4>
              <p className="text-xs text-text-muted">
                Exclusive board member vote card & feedback tally
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onVoteToggle(card.id)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              card.has_voted
                ? "bg-amber-400 text-surface-950 shadow-md shadow-amber-400/20 scale-105"
                : "bg-surface-900 text-text-primary hover:bg-surface-700 border border-border"
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${card.has_voted ? "fill-surface-950" : ""}`} />
            <span>{card.has_voted ? "Voted" : "Cast Vote"} ({card.votes_count || 0})</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <h4 className="text-sm font-bold text-text-primary">
          {boardType === "ideas"
            ? "Support this idea"
            : boardType === "brainstorming"
            ? "Support this topic"
            : "Support this suggestion"}
        </h4>
        <p className="text-xs text-text-muted">
          Upvote to let project leads and members know community interest level
        </p>
      </div>

      <button
        type="button"
        onClick={() => onVoteToggle(card.id)}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          card.has_voted
            ? "bg-primary text-surface-950 shadow-md shadow-primary/20 scale-105"
            : "bg-surface-800 text-text-primary hover:bg-surface-700 border border-border"
        }`}
      >
        <ThumbsUp className={`w-4 h-4 ${card.has_voted ? "fill-surface-950" : ""}`} />
        <span>{card.votes_count || 0} Votes</span>
      </button>
    </div>
  );
};

export default CardVotingSection;
