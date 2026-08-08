import React from "react";
import { Layers } from "lucide-react";

interface PhaseBadgeProps {
  phase?: string | null;
  boardPhases?: Array<{ name: string; color: string }>;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const DEFAULT_PHASE_COLORS: Record<string, string> = {
  requirements: "#3b82f6",
  planning: "#3b82f6",
  architecture: "#8b5cf6",
  design: "#8b5cf6",
  development: "#06b6d4",
  implementation: "#06b6d4",
  testing: "#f59e0b",
  qa: "#f59e0b",
  deployment: "#10b981",
  release: "#10b981",
};

export const PhaseBadge: React.FC<PhaseBadgeProps> = ({
  phase,
  boardPhases = [],
  size = "md",
  className = "",
  onClick,
}) => {
  if (!phase) return null;

  const matchedBoardPhase = boardPhases.find(
    (bp) => bp.name.toLowerCase() === phase.toLowerCase()
  );

  let color = matchedBoardPhase?.color;
  if (!color) {
    const lowerPhase = phase.toLowerCase();
    const matchedKey = Object.keys(DEFAULT_PHASE_COLORS).find((k) =>
      lowerPhase.includes(k)
    );
    color = matchedKey ? DEFAULT_PHASE_COLORS[matchedKey] : "#64748b";
  }

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-xs gap-1.5",
    lg: "px-2.5 py-1 text-xs gap-1.5 font-semibold",
  }[size];

  return (
    <span
      onClick={onClick}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        borderColor: `${color}40`,
      }}
      className={`inline-flex items-center rounded-md font-medium border transition-all ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${sizeClasses} ${className}`}
      title={`Phase: ${phase}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <Layers className="w-3 h-3 flex-shrink-0 opacity-70" />
      <span className="truncate max-w-[140px]">{phase}</span>
    </span>
  );
};

export default PhaseBadge;
