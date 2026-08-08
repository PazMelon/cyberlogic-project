import React from "react";
import { Calendar } from "lucide-react";

interface GanttTimelineHeaderProps {
  timelineColumns: Array<{ label: string; sublabel?: string; fullLabel?: string }>;
  todayPercentage: number | null;
}

export const GanttTimelineHeader: React.FC<GanttTimelineHeaderProps> = ({
  timelineColumns,
  todayPercentage,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-surface-900/95 backdrop-blur border-b border-border select-none shadow-sm">
      <div className="flex w-full h-11 border-b border-border/60">
        {timelineColumns.map((col, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center justify-center border-r border-border/40 text-center px-1 truncate min-w-[50px]"
            title={col.fullLabel || col.sublabel || col.label}
          >
            <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider truncate">
              {col.label}
            </span>
            {col.sublabel && (
              <span className="text-[9px] text-text-muted font-medium truncate">
                {col.sublabel}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Today Marker Line in Header */}
      {todayPercentage !== null && todayPercentage >= 0 && todayPercentage <= 100 && (
        <div
          style={{ left: `${todayPercentage}%` }}
          className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2 flex flex-col items-center"
        >
          <div className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-tighter shadow-md flex items-center gap-1 border border-white/20">
            <Calendar className="w-2.5 h-2.5" /> TODAY
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttTimelineHeader;
