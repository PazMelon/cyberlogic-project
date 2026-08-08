import React from "react";
import { CheckCircle2, Clock, AlertTriangle, PlayCircle } from "lucide-react";

interface StatusBadgeProps {
  statusType?: string | null;
  columnTitle?: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  statusType,
  columnTitle,
  size = "md",
  className = "",
}) => {
  const st = (statusType || "").toLowerCase();
  const colName = (columnTitle || "").toLowerCase();

  let label = columnTitle || "To Do";
  let bg = "bg-slate-900/90 text-slate-200 border-slate-700/70";
  let Icon = Clock;

  if (st === "completed" || colName.includes("done") || colName.includes("complete")) {
    label = columnTitle || "Done";
    bg = "bg-emerald-950/90 text-emerald-300 border-emerald-600/60";
    Icon = CheckCircle2;
  } else if (st === "in_progress" || colName.includes("progress")) {
    label = columnTitle || "In Progress";
    bg = "bg-lime-950/90 text-lime-300 border-lime-600/60";
    Icon = PlayCircle;
  } else if (st === "under_review" || colName.includes("review") || colName.includes("test")) {
    label = columnTitle || "Testing";
    bg = "bg-cyan-950/90 text-cyan-300 border-cyan-600/60";
    Icon = Clock;
  } else if (st === "blocked" || colName.includes("blocked")) {
    label = columnTitle || "Blocked";
    bg = "bg-amber-950/90 text-amber-300 border-amber-600/60";
    Icon = AlertTriangle;
  }

  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-xs gap-1.5 font-bold";

  return (
    <span className={`inline-flex items-center rounded-md border ${bg} ${sizeClasses} ${className}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
};

export default StatusBadge;
