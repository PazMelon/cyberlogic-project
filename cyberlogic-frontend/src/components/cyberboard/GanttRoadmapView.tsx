import React, { useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Layers,
  Clock,
  Plus,
  SlidersHorizontal,
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

type GroupByOption = "phase" | "column" | "priority" | "assignee";

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
  onUpdateCardDate: _onUpdateCardDate,
  onAddNewCard,
}: GanttRoadmapViewProps) {
  const currentYearNow = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNow);
  const [groupBy, setGroupBy] = useState<GroupByOption>("phase");
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(false);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const gridTimelineRef = useRef<HTMLDivElement>(null);

  const toggleParentExpand = (parentId: number) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

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
    const activeCards = cards.filter((c) => !c.is_archived);

    if (groupBy === "phase") {
      const phaseSettings = board.phase_settings || [
        { name: "Requirements & Planning", color: "#3b82f6" },
        { name: "Architecture & Design", color: "#8b5cf6" },
        { name: "Development & Implementation", color: "#06b6d4" },
        { name: "Testing & QA", color: "#f59e0b" },
        { name: "Deployment & Release", color: "#10b981" },
      ];

      const phaseMap = new Map<string, { id: string; columnId?: number; title: string; color: string; cards: CyberboardCard[] }>();

      phaseSettings.forEach((ps, idx) => {
        phaseMap.set(ps.name.toLowerCase(), {
          id: `phase-${idx}`,
          columnId: undefined,
          title: ps.name,
          color: ps.color || PRESET_COLORS[idx % PRESET_COLORS.length],
          cards: [],
        });
      });

      phaseMap.set("unphased", {
        id: "phase-unphased",
        columnId: undefined,
        title: "General / Unassigned Phase",
        color: "#64748b",
        cards: [],
      });

      activeCards.forEach((c) => {
        if (c.phase) {
          const key = c.phase.toLowerCase();
          if (!phaseMap.has(key)) {
            phaseMap.set(key, {
              id: `phase-custom-${key}`,
              columnId: undefined,
              title: c.phase,
              color: PRESET_COLORS[phaseMap.size % PRESET_COLORS.length],
              cards: [],
            });
          }
          phaseMap.get(key)?.cards.push(c);
        } else {
          phaseMap.get("unphased")?.cards.push(c);
        }
      });

      return Array.from(phaseMap.values()).filter((g) => g.cards.length > 0 || g.id !== "phase-unphased");
    } else if (groupBy === "column") {
      return columns.map((col, idx) => {
        const colCards = activeCards.filter((c) => c.column_id === col.id);
        return {
          id: `col-${col.id}`,
          columnId: col.id,
          title: col.title,
          color: col.color || PRESET_COLORS[idx % PRESET_COLORS.length],
          cards: colCards,
        };
      });
    } else if (groupBy === "priority") {
      const priorities: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
      const priorityColors = {
        high: "#f43f5e",
        medium: "#f59e0b",
        low: "#10b981",
      };
      return priorities.map((prio) => {
        const prioCards = activeCards.filter((c) => c.priority === prio);
        return {
          id: `prio-${prio}`,
          columnId: undefined,
          title: `${prio.toUpperCase()} Priority`,
          color: priorityColors[prio],
          cards: prioCards,
        };
      });
    } else {
      // Group by assignee
      const assigneeMap = new Map<string, { id: string; title: string; color: string; cards: CyberboardCard[]; avatar?: string }>();

      assigneeMap.set("unassigned", {
        id: "assignee-unassigned",
        title: "Unassigned Tasks",
        color: "#64748b",
        cards: [],
      });

      activeCards.forEach((c) => {
        if (c.assigned_user) {
          const key = `user-${c.assigned_user.id}`;
          if (!assigneeMap.has(key)) {
            assigneeMap.set(key, {
              id: `assignee-${c.assigned_user.id}`,
              title: `${c.assigned_user.first_name} ${c.assigned_user.last_name}`,
              color: PRESET_COLORS[assigneeMap.size % PRESET_COLORS.length],
              cards: [],
              avatar: c.assigned_user.avatar,
            });
          }
          assigneeMap.get(key)?.cards.push(c);
        } else {
          assigneeMap.get("unassigned")?.cards.push(c);
        }
      });

      return Array.from(assigneeMap.values()).filter((g) => g.cards.length > 0 || g.id !== "assignee-unassigned");
    }
  }, [groupBy, columns, cards]);

  const unscheduledCards = useMemo(() => {
    return cards.filter((c) => !c.is_archived && (!c.activity_date && !c.activity_end_date));
  }, [cards]);

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

    const cardStartMs = Math.max(yearStart, startDate.getTime());
    const cardEndMs = Math.min(yearEnd, endDate.getTime());

    const leftPercent = Math.max(0, Math.min(100, ((cardStartMs - yearStart) / totalYearMs) * 100));
    const rightPercent = Math.max(0, Math.min(100, ((cardEndMs - yearStart) / totalYearMs) * 100));
    const widthPercent = Math.max(3, rightPercent - leftPercent);

    return {
      leftPercent,
      widthPercent,
      startDateStr: startDate.toISOString().split("T")[0],
      endDateStr: endDate.toISOString().split("T")[0],
    };
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full bg-surface-950 text-text-primary overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-900/90 border-b border-border/80 backdrop-blur-md">
        {/* Left: Grouping buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-800/80 p-1 rounded-xl border border-border/60">
            <span className="text-xs text-text-muted font-medium px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Group by:
            </span>
            <button
              onClick={() => setGroupBy("phase")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                groupBy === "phase"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              SDLC Phase
            </button>
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
            <button
              onClick={() => setGroupBy("assignee")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                groupBy === "assignee"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              Assignee
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

        {/* Right: Year Selector & Today Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs font-bold text-primary hover:bg-primary/10 hover:border-primary/40 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          <div className="flex items-center bg-surface-800 rounded-xl border border-border p-0.5">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold tracking-wider text-text-primary font-mono">
              {selectedYear}
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

      {/* 2. Main Gantt Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Column: Group & Task Hierarchy Titles */}
        <div className="w-56 sm:w-72 flex-shrink-0 bg-surface-900/90 border-r border-border/80 flex flex-col z-10 shadow-lg">
          <div className="h-12 border-b border-border/80 px-4 flex items-center justify-between bg-surface-900/95 font-bold text-xs text-text-secondary uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {groupBy === "phase" ? "SDLC Phases" : groupBy === "column" ? "Stages" : groupBy === "priority" ? "Priority" : "Assignees"}
            </span>
            <span className="text-[10px] text-text-muted font-normal">
              {groupedData.length} groups
            </span>
          </div>

          {/* Rows List (Left Panel) */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
            {groupedData.map((group) => {
              const parentCards = group.cards.filter((c) => !c.parent_id);

              return (
                <div key={group.id} className="bg-surface-900/40">
                  {/* Group Title Bar */}
                  <div className="h-[44px] px-3 flex items-center justify-between gap-2 bg-surface-900/80 border-b border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="text-xs font-bold text-text-primary truncate">
                        {group.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-surface-800 border border-border/60 text-[10px] text-text-secondary font-semibold">
                        {group.cards.length}
                      </span>
                      {canManageBoard && onAddNewCard && group.columnId && (
                        <button
                          onClick={() => onAddNewCard(group.columnId)}
                          className="p-1 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                          title="Add task"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Group Items List (Tree Rows) */}
                  <div className="divide-y divide-border/20">
                    {parentCards.length === 0 ? (
                      <div className="h-[44px] px-3 flex items-center text-[11px] text-text-muted/60 italic border-b border-border/20">No tasks in group</div>
                    ) : (
                      parentCards.map((card) => {
                        const hasSubCards = card.sub_cards && card.sub_cards.length > 0;
                        const isExpanded = !!expandedParents[card.id];

                        return (
                          <React.Fragment key={`row-left-${card.id}`}>
                            {/* Parent Card Row */}
                            <div className="h-[44px] px-3 flex items-center justify-between gap-2 hover:bg-surface-800/40 transition-colors border-b border-border/20">
                              <div className="flex items-center gap-2 min-w-0">
                                {hasSubCards ? (
                                  <button
                                    onClick={() => toggleParentExpand(card.id)}
                                    className="p-0.5 rounded hover:bg-surface-700 text-text-muted hover:text-text-primary transition-all cursor-pointer flex-shrink-0"
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                                    />
                                  </button>
                                ) : (
                                  <span className="w-3.5 flex-shrink-0" />
                                )}

                                <span
                                  onClick={() => onSelectCard(card)}
                                  className="text-xs font-semibold text-text-primary hover:text-primary cursor-pointer truncate"
                                >
                                  {card.title}
                                </span>
                              </div>

                              {card.assigned_user && (
                                <img
                                  src={card.assigned_user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.assigned_user.first_name)}&background=06b6d4&color=fff`}
                                  alt={card.assigned_user.first_name}
                                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                  title={`Assigned to ${card.assigned_user.first_name}`}
                                />
                              )}
                            </div>

                            {/* Sub-cards Indented Rows */}
                            {isExpanded &&
                              card.sub_cards?.map((subCard) => (
                                <div
                                  key={`row-left-sub-${subCard.id}`}
                                  className="h-[38px] pl-8 pr-3 flex items-center justify-between gap-2 bg-surface-950/40 hover:bg-surface-800/30 transition-colors border-l-2 border-primary/30 border-b border-border/20"
                                >
                                  <span
                                    onClick={() => onSelectCard(subCard)}
                                    className="text-[11px] font-medium text-text-secondary hover:text-primary cursor-pointer truncate"
                                  >
                                    ↳ {subCard.title}
                                  </span>

                                  {subCard.assigned_user && (
                                    <img
                                      src={subCard.assigned_user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(subCard.assigned_user.first_name)}&background=06b6d4&color=fff`}
                                      alt={subCard.assigned_user.first_name}
                                      className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
                                      title={`Assigned to ${subCard.assigned_user.first_name}`}
                                    />
                                  )}
                                </div>
                              ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Timeline Grid & Bars */}
        <div
          ref={gridTimelineRef}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative scrollbar-thin bg-surface-950"
        >
          <div className="min-w-[950px] sm:min-w-[1150px] flex-1 flex flex-col relative">
            {/* Months Header Bar */}
            <div className="h-12 border-b border-border/80 flex items-center bg-surface-900/90 sticky top-0 z-20 backdrop-blur-md">
              {MONTH_NAMES.map((monthName) => (
                <div
                  key={monthName}
                  className="flex-1 h-full border-r border-border/40 flex items-center justify-center font-bold text-[11px] tracking-wider text-text-secondary uppercase"
                >
                  {monthName}
                </div>
              ))}
            </div>

            {/* Background Grid Columns */}
            <div className="absolute inset-0 top-12 flex pointer-events-none z-0">
              {MONTH_NAMES.map((_, idx) => (
                <div key={`grid-${idx}`} className="flex-1 border-r border-border/20 h-full" />
              ))}

              {/* Vertical TODAY Line */}
              {todayPercentage !== null && (
                <div
                  className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
                  style={{ left: `${todayPercentage}%` }}
                >
                  <div className="w-0.5 h-full bg-gradient-to-b from-primary via-cyan-400 to-primary shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <div className="absolute bottom-2 px-2 py-0.5 rounded-full bg-primary text-surface-950 text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-950 animate-ping" />
                    TODAY
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Rows Body */}
            <div className="flex-1 divide-y divide-border/40 relative z-10">
              {groupedData.map((group) => {
                const parentCards = group.cards.filter((c) => !c.parent_id);

                return (
                  <div key={`gantt-grid-group-${group.id}`} className="bg-transparent">
                    {/* Group Header Spacer */}
                    <div className="h-[44px] border-b border-border/40 bg-surface-900/30" />

                    {/* Timeline Bars for Cards & Sub-Cards */}
                    <div className="divide-y divide-border/20">
                      {parentCards.length === 0 ? (
                        <div className="h-[44px] border-b border-border/20 flex items-center justify-center text-[11px] text-text-muted/40 italic pointer-events-none">
                          No tasks in group
                        </div>
                      ) : (
                        parentCards.map((card) => {
                          const { leftPercent, widthPercent } = getCardTimelinePosition(card);
                          const cardColor = card.color_tag || group.color || "#06b6d4";
                          const isHovered = hoveredCardId === card.id;
                          const isExpanded = !!expandedParents[card.id];

                          return (
                            <React.Fragment key={`gantt-row-parent-${card.id}`}>
                              {/* Parent Bar Row */}
                              <div className="h-[44px] px-2 flex items-center relative hover:bg-surface-900/10 transition-colors border-b border-border/20">
                              <div
                                className="relative h-8 my-0.5 flex items-center group/bar"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  minWidth: "120px",
                                }}
                                onMouseEnter={() => setHoveredCardId(card.id)}
                                onMouseLeave={() => setHoveredCardId(null)}
                              >
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
                                  <div className="flex items-center gap-1.5 truncate pr-1">
                                    <span className="truncate drop-shadow-xs font-bold text-white text-[11px]">
                                      {card.title}
                                    </span>
                                  </div>

                                  {card.assigned_user && (
                                    <img
                                      src={card.assigned_user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.assigned_user.first_name)}&background=06b6d4&color=fff`}
                                      alt={card.assigned_user.first_name}
                                      className="w-4 h-4 rounded-full border border-white/40 flex-shrink-0 object-cover"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Sub-Card Timeline Bars */}
                            {isExpanded &&
                              card.sub_cards?.map((subCard) => {
                                const subPos = getCardTimelinePosition(subCard);
                                const subColor = subCard.color_tag || cardColor;
                                const isSubHovered = hoveredCardId === subCard.id;

                                return (
                                  <div
                                    key={`gantt-row-sub-${subCard.id}`}
                                    className="h-[38px] px-2 flex items-center relative bg-surface-950/20 hover:bg-surface-900/10 transition-colors border-b border-border/20"
                                  >
                                    <div
                                      className="relative h-6 my-0.5 flex items-center group/bar"
                                      style={{
                                        left: `${subPos.leftPercent}%`,
                                        width: `${subPos.widthPercent}%`,
                                        minWidth: "100px",
                                      }}
                                      onMouseEnter={() => setHoveredCardId(subCard.id)}
                                      onMouseLeave={() => setHoveredCardId(null)}
                                    >
                                      <div
                                        onClick={() => onSelectCard(subCard)}
                                        className={`w-full h-full rounded-lg px-2.5 flex items-center justify-between text-[11px] font-medium text-white shadow-sm cursor-pointer transition-all duration-200 border border-white/20 select-none overflow-hidden relative ${
                                          isSubHovered ? "ring-2 ring-white/60 scale-[1.01] z-20" : ""
                                        }`}
                                        style={{
                                          backgroundColor: subColor,
                                          opacity: 0.9,
                                        }}
                                      >
                                        <span className="truncate drop-shadow-xs font-semibold">
                                          ↳ {subCard.title}
                                        </span>

                                        {subCard.assigned_user && (
                                          <img
                                            src={subCard.assigned_user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(subCard.assigned_user.first_name)}&background=06b6d4&color=fff`}
                                            alt={subCard.assigned_user.first_name}
                                            className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              </React.Fragment>
                            );
                          })
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
