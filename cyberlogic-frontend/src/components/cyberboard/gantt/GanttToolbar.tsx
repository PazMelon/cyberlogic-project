import React, { useState, useRef, useEffect } from "react";
import {
  Layers, Lock, ZoomOut, ZoomIn, Calendar, Maximize2, ChevronLeft, ChevronRight,
  Clock, Loader2, Download, ChevronDown, ImageIcon, FileText, FileSpreadsheet, SlidersHorizontal
} from "lucide-react";

export interface GanttToolbarProps {
  onAddTask?: () => void;
  canEditGantt: boolean;
  showCriticalPath: boolean;
  setShowCriticalPath: React.Dispatch<React.SetStateAction<boolean>>;
  groupBy: "phase" | "column" | "priority" | "assignee";
  setGroupBy: (val: "phase" | "column" | "priority" | "assignee") => void;
  timeScale: "month" | "week" | "day" | "quarter";
  handleScaleChange: (scale: "month" | "week" | "day" | "quarter") => void;
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  startDateStr: string;
  setStartDateStr: (val: string) => void;
  endDateStr: string;
  setEndDateStr: (val: string) => void;
  handleFitToTaskDates: () => void;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  handleJumpToToday: () => void;
  showExportDropdown: boolean;
  setShowExportDropdown: (val: boolean) => void;
  isExporting: boolean;
  handleExportGanttPng: () => void;
  handleExportGanttPdf: () => void;
  handleExportExcelClick: () => void;
  unscheduledCardsCount: number;
  showUnscheduledDrawer: boolean;
  setShowUnscheduledDrawer: (val: boolean) => void;
  setShowGanttControlsSidebar: (val: boolean) => void;
}

const GROUP_OPTIONS: Array<{ value: "phase" | "column" | "priority" | "assignee"; label: string }> = [
  { value: "phase", label: "Phases" },
  { value: "column", label: "Columns" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
];

const SCALE_OPTIONS: Array<{ value: "quarter" | "month" | "week" | "day"; label: string }> = [
  { value: "quarter", label: "Quarters" },
  { value: "month", label: "Months" },
  { value: "week", label: "Weeks" },
  { value: "day", label: "Days" },
];

/** Compact dropdown trigger + flyout */
function ToolbarDropdown<T extends string>({
  options,
  value,
  onChange,
  icon,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (val: T) => void;
  icon?: React.ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-surface-800/80 border border-border/60 text-text-primary hover:bg-surface-700/60 transition-all cursor-pointer shadow-xs"
        title={label}
      >
        {icon}
        <span>{current?.label || value}</span>
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-36 bg-surface-900/98 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                opt.value === value
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-800"
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const GanttToolbar: React.FC<GanttToolbarProps> = ({
  onAddTask,
  canEditGantt,
  showCriticalPath,
  setShowCriticalPath,
  groupBy,
  setGroupBy,
  timeScale,
  handleScaleChange,
  zoomLevel,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  startDateStr,
  setStartDateStr,
  endDateStr,
  setEndDateStr,
  handleFitToTaskDates,
  selectedYear,
  setSelectedYear,
  handleJumpToToday,
  showExportDropdown,
  setShowExportDropdown,
  isExporting,
  handleExportGanttPng,
  handleExportGanttPdf,
  handleExportExcelClick,
  unscheduledCardsCount,
  showUnscheduledDrawer,
  setShowUnscheduledDrawer,
  setShowGanttControlsSidebar,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 bg-surface-900/95 border-b border-border/80 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      {/* Title & Add Task Block */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-text-primary">
          <Layers className="w-4 h-4 text-primary" />
          <span>Gantt Roadmap</span>
        </div>

        {canEditGantt && onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            className="px-3 py-1.5 rounded-xl bg-primary text-surface-950 hover:bg-primary-light text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer active:scale-95"
          >
            <span className="text-sm font-black">+</span>
            <span>Add Task</span>
          </button>
        )}

        {!canEditGantt && (
          <span
            className="px-2.5 py-1 rounded-xl bg-amber-950/70 border border-amber-600/50 text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 shadow-xs"
            title="Gantt chart drag-and-drop & editing is restricted by board policy"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>View-Only</span>
          </span>
        )}
      </div>

      {/* Desktop Toolbar Controls (>= 1280px xl screens) */}
      <div className="hidden xl:flex flex-wrap items-center gap-2 2xl:gap-3 justify-end flex-1 min-w-0">
        {/* Critical Path Toggle */}
        <button
          type="button"
          onClick={() => setShowCriticalPath((prev) => !prev)}
          className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
            showCriticalPath
              ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-md animate-pulse"
              : "bg-surface-800/80 text-text-secondary hover:text-text-primary border-border/60"
          }`}
          title="Toggle Critical Path Method (CPM) Highlighting"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Critical Path</span>
        </button>

        {/* Grouping Dropdown */}
        <ToolbarDropdown
          options={GROUP_OPTIONS}
          value={groupBy}
          onChange={setGroupBy}
          icon={<Layers className="w-3.5 h-3.5 text-primary" />}
          label="Group By"
        />

        {/* Scale Dropdown */}
        <ToolbarDropdown
          options={SCALE_OPTIONS}
          value={timeScale}
          onChange={handleScaleChange}
          icon={<Calendar className="w-3.5 h-3.5 text-primary" />}
          label="Time Scale"
        />

        {/* Zoom Level Control */}
        <div className="flex items-center gap-1 bg-surface-800/90 border border-border px-1.5 py-1 rounded-xl text-xs text-text-primary shadow-xs">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom Out Columns"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            onClick={handleResetZoom}
            className="px-1 text-xs font-bold text-text-primary font-mono cursor-pointer hover:text-primary transition-colors min-w-[36px] text-center"
            title="Click to reset zoom to 100%"
          >
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 250}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom In Columns"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Date Range Picker & Fit Tasks */}
        <div className="flex items-center gap-1 bg-surface-800/90 border border-border px-2 py-1 rounded-xl text-xs text-text-primary shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="bg-surface-900 border border-border/80 text-text-primary px-1.5 py-0.5 rounded-lg text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer"
          />
          <span className="text-text-muted font-bold text-xs">–</span>
          <input
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            className="bg-surface-900 border border-border/80 text-text-primary px-1.5 py-0.5 rounded-lg text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer"
          />
          <button
            onClick={handleFitToTaskDates}
            className="px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Limit timeline range to earliest start date & latest end date of tasks"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fit</span>
          </button>
        </div>

        {/* Year Selector & Today Button */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-surface-800 rounded-xl border border-border p-0.5">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-bold tracking-wider text-text-primary font-mono">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Center Timeline on Today"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Export Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface-900/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleExportGanttPng}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Export Chart as PNG</span>
                </button>
                <button
                  onClick={handleExportGanttPdf}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Export Chart as PDF</span>
                </button>
                <button
                  onClick={handleExportExcelClick}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export Board to Excel (.xlsx)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Unscheduled items badge */}
        {unscheduledCardsCount > 0 && (
          <button
            onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
            className={`px-2 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showUnscheduledDrawer
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-surface-800/80 text-amber-400 border-border hover:bg-surface-700/60"
            }`}
            title={`${unscheduledCardsCount} unscheduled tasks without dates`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{unscheduledCardsCount}</span>
          </button>
        )}
      </div>

      {/* Mobile & Tablet Controls Drawer Button (< 1280px xl screens) */}
      <div className="flex xl:hidden items-center gap-2">
        {unscheduledCardsCount > 0 && (
          <button
            onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
            className="px-2 py-1 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{unscheduledCardsCount}</span>
          </button>
        )}

        <button
          onClick={() => setShowGanttControlsSidebar(true)}
          className="px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-primary/25 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Gantt Controls</span>
        </button>
      </div>
    </div>
  );
};

export default GanttToolbar;
