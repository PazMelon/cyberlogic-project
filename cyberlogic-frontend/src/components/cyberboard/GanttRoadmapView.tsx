import React, { useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  Clock,
  Plus,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  SlidersHorizontal
} from "lucide-react";
import type { CyberboardBoard, CyberboardColumn, CyberboardCard } from "../../utils/api";

interface GanttRoadmapViewProps {
  board: CyberboardBoard;
  columns: CyberboardColumn[];
  cards: CyberboardCard[];
  canManageBoard?: boolean;
  onSelectCard: (card: CyberboardCard) => void;
  onUpdateCardDate?: (cardId: number, activityDate: string, activityEndDate: string) => Promise<void>;
  onAddNewCard?: (columnId?: number) => void;
}

type GroupByOption = "column" | "priority";

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

export default function GanttRoadmapView({
  board,
  columns,
  cards,
  canManageBoard,
  onSelectCard,
  onUpdateCardDate,
  onAddNewCard,
}: GanttRoadmapViewProps) {
  const currentYearNow = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNow);
  const [groupBy, setGroupBy] = useState<GroupByOption>("column");
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(false);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const gridTimelineRef = useRef<HTMLDivElement>(null);

  // Today calculations
  const today = new Date();
  const isTodayInSelectedYear = today.getFullYear() === selectedYear;

  // Calculate Today position percentage (0 to 100%)
  const todayPercentage = useMemo(() => {
    if (!isTodayInSelectedYear) return null;
    const startOfYear = new Date(selectedYear, 0, 1).getTime();
    const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59).getTime();
    const nowTime = today.getTime();
    if (nowTime < startOfYear || nowTime > endOfYear) return null;
    return ((nowTime - startOfYear) / (endOfYear - startOfYear)) * 100;
  }, [selectedYear, isTodayInSelectedYear, today]);

  // Jump to today line
  const handleJumpToToday = () => {
    if (!isTodayInSelectedYear) {
      setSelectedYear(today.getFullYear());
    }
    setTimeout(() => {
      if (gridTimelineRef.current && todayPercentage !== null) {
        const scrollWidth = gridTimelineRef.current.scrollWidth;
        const targetScroll = (scrollWidth * (todayPercentage / 100)) - (gridTimelineRef.current.clientWidth / 2);
        gridTimelineRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
      }
    }, 100);
  };

  // Group cards according to groupBy option
  const groupedData = useMemo(() => {
    if (groupBy === "column") {
      return columns.map((col, idx) => {
        const colCards = (col.cards || cards.filter((c) => c.column_id === col.id)).filter(
          (c) => !c.is_archived
        );
        return {
          id: `col-${col.id}`,
          columnId: col.id,
          title: col.title,
          color: col.color || PRESET_COLORS[idx % PRESET_COLORS.length],
          cards: colCards,
        };
      });
    } else {
      // Group by priority
      const priorities: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
      const priorityColors = {
        high: "#f43f5e",
        medium: "#f59e0b",
        low: "#10b981",
      };
      return priorities.map((prio) => {
        const prioCards = cards.filter((c) => !c.is_archived && c.priority === prio);
        return {
          id: `prio-${prio}`,
          columnId: undefined,
          title: `${prio.toUpperCase()} Priority`,
          color: priorityColors[prio],
          cards: prioCards,
        };
      });
    }
  }, [groupBy, columns, cards]);

  // Separate scheduled vs unscheduled cards
  const unscheduledCards = useMemo(() => {
    return cards.filter((c) => !c.is_archived && (!c.activity_date && !c.activity_end_date));
  }, [cards]);

  // Convert dates to grid percentage
  const getCardTimelinePosition = (card: CyberboardCard) => {
    const yearStart = new Date(selectedYear, 0, 1).getTime();
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59).getTime();
    const totalYearMs = yearEnd - yearStart;

    let startDate: Date;
    let endDate: Date;

    if (card.activity_date) {
      startDate = new Date(card.activity_date);
    } else if (card.activity_end_date) {
      const endD = new Date(card.activity_end_date);
      startDate = new Date(endD.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(card.created_at || Date.now());
    }

    if (card.activity_end_date) {
      endDate = new Date(card.activity_end_date);
    } else {
      endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    if (endDate.getTime() < startDate.getTime()) {
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    const clampedStartMs = Math.max(yearStart, startMs);
    const clampedEndMs = Math.min(yearEnd, endMs);

    const leftPercent = Math.max(0, Math.min(100, ((clampedStartMs - yearStart) / totalYearMs) * 100));
    const rightPercent = Math.max(0, Math.min(100, ((clampedEndMs - yearStart) / totalYearMs) * 100));
    const widthPercent = Math.max(2.5, rightPercent - leftPercent);

    return {
      leftPercent,
      widthPercent,
      startDateStr: startDate.toISOString().split("T")[0],
      endDateStr: endDate.toISOString().split("T")[0],
    };
  };

  // Format date helper
  const formatDateLabel = (dateStr?: string | null) => {
    if (!dateStr) return "Not set";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-surface-950 text-text-primary rounded-2xl border border-border/70 overflow-hidden shadow-xl">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-900/90 border-b border-border/80 backdrop-blur-md">
        {/* Left: View & Grouping */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-800/80 p-1 rounded-xl border border-border/60">
            <span className="text-xs text-text-muted font-medium px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Group by:
            </span>
            <button
              onClick={() => setGroupBy("column")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                groupBy === "column"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              Columns
            </button>
            <button
              onClick={() => setGroupBy("priority")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                groupBy === "priority"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              Priority
            </button>
          </div>

          {/* Unscheduled items badge */}
          {unscheduledCards.length > 0 && (
            <button
              onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showUnscheduledDrawer
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-surface-800/80 text-amber-400 border-border hover:bg-surface-700/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{unscheduledCards.length} Unscheduled</span>
            </button>
          )}
        </div>

        {/* Right: Timeline controls (Year Selector, Today Button) */}
        <div className="flex items-center gap-3">
          {/* Today Button */}
          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs font-bold text-primary hover:bg-primary/10 hover:border-primary/40 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>TODAY</span>
          </button>

          {/* Year selector */}
          <div className="flex items-center bg-surface-800/80 border border-border/70 rounded-xl px-1 py-0.5">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold tracking-wider text-text-primary font-mono">
              Year: {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Gantt Body Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Group Header Column */}
        <div className="w-48 sm:w-64 flex-shrink-0 bg-surface-900/90 border-r border-border/80 flex flex-col z-10 shadow-lg">
          {/* Header title box */}
          <div className="h-12 border-b border-border/80 px-4 flex items-center justify-between bg-surface-900/95 font-bold text-xs text-text-secondary uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {groupBy === "column" ? "Teams / Status" : "Priority"}
            </span>
            <span className="text-[10px] text-text-muted font-normal">
              {groupedData.length} groups
            </span>
          </div>

          {/* Rows List (Left Column) */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
            {groupedData.map((group) => (
              <div key={group.id} className="min-h-[96px] p-3.5 flex flex-col justify-center gap-1.5 bg-surface-900/40 hover:bg-surface-850/60 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-md flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: group.color }}
                    />
                    <h3 className="text-xs font-bold text-text-primary truncate">
                      {group.title}
                    </h3>
                  </div>

                  {canManageBoard && onAddNewCard && group.columnId && (
                    <button
                      onClick={() => onAddNewCard(group.columnId)}
                      className="p-1 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all cursor-pointer opacity-80 hover:opacity-100"
                      title="Add task to this column"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span className="px-2 py-0.5 rounded-full bg-surface-800 border border-border/60 text-text-secondary font-semibold">
                    {group.cards.length} {group.cards.length === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Timeline Grid Area */}
        <div
          ref={gridTimelineRef}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative scrollbar-thin bg-surface-950/90"
        >
          <div className="min-w-[900px] sm:min-w-[1100px] flex-1 flex flex-col relative">
            {/* Timeline Month Header Bar */}
            <div className="h-12 border-b border-border/80 flex items-center bg-surface-900/90 sticky top-0 z-20 backdrop-blur-md">
              {MONTH_NAMES.map((monthName) => (
                <div
                  key={monthName}
                  className="flex-1 h-full border-r border-border/40 flex items-center justify-center font-bold text-[11px] tracking-wider text-text-secondary hover:text-text-primary hover:bg-surface-800/40 transition-colors uppercase"
                >
                  {monthName}
                </div>
              ))}
            </div>

            {/* Background Month Grid Columns */}
            <div className="absolute inset-0 top-12 flex pointer-events-none z-0">
              {MONTH_NAMES.map((m, idx) => (
                <div
                  key={`grid-${idx}`}
                  className="flex-1 border-r border-border/20 h-full"
                />
              ))}

              {/* Vertical TODAY Line Indicator */}
              {todayPercentage !== null && (
                <div
                  className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
                  style={{ left: `${todayPercentage}%` }}
                >
                  <div className="w-0.5 h-full bg-gradient-to-b from-primary via-cyan-400 to-primary shadow-[0_0_8px_rgba(6,182,212,0.8)] border-r border-cyan-300/50" />
                  <div className="absolute bottom-2 translate-y-1/2 px-2 py-0.5 rounded-full bg-primary text-surface-950 text-[10px] font-black tracking-wider uppercase shadow-md shadow-primary/30 flex items-center gap-1 border border-cyan-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-950 animate-ping" />
                    TODAY
                  </div>
                </div>
              )}
            </div>

            {/* Gantt Group Channels / Rows */}
            <div className="flex-1 divide-y divide-border/40 relative z-10">
              {groupedData.map((group) => {
                const groupCards = group.cards;

                return (
                  <div
                    key={`gantt-row-${group.id}`}
                    className="min-h-[96px] p-2 flex flex-col justify-center gap-2 relative bg-transparent hover:bg-surface-900/20 transition-colors"
                  >
                    {groupCards.length === 0 ? (
                      <div className="h-10 flex items-center justify-center text-xs text-text-muted/60 italic">
                        No tasks in this group
                      </div>
                    ) : (
                      groupCards.map((card) => {
                        const { leftPercent, widthPercent } = getCardTimelinePosition(card);
                        const cardColor = card.color_tag || group.color || "#06b6d4";
                        const isHovered = hoveredCardId === card.id;

                        return (
                          <div
                            key={`bar-${card.id}`}
                            className="relative h-9 my-0.5 flex items-center group/bar"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              minWidth: "120px",
                            }}
                            onMouseEnter={() => setHoveredCardId(card.id)}
                            onMouseLeave={() => setHoveredCardId(null)}
                          >
                            {/* Gantt Task Bar Item */}
                            <div
                              onClick={() => onSelectCard(card)}
                              className={`w-full h-full rounded-xl px-3 flex items-center justify-between text-xs font-semibold text-white shadow-md cursor-pointer transition-all duration-200 border border-white/20 select-none overflow-hidden relative ${
                                isHovered ? "ring-2 ring-white/60 scale-[1.01] shadow-lg z-20" : ""
                              }`}
                              style={{
                                backgroundColor: cardColor,
                                backgroundImage: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
                              }}
                            >
                              {/* Title & info */}
                              <div className="flex items-center gap-2 min-w-0 pr-1 truncate">
                                <span className="truncate drop-shadow-xs font-bold text-white text-[11px] sm:text-xs">
                                  {card.title}
                                </span>
                              </div>

                              {/* Badges / Comments & Votes */}
                              <div className="flex items-center gap-2 flex-shrink-0 opacity-90 text-[10px]">
                                {(card.votes_count || 0) > 0 && (
                                  <span className="flex items-center gap-0.5 bg-black/25 px-1.5 py-0.5 rounded-md">
                                    <ThumbsUp className="w-3 h-3" />
                                    {card.votes_count}
                                  </span>
                                )}
                                {(card.comments_count || 0) > 0 && (
                                  <span className="flex items-center gap-0.5 bg-black/25 px-1.5 py-0.5 rounded-md">
                                    <MessageSquare className="w-3 h-3" />
                                    {card.comments_count}
                                  </span>
                                )}
                              </div>

                              {/* Sub progress accent line */}
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                                <div className="h-full bg-white/40 rounded-r" style={{ width: "100%" }} />
                              </div>
                            </div>

                            {/* Hover Tooltip Preview Popover */}
                            {isHovered && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-900/95 border border-border/90 backdrop-blur-xl rounded-xl p-3 shadow-2xl z-30 pointer-events-none text-text-primary text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-sm text-text-primary leading-tight">
                                    {card.title}
                                  </h4>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase flex-shrink-0"
                                    style={{ backgroundColor: cardColor }}
                                  >
                                    {card.priority}
                                  </span>
                                </div>

                                {card.description && (
                                  <p className="text-text-muted text-[11px] line-clamp-2">
                                    {card.description}
                                  </p>
                                )}

                                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary">
                                  <span className="flex items-center gap-1 font-mono">
                                    <Calendar className="w-3 h-3 text-primary" />
                                    {formatDateLabel(card.activity_date)} - {formatDateLabel(card.activity_end_date)}
                                  </span>
                                  {card.user?.name && (
                                    <span className="text-text-muted truncate max-w-[90px]">
                                      by {card.user.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Unscheduled Tasks Side Drawer */}
        {showUnscheduledDrawer && (
          <div className="w-72 bg-surface-900 border-l border-border/80 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-surface-850">
              <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4" /> Unscheduled ({unscheduledCards.length})
              </h3>
              <button
                onClick={() => setShowUnscheduledDrawer(false)}
                className="text-text-muted hover:text-text-primary text-xs font-semibold px-2 py-1 rounded bg-surface-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              {unscheduledCards.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-6">
                  All tasks have scheduled start & end dates! 🎉
                </p>
              ) : (
                unscheduledCards.map((card) => (
                  <div
                    key={`unscheduled-${card.id}`}
                    onClick={() => onSelectCard(card)}
                    className="p-3 bg-surface-800/80 hover:bg-surface-750 border border-border/60 rounded-xl cursor-pointer transition-all hover:border-primary/40 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-text-primary leading-snug">
                        {card.title}
                      </h4>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: card.color_tag || "#06b6d4" }}
                      />
                    </div>
                    <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Needs start/end date
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
