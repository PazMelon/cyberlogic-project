import React from "react";

interface GanttMilestoneMarkerProps {
  title: string;
  leftPercent: number;
  color?: string;
  isCompleted?: boolean;
  onClick?: () => void;
}

export const GanttMilestoneMarker: React.FC<GanttMilestoneMarkerProps> = ({
  title,
  leftPercent,
  color = "#ec4899",
  isCompleted = false,
  onClick,
}) => {
  return (
    <div
      style={{ left: `${leftPercent}%` }}
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-20 group"
      title={`Milestone: ${title}`}
    >
      {/* Rotated Square Diamond */}
      <div
        style={{
          backgroundColor: color,
          borderColor: isCompleted ? "#10b981" : "#ffffff",
        }}
        className="w-4 h-4 rotate-45 border-2 shadow-md transition-transform group-hover:scale-125 group-hover:shadow-lg"
      />
      {/* Tooltip on hover */}
      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-900 text-white text-[11px] font-bold rounded shadow-xl whitespace-nowrap z-30 border border-border">
        {title} (Milestone)
      </div>
    </div>
  );
};

export default GanttMilestoneMarker;
