import React from "react";
import { Flag, ShieldAlert, ArrowDown, ArrowUp } from "lucide-react";

interface PriorityBadgeProps {
  priority?: "low" | "medium" | "high" | string | null;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority = "medium",
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const prio = (priority || "medium").toLowerCase();

  const config = {
    high: {
      label: "HIGH",
      bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: ShieldAlert,
    },
    medium: {
      label: "MED",
      bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: ArrowUp,
    },
    low: {
      label: "LOW",
      bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: ArrowDown,
    },
  }[prio] || {
    label: prio.toUpperCase(),
    bg: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    icon: Flag,
  };

  const IconComponent = config.icon;
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5 font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold border ${config.bg} ${sizeClasses} ${className}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
