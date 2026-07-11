import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteControlProps {
  score: number;
  userVote: number | null; // 1, -1, or null
  onVote: (direction: "up" | "down") => void;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md";
  animateClass?: string;
}

export function VoteControl({
  score,
  userVote,
  onVote,
  orientation = "vertical",
  size = "md",
  animateClass
}: VoteControlProps) {
  const isUp = userVote === 1;
  const isDown = userVote === -1;

  const btnSize = size === "sm" ? "p-0.5" : "p-1";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const scoreTextSize = size === "sm" ? "text-[10px]" : "text-xs";

  const containerClass =
    orientation === "vertical"
      ? "flex flex-col items-center gap-1 text-center w-12 flex-shrink-0"
      : "flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-850 border border-border/45";

  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote("up");
        }}
        className={`${btnSize} rounded hover:bg-white/5 transition-colors ${
          isUp ? "text-primary" : "text-text-muted hover:text-text-primary"
        }`}
        aria-label="Upvote"
      >
        <ChevronUp className={iconSize} />
      </button>
      <span
        key={score}
        className={`font-bold font-mono ${scoreTextSize} ${
          isUp ? "text-primary" : isDown ? "text-error" : "text-text-primary"
        } ${animateClass || ""}`}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote("down");
        }}
        className={`${btnSize} rounded hover:bg-white/5 transition-colors ${
          isDown ? "text-error" : "text-text-muted hover:text-text-primary"
        }`}
        aria-label="Downvote"
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  );
}
