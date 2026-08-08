import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown, ChevronRight, Calendar, Layers, Clock, Plus, SlidersHorizontal, Users,
  ZoomIn, ZoomOut, X, Image as ImageIcon, FileText, Maximize2, FileSpreadsheet,
  Loader2, PanelLeftClose, PanelLeftOpen, AlertTriangle
} from "lucide-react";
import type { CyberboardBoard, CyberboardColumn, CyberboardCard, CyberboardChecklistItem } from "../../utils/api";
import { updateCyberboardCard, batchReorderCyberboardCards } from "../../utils/api";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { exportBoardToExcel } from "../../utils/exportBoardToExcel";
import GanttDependencyCanvas from "./gantt/GanttDependencyCanvas";
import GanttTimelineHeader from "./gantt/GanttTimelineHeader";
import GanttToolbar from "./gantt/GanttToolbar";
import GanttQuickCreateModal from "./gantt/GanttQuickCreateModal";
import { PRESET_COLORS, MONTH_NAMES } from "./shared/cyberboardConstants";
import { parseLocalDate } from "./shared/cyberboardUtils";

interface GanttRoadmapViewProps {
  board: CyberboardBoard;
  columns: CyberboardColumn[];
  cards: CyberboardCard[];
  canManageBoard?: boolean;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  isAdmin?: boolean;
  onSelectCard: (card: CyberboardCard) => void;
  onUpdateCardDate?: (cardId: number, activityDate: string, activityEndDate: string) => Promise<void>;
  onAddNewCard?: (
    columnId?: number,
    initialData?: {
      phase?: string;
      activity_date?: string;
      activity_end_date?: string;
      is_milestone?: boolean;
    }
  ) => void;
  onUpdateCardPhase?: (cardId: number, phase: string) => Promise<void>;
  onMoveCardColumn?: (cardId: number, targetColumnId: number) => Promise<void>;
  onUpdateCardPriority?: (cardId: number, priority: "high" | "medium" | "low") => Promise<void>;
  onUpdateCardAssignees?: (cardId: number, userIds: number[]) => Promise<void>;
  onQuickCreateCard?: (data: {
    title: string;
    phase?: string;
    activity_date?: string;
    activity_end_date?: string;
    is_milestone?: boolean;
    priority?: "low" | "medium" | "high";
    parent_id?: number | null;
    column_id?: number;
  }) => Promise<void>;
}

type TimeScaleMode = "month" | "week" | "day" | "quarter";

export default function GanttRoadmapView({
  board,
  columns,
  cards,
  canManageBoard,
  currentUserId,
  userRole,
  boardHostId,
  isAdmin,
  onSelectCard,
  onUpdateCardDate,
  onAddNewCard,
  onUpdateCardPhase,
  onMoveCardColumn,
  onUpdateCardPriority,
  onUpdateCardAssignees,
  onQuickCreateCard,
}: GanttRoadmapViewProps) {
  const canEditGantt = useMemo(() => {
    const isHost = boardHostId && currentUserId ? boardHostId === currentUserId : (board.created_by === currentUserId);
    if (isHost || isAdmin) return true;
    const policy = board.gantt_edit_policy || "everyone";
    if (policy === "everyone") return true;
    if (policy === "host_admin_only") return false;
    if (policy === "specific_roles") {
      const allowedRoles = board.allowed_gantt_editor_roles || [];
      return Boolean(userRole && allowedRoles.includes(userRole));
    }
    if (policy === "specific_users") {
      const allowedUsers = board.allowed_gantt_editor_users || [];
      return Boolean(currentUserId && allowedUsers.includes(currentUserId));
    }
    return true;
  }, [board, boardHostId, currentUserId, isAdmin, userRole]);
  const currentYearNow = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNow);
  const [startDateStr, setStartDateStr] = useState<string>(`${currentYearNow}-01-01`);
  const [endDateStr, setEndDateStr] = useState<string>(`${currentYearNow}-12-31`);
  const [timeScale, setTimeScale] = useState<"month" | "week" | "day" | "quarter">("week");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [groupBy, setGroupBy] = useState<"phase" | "column" | "priority" | "assignee">("phase");
  const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false);
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(false);
  const [showGanttControlsSidebar, setShowGanttControlsSidebar] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [hoveredAssigneeCardId, setHoveredAssigneeCardId] = useState<number | null>(null);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState<boolean>(false);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
  const [customCardDates, setCustomCardDates] = useState<Record<number, { activity_date?: string | null; activity_end_date?: string | null }>>({});
  const [quickTypePromptData, setQuickTypePromptData] = useState<{
    isOpen: boolean;
    phase?: string;
    startDate?: string;
    endDate?: string;
  } | null>(null);
  const [ganttQuickCreateData, setGanttQuickCreateData] = useState<{
    type: "task" | "milestone" | "subtask";
    phase: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const [dragCreateState, setDragCreateState] = useState<{
    isDragging: boolean;
    groupPhase: string;
    rowId: string;
    startX: number;
    currentX: number;
    rowElement: HTMLElement | null;
  } | null>(null);

  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const skipYearResetRef = useRef<boolean>(false);

  const isColumnCompleted = useCallback((colId?: number | null) => {
    if (!colId || !columns || columns.length === 0) return false;
    const col = columns.find((c) => c.id === colId);
    if (!col) return false;
    const lastColPosition = columns.reduce((max, c) => Math.max(max, c.position ?? 0), 0);
    return (
      col.status_type === "completed" ||
      col.title.toLowerCase().includes("done") ||
      col.title.toLowerCase().includes("completed") ||
      (col.position !== undefined && col.position === lastColPosition && lastColPosition > 0)
    );
  }, [columns]);

  // Critical Path Method (CPM) calculation for Slack Time, Bottlenecks & Overdue Tasks
  const criticalPathCardIds = useMemo(() => {
    const criticalSet = new Set<number>();
    if (!cards || cards.length === 0) return criticalSet;

    const activeCards = cards.filter((c) => !c.is_archived);
    if (activeCards.length === 0) return criticalSet;

    const cardMap = new Map<number, { id: number; duration: number; preds: number[]; succs: number[] }>();

    activeCards.forEach((c) => {
      const startMs = c.activity_date ? new Date(c.activity_date).getTime() : 0;
      const endMs = c.activity_end_date ? new Date(c.activity_end_date).getTime() : (startMs > 0 ? startMs + 86400000 : Date.now());
      const duration = Math.max(1, Math.round((endMs - startMs) / 86400000));
      const predIds = c.predecessor_ids && c.predecessor_ids.length > 0 ? c.predecessor_ids : (c.predecessor_id ? [c.predecessor_id] : []);

      cardMap.set(c.id, {
        id: c.id,
        duration,
        preds: predIds,
        succs: [],
      });
    });

    cardMap.forEach((node) => {
      node.preds.forEach((pId) => {
        if (cardMap.has(pId)) {
          cardMap.get(pId)!.succs.push(node.id);
        }
      });
    });

    const esMap = new Map<number, number>();
    const getES = (id: number, visited = new Set<number>()): number => {
      if (esMap.has(id)) return esMap.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);

      const node = cardMap.get(id);
      if (!node || node.preds.length === 0) {
        esMap.set(id, 0);
        return 0;
      }
      let maxP = 0;
      node.preds.forEach((pId) => {
        const pNode = cardMap.get(pId);
        if (pNode) {
          const pEF = getES(pId, new Set(visited)) + pNode.duration;
          if (pEF > maxP) maxP = pEF;
        }
      });
      esMap.set(id, maxP);
      return maxP;
    };

    let maxProjectEF = 0;
    cardMap.forEach((node) => {
      const es = getES(node.id);
      const ef = es + node.duration;
      if (ef > maxProjectEF) maxProjectEF = ef;
    });

    const hasAnyDependencies = Array.from(cardMap.values()).some((n) => n.preds.length > 0 || n.succs.length > 0);
    const todayMs = new Date().setHours(0, 0, 0, 0);

    cardMap.forEach((node) => {
      const cardObj = cards.find((c) => c.id === node.id);
      const isDone = isColumnCompleted(cardObj?.column_id);
      const dueMs = cardObj?.activity_end_date ? new Date(cardObj.activity_end_date).getTime() : 0;
      const isOverdue = !isDone && dueMs > 0 && dueMs < todayMs;
      // Imminent Deadline Risk: uncompleted task due today or within 24 hours
      const isImminentRisk = !isDone && dueMs > 0 && (dueMs - todayMs) <= 86400000;

      if (isOverdue || isImminentRisk) {
        criticalSet.add(node.id);
        return;
      }

      if (hasAnyDependencies) {
        const getLF = (id: number, visited = new Set<number>()): number => {
          if (visited.has(id)) return maxProjectEF;
          visited.add(id);

          const n = cardMap.get(id);
          if (!n || n.succs.length === 0) return maxProjectEF;
          let minS = Infinity;
          n.succs.forEach((sId) => {
            const sNode = cardMap.get(sId);
            if (sNode) {
              const sLS = getLF(sId, new Set(visited)) - sNode.duration;
              if (sLS < minS) minS = sLS;
            }
          });
          return minS === Infinity ? maxProjectEF : minS;
        };

        const es = getES(node.id);
        const lf = getLF(node.id);
        const ls = lf - node.duration;
        const slack = ls - es;

        // Near-Critical Tasks: Float/Slack <= 1 day in dependency network
        if (slack <= 1 && (node.preds.length > 0 || node.succs.length > 0)) {
          criticalSet.add(node.id);
        }
      }
    });

    return criticalSet;
  }, [cards, isColumnCompleted]);

  // Close Gantt controls sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowGanttControlsSidebar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-fit date bounds to earliest start date & latest end date of tasks
  const handleFitToTaskDates = useCallback(() => {
    let minMs: number | null = null;
    let maxMs: number | null = null;

    cards.forEach((c) => {
      if (c.is_archived) return;
      if (c.activity_date) {
        const ms = new Date(c.activity_date).getTime();
        if (!isNaN(ms)) {
          if (minMs === null || ms < minMs) minMs = ms;
          if (maxMs === null || ms > maxMs) maxMs = ms;
        }
      }
      if (c.activity_end_date) {
        const ms = new Date(c.activity_end_date).getTime();
        if (!isNaN(ms)) {
          if (minMs === null || ms < minMs) minMs = ms;
          if (maxMs === null || ms > maxMs) maxMs = ms;
        }
      }
    });

    if (minMs !== null && maxMs !== null) {
      const bufferedMinMs = minMs - 2 * 24 * 60 * 60 * 1000;
      const bufferedMaxMs = maxMs + 2 * 24 * 60 * 60 * 1000;
      const minDate = new Date(bufferedMinMs).toISOString().split("T")[0];
      const maxDate = new Date(bufferedMaxMs).toISOString().split("T")[0];
      const minYear = new Date(bufferedMinMs).getFullYear();
      if (minYear !== selectedYear) {
        skipYearResetRef.current = true;
        setSelectedYear(minYear);
      }
      setStartDateStr(minDate);
      setEndDateStr(maxDate);
    }
  }, [cards, selectedYear]);

  // Initial mount auto-fit if scheduled cards exist
  useEffect(() => {
    let minMs: number | null = null;
    let maxMs: number | null = null;
    cards.forEach((c) => {
      if (c.is_archived) return;
      if (c.activity_date) {
        const ms = new Date(c.activity_date).getTime();
        if (!isNaN(ms)) {
          if (minMs === null || ms < minMs) minMs = ms;
          if (maxMs === null || ms > maxMs) maxMs = ms;
        }
      }
      if (c.activity_end_date) {
        const ms = new Date(c.activity_end_date).getTime();
        if (!isNaN(ms)) {
          if (minMs === null || ms < minMs) minMs = ms;
          if (maxMs === null || ms > maxMs) maxMs = ms;
        }
      }
    });

    if (minMs !== null && maxMs !== null) {
      const minDate = new Date(minMs).toISOString().split("T")[0];
      const maxDate = new Date(maxMs).toISOString().split("T")[0];
      const minYear = new Date(minMs).getFullYear();
      if (minYear !== selectedYear) {
        skipYearResetRef.current = true;
        setSelectedYear(minYear);
      }
      setStartDateStr(minDate);
      setEndDateStr(maxDate);
    }
  }, []);

  const ganttWorkspaceRef = useRef<HTMLDivElement>(null);

  const captureGanttChartImage = async (targetEl: HTMLElement): Promise<string> => {
    // Allow React frame to repaint with isExporting = true (hiding avatars and Today marker)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const leftEl = leftScrollRef.current;
    const rightEl = gridTimelineRef.current;

    const origTargetHeight = targetEl.style.height;
    const origTargetMaxHeight = targetEl.style.maxHeight;
    const origTargetOverflow = targetEl.style.overflow;

    const origLeftHeight = leftEl ? leftEl.style.height : "";
    const origLeftMaxHeight = leftEl ? leftEl.style.maxHeight : "";
    const origLeftOverflow = leftEl ? leftEl.style.overflow : "";

    const origRightHeight = rightEl ? rightEl.style.height : "";
    const origRightMaxHeight = rightEl ? rightEl.style.maxHeight : "";
    const origRightOverflow = rightEl ? rightEl.style.overflow : "";

    const leftColWidth = leftEl ? leftEl.clientWidth : 400;
    const rightGridScrollWidth = rightEl ? rightEl.scrollWidth : gridMinWidth;
    const fullWidth = leftColWidth + rightGridScrollWidth;

    const leftColScrollHeight = leftEl ? leftEl.scrollHeight + 48 : 0;
    const rightGridScrollHeight = rightEl ? rightEl.scrollHeight + 48 : 0;
    const fullHeight = Math.max(targetEl.scrollHeight, leftColScrollHeight, rightGridScrollHeight);

    const origTargetBg = targetEl.style.backgroundColor;
    const origTargetColor = targetEl.style.color;

    const origLeftBg = leftEl ? leftEl.style.backgroundColor : "";
    const origRightBg = rightEl ? rightEl.style.backgroundColor : "";

    const styledSubNodes: { node: HTMLElement; origBg: string; origColor: string; origBorder: string }[] = [];

    try {
      // Pin Unified Professional Light Standard Export Theme (#ffffff canvas, #f1f5f9 headers, #0f172a text)
      targetEl.style.backgroundColor = "#ffffff";
      targetEl.style.color = "#0f172a";

      if (leftEl) {
        leftEl.style.height = `${fullHeight}px`;
        leftEl.style.maxHeight = "none";
        leftEl.style.overflow = "visible";
        leftEl.style.backgroundColor = "#ffffff";
      }
      if (rightEl) {
        rightEl.style.height = `${fullHeight}px`;
        rightEl.style.maxHeight = "none";
        rightEl.style.overflow = "visible";
        rightEl.style.backgroundColor = "#ffffff";
      }
      targetEl.style.height = `${fullHeight}px`;
      targetEl.style.maxHeight = "none";
      targetEl.style.overflow = "visible";

      // Pin sub-nodes to high-contrast Light Standard colors
      const subNodes = targetEl.querySelectorAll<HTMLElement>("*");
      subNodes.forEach((node) => {
        const cls = typeof node.className === "string" ? node.className : "";
        const origBg = node.style.backgroundColor;
        const origColor = node.style.color;
        const origBorder = node.style.borderColor;

        let modified = false;

        if (cls.includes("bg-surface-900") || cls.includes("bg-surface-800")) {
          node.style.backgroundColor = "#f1f5f9";
          node.style.color = "#0f172a";
          modified = true;
        } else if (cls.includes("bg-surface-950")) {
          node.style.backgroundColor = "#ffffff";
          node.style.color = "#0f172a";
          modified = true;
        } else if (cls.includes("border-border")) {
          node.style.borderColor = "#cbd5e1";
          modified = true;
        }

        if (cls.includes("text-text-primary")) {
          node.style.color = "#0f172a";
          modified = true;
        } else if (cls.includes("text-text-secondary") || cls.includes("text-text-muted")) {
          node.style.color = "#475569";
          modified = true;
        }

        if (modified) {
          styledSubNodes.push({ node, origBg, origColor, origBorder });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 60));

      return await toPng(targetEl, {
        cacheBust: false,
        skipFonts: true,
        imagePlaceholder:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='10' fill='%2306b6d4'/></svg>",
        backgroundColor: "#ffffff",
        quality: 0.95,
        width: fullWidth,
        height: fullHeight,
        style: {
          overflow: "visible",
          width: `${fullWidth}px`,
          height: `${fullHeight}px`,
          maxHeight: "none",
          maxWidth: "none",
          backgroundColor: "#ffffff",
          color: "#0f172a",
        },
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains("export-ignore")) {
            return false;
          }
          if (node.tagName === "LINK" && node.getAttribute("rel") === "stylesheet") {
            const href = node.getAttribute("href") || "";
            if (href.startsWith("http") && !href.includes(window.location.hostname)) {
              return false;
            }
          }
          return true;
        },
      });
    } finally {
      // Restore original inline styles
      styledSubNodes.forEach(({ node, origBg, origColor, origBorder }) => {
        node.style.backgroundColor = origBg;
        node.style.color = origColor;
        node.style.borderColor = origBorder;
      });

      if (leftEl) {
        leftEl.style.height = origLeftHeight;
        leftEl.style.maxHeight = origLeftMaxHeight;
        leftEl.style.overflow = origLeftOverflow;
        leftEl.style.backgroundColor = origLeftBg;
      }
      if (rightEl) {
        rightEl.style.height = origRightHeight;
        rightEl.style.maxHeight = origRightMaxHeight;
        rightEl.style.overflow = origRightOverflow;
        rightEl.style.backgroundColor = origRightBg;
      }
      targetEl.style.height = origTargetHeight;
      targetEl.style.maxHeight = origTargetMaxHeight;
      targetEl.style.overflow = origTargetOverflow;
      targetEl.style.backgroundColor = origTargetBg;
      targetEl.style.color = origTargetColor;
    }
  };

  const handleExportGanttPng = async () => {
    const targetEl = ganttWorkspaceRef.current || containerRef.current;
    if (!targetEl) return;
    setIsExporting(true);
    setShowExportDropdown(false);
    try {
      const dataUrl = await captureGanttChartImage(targetEl);
      const link = document.createElement("a");
      link.download = `${(board.title || "Gantt_Chart").replace(/[^a-z0-9]/gi, "_")}_Gantt.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export Gantt chart as PNG:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGanttPdf = async () => {
    const targetEl = ganttWorkspaceRef.current || containerRef.current;
    if (!targetEl) return;
    setIsExporting(true);
    setShowExportDropdown(false);
    try {
      const dataUrl = await captureGanttChartImage(targetEl);

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${(board.title || "Gantt_Chart").replace(/[^a-z0-9]/gi, "_")}_Gantt.pdf`);
    } catch (err) {
      console.error("Failed to export Gantt chart as PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcelClick = () => {
    setShowExportDropdown(false);
    exportBoardToExcel(board, columns, cards);
  };

  const handleRemoveDependency = async (targetCardId: number, fromCardId: number) => {
    if (!canEditGantt) return;
    const allCards = columns.flatMap((col) => col.cards || []);
    const targetCard = allCards.find((c) => c.id === targetCardId);
    if (!targetCard) return;

    const existingPredIds = (targetCard.predecessor_ids && targetCard.predecessor_ids.length > 0)
      ? targetCard.predecessor_ids
      : (targetCard.predecessor_id ? [targetCard.predecessor_id] : []);

    const nextPredIds = existingPredIds.filter((id) => id !== fromCardId);

    try {
      await updateCyberboardCard(targetCardId, {
        predecessor_ids: nextPredIds,
        predecessor_id: nextPredIds[0] || null,
      });
    } catch (err) {
      console.error("Failed to remove dependency:", err);
    }
  };

  // Interactive Drag-to-Link Dependency State
  const [linkingState, setLinkingState] = useState<{
    fromCardId: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    targetCardId: number | null;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const gridTimelineRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef<boolean>(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Observe actual DOM width of gridTimelineRef container for perfect SVG scaling
  useEffect(() => {
    const el = gridTimelineRef.current;
    if (!el) return;
    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };
    updateWidth();
    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Drag-to-Link global mousemove and mouseup listeners with edge-scrolling
  const linkingStateRef = useRef(linkingState);
  linkingStateRef.current = linkingState;
  const latestMousePosRef = useRef<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    if (!linkingState) return;

    let animFrameId: number;

    const updateLinkAndEdgeScroll = () => {
      if (!gridTimelineRef.current || !linkingStateRef.current) {
        animFrameId = requestAnimationFrame(updateLinkAndEdgeScroll);
        return;
      }

      if (latestMousePosRef.current) {
        const { clientX, clientY } = latestMousePosRef.current;
        const gridEl = gridTimelineRef.current;
        const containerRect = gridEl.getBoundingClientRect();

        // Edge scroll detection zone (60px from container edges)
        const edgeMargin = 60;
        let dx = 0;
        let dy = 0;

        if (clientX > containerRect.right - edgeMargin) {
          dx = Math.min(24, Math.max(4, (clientX - (containerRect.right - edgeMargin)) * 0.35));
        } else if (clientX < containerRect.left + edgeMargin) {
          dx = -Math.min(24, Math.max(4, (containerRect.left + edgeMargin - clientX) * 0.35));
        }

        if (clientY > containerRect.bottom - edgeMargin) {
          dy = Math.min(24, Math.max(4, (clientY - (containerRect.bottom - edgeMargin)) * 0.35));
        } else if (clientY < containerRect.top + edgeMargin) {
          dy = -Math.min(24, Math.max(4, (containerRect.top + edgeMargin - clientY) * 0.35));
        }

        if (dx !== 0 || dy !== 0) {
          gridEl.scrollLeft += dx;
          gridEl.scrollTop += dy;
          if (leftScrollRef.current) {
            leftScrollRef.current.scrollTop = gridEl.scrollTop;
          }
        }

        const rowsEl = gridEl.querySelector(".flex-1.relative.z-10") || gridEl;
        const rowsRect = rowsEl.getBoundingClientRect();
        const currentX = clientX - rowsRect.left;
        const currentY = clientY - rowsRect.top;

        let hoveredTargetId: number | null = null;
        const elements = document.elementsFromPoint(clientX, clientY);
        for (const el of elements) {
          const cardIdAttr = el.getAttribute("data-gantt-card-id");
          if (cardIdAttr) {
            const id = Number(cardIdAttr);
            if (id && id !== linkingStateRef.current.fromCardId) {
              hoveredTargetId = id;
              break;
            }
          }
        }

        setLinkingState((prev) =>
          prev ? { ...prev, currentX, currentY, targetCardId: hoveredTargetId } : null
        );
      }

      animFrameId = requestAnimationFrame(updateLinkAndEdgeScroll);
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestMousePosRef.current = { clientX: e.clientX, clientY: e.clientY };
    };

    const handleMouseUp = async () => {
      cancelAnimationFrame(animFrameId);
      const activeState = linkingStateRef.current;
      if (activeState && activeState.targetCardId) {
        const targetId = activeState.targetCardId;
        const sourceId = activeState.fromCardId;
        const allCards = columns.flatMap((col) => col.cards || []);
        const targetCard = allCards.find((c) => c.id === targetId);

        if (targetCard) {
          const existingPredIds = (targetCard.predecessor_ids && targetCard.predecessor_ids.length > 0)
            ? targetCard.predecessor_ids
            : (targetCard.predecessor_id ? [targetCard.predecessor_id] : []);

          if (!existingPredIds.includes(sourceId)) {
            const nextPredIds = [...existingPredIds, sourceId];
            try {
              await updateCyberboardCard(targetId, {
                predecessor_ids: nextPredIds,
                predecessor_id: nextPredIds[0] || null,
              });
            } catch (err) {
              console.error("Failed to link dependency:", err);
            }
          }
        }
      }
      latestMousePosRef.current = null;
      setLinkingState(null);
    };

    animFrameId = requestAnimationFrame(updateLinkAndEdgeScroll);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [linkingState !== null]);



  const handleRightScroll = useCallback(() => {
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    if (leftScrollRef.current && gridTimelineRef.current) {
      leftScrollRef.current.scrollTop = gridTimelineRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  }, []);

  const [hoveredAssigneePos, setHoveredAssigneePos] = useState<{ top: number; left: number } | null>(null);

  const handleMouseEnterAssignee = (e: React.MouseEvent, cardId: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.bottom + 6;
    const left = Math.min(window.innerWidth - 270, Math.max(10, rect.left - 100));
    setHoveredAssigneePos({ top, left });
    setHoveredAssigneeCardId(cardId);
  };

  const handleMouseLeaveAssignee = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredAssigneeCardId(null);
    }, 250);
  };

  const toggleParentExpand = (parentId: number) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  // Resolve status category & styling from column.status_type or title fallback (Darker theme-compatible badges)
  const getCardStatusInfo = useCallback(
    (card: CyberboardCard) => {
      const col = columns.find((c) => c.id === card.column_id);
      const isDone = isColumnCompleted(card.column_id);

      if (!isDone && card.activity_end_date) {
        const endDate = new Date(card.activity_end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (endDate < today) {
          return { label: "Overdue", bg: "bg-rose-950/90 text-rose-300 border-rose-600/60 font-bold" };
        }
      }

      if (col?.status_type) {
        switch (col.status_type) {
          case "completed":
            return { label: "Done", bg: "bg-emerald-950/90 text-emerald-300 border-emerald-600/60 font-bold" };
          case "in_progress":
            return { label: "In Progress", bg: "bg-lime-950/90 text-lime-300 border-lime-600/60 font-bold" };
          case "under_review":
            return { label: "Testing", bg: "bg-cyan-950/90 text-cyan-300 border-cyan-600/60 font-bold" };
          case "blocked":
            return { label: "Blocked", bg: "bg-amber-950/90 text-amber-300 border-amber-600/60 font-bold" };
          case "not_started":
            return { label: "To Do", bg: "bg-slate-900/90 text-slate-200 border-slate-700/70 font-bold" };
        }
      }
      const colName = col?.title || "";
      if (colName.toLowerCase().includes("done") || colName.toLowerCase().includes("complete")) {
        return { label: "Done", bg: "bg-emerald-950/90 text-emerald-300 border-emerald-600/60 font-bold" };
      }
      if (colName.toLowerCase().includes("progress") || colName.toLowerCase().includes("review")) {
        return { label: "In Progress", bg: "bg-lime-950/90 text-lime-300 border-lime-600/60 font-bold" };
      }
      return { label: colName || "To Do", bg: "bg-slate-900/90 text-slate-200 border-slate-700/70 font-bold" };
    },
    [columns, isColumnCompleted]
  );

  // Drag-and-Drop Reordering within Gantt View & Swimlanes
  const [draggedCardId, setDraggedCardId] = useState<number | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);
  const [customCardPositions, setCustomCardPositions] = useState<Record<number, number>>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(`gantt_card_positions_${board.id}`) : null;
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveCardPositions = useCallback((updatedPositions: Record<number, number>) => {
    setCustomCardPositions(updatedPositions);
    try {
      localStorage.setItem(`gantt_card_positions_${board.id}`, JSON.stringify(updatedPositions));
    } catch (e) {
      console.error("Failed to save card positions to localStorage:", e);
    }
    const items = Object.entries(updatedPositions).map(([cardId, position]) => ({
      id: Number(cardId),
      position: Number(position),
    }));
    if (items.length > 0) {
      batchReorderCyberboardCards(board.id, items).catch((err) => {
        console.error("Failed to persist card positions to backend:", err);
      });
    }
  }, [board.id]);

  const handleGanttCardDragStart = (e: React.DragEvent, cardId: number) => {
    if (!canEditGantt) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedCardId(cardId);
    e.dataTransfer.setData("text/plain", cardId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleGanttGroupDragOver = (e: React.DragEvent, groupId: string) => {
    if (!canEditGantt) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverGroupId !== groupId) {
      setDragOverGroupId(groupId);
    }
  };

  const handleGanttGroupDragLeave = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (dragOverGroupId === groupId) {
      setDragOverGroupId(null);
    }
  };

  const handleGanttCardDragOver = (e: React.DragEvent, cardId: number) => {
    if (!canEditGantt) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleGanttCardDragLeave = (e: React.DragEvent, cardId: number) => {
    e.preventDefault();
    if (dragOverCardId === cardId) {
      setDragOverCardId(null);
    }
  };

  const handleGanttDropOnCard = async (e: React.DragEvent, targetCard: CyberboardCard, group: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEditGantt) return;
    setDragOverGroupId(null);
    setDragOverCardId(null);

    const cardIdStr = e.dataTransfer.getData("text/plain");
    const activeCardId = cardIdStr ? parseInt(cardIdStr, 10) : draggedCardId;
    setDraggedCardId(null);

    if (!activeCardId || isNaN(activeCardId) || activeCardId === targetCard.id) return;

    // 1. Reorder inside the group
    const currentGroupCards = [...group.cards];
    const sourceIndex = currentGroupCards.findIndex((c) => c.id === activeCardId);
    const targetIndex = currentGroupCards.findIndex((c) => c.id === targetCard.id);

    if (targetIndex !== -1) {
      let activeCard = currentGroupCards[sourceIndex];
      if (!activeCard) {
        activeCard = cards.find((c) => c.id === activeCardId)!;
      }
      if (sourceIndex !== -1) {
        currentGroupCards.splice(sourceIndex, 1);
      }
      currentGroupCards.splice(targetIndex, 0, activeCard);

      // Update position order state & persist to backend & localStorage
      const updatedPositions = { ...customCardPositions };
      currentGroupCards.forEach((c, idx) => {
        if (c) updatedPositions[c.id] = idx;
      });
      saveCardPositions(updatedPositions);
    }

    // 2. Perform cross-group re-assignment if dragged from a different group
    if (groupBy === "phase") {
      if (onUpdateCardPhase && group.title) {
        await onUpdateCardPhase(activeCardId, group.title);
      }
    } else if (groupBy === "column") {
      if (onMoveCardColumn && group.columnId) {
        await onMoveCardColumn(activeCardId, group.columnId);
      }
    } else if (groupBy === "priority") {
      if (onUpdateCardPriority) {
        const rawPrio = group.id.replace("prio-", "");
        if (["high", "medium", "low"].includes(rawPrio)) {
          await onUpdateCardPriority(activeCardId, rawPrio as "high" | "medium" | "low");
        }
      }
    } else if (groupBy === "assignee") {
      if (onUpdateCardAssignees) {
        const rawUserIdStr = group.id.replace("assignee-", "").replace("user-", "");
        const userId = parseInt(rawUserIdStr, 10);
        if (!isNaN(userId)) {
          await onUpdateCardAssignees(activeCardId, [userId]);
        }
      }
    }
  };

  const handleGanttGroupDrop = async (e: React.DragEvent, group: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroupId(null);
    setDragOverCardId(null);

    const cardIdStr = e.dataTransfer.getData("text/plain");
    const targetCardId = cardIdStr ? parseInt(cardIdStr, 10) : draggedCardId;
    setDraggedCardId(null);

    if (!targetCardId || isNaN(targetCardId)) return;

    if (groupBy === "phase") {
      if (onUpdateCardPhase && group.title) {
        await onUpdateCardPhase(targetCardId, group.title);
      }
    } else if (groupBy === "column") {
      if (onMoveCardColumn && group.columnId) {
        await onMoveCardColumn(targetCardId, group.columnId);
      }
    } else if (groupBy === "priority") {
      if (onUpdateCardPriority) {
        const rawPrio = group.id.replace("prio-", "");
        if (["high", "medium", "low"].includes(rawPrio)) {
          await onUpdateCardPriority(targetCardId, rawPrio as "high" | "medium" | "low");
        }
      }
    } else if (groupBy === "assignee") {
      if (onUpdateCardAssignees) {
        const rawUserIdStr = group.id.replace("assignee-", "").replace("user-", "");
        const userId = parseInt(rawUserIdStr, 10);
        if (!isNaN(userId)) {
          await onUpdateCardAssignees(targetCardId, [userId]);
        }
      }
    }
  };

  // Unified effective timeline date range calculation using local calendar dates
  const effectiveRange = useMemo(() => {
    let rangeStart = parseLocalDate(startDateStr, selectedYear, false);
    let rangeEnd = parseLocalDate(endDateStr, selectedYear, true);

    if (timeScale === "month") {
      rangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1, 0, 0, 0, 0);
      const lastDay = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0).getDate();
      rangeEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), lastDay, 23, 59, 59, 999);
    } else if (timeScale === "week") {
      let totalWeeks = 0;
      let curr = new Date(rangeStart);
      while (curr <= rangeEnd) {
        totalWeeks++;
        curr = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 7, 0, 0, 0, 0);
      }
      if (totalWeeks > 0) {
        rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + totalWeeks * 7, 0, 0, 0, 0);
        rangeEnd = new Date(rangeEnd.getTime() - 1);
      }
    } else if (timeScale === "day") {
      let totalDays = 0;
      let curr = new Date(rangeStart);
      while (curr <= rangeEnd) {
        totalDays++;
        curr = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 1, 0, 0, 0, 0);
      }
      if (totalDays > 0) {
        rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + totalDays, 0, 0, 0, 0);
        rangeEnd = new Date(rangeEnd.getTime() - 1);
      }
    }

    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const totalMs = Math.max(1, endMs - startMs);

    return { rangeStart, rangeEnd, startMs, endMs, totalMs };
  }, [startDateStr, endDateStr, selectedYear, timeScale]);

  // Today calculations relative to active effectiveRange
  const today = new Date();

  // Calculate Today position percentage (0 to 100%)
  const todayPercentage = useMemo(() => {
    const nowTime = today.getTime();
    if (nowTime < effectiveRange.startMs || nowTime > effectiveRange.endMs) return null;
    return ((nowTime - effectiveRange.startMs) / effectiveRange.totalMs) * 100;
  }, [effectiveRange, today]);

  const handleJumpToToday = () => {
    const nowTime = today.getTime();
    if (nowTime < effectiveRange.startMs || nowTime > effectiveRange.endMs) {
      if (today.getFullYear() !== selectedYear) {
        skipYearResetRef.current = true;
        setSelectedYear(today.getFullYear());
      }
      setStartDateStr(`${today.getFullYear()}-01-01`);
      setEndDateStr(`${today.getFullYear()}-12-31`);
    }
    setTimeout(() => {
      if (gridTimelineRef.current) {
        const scrollWidth = gridTimelineRef.current.scrollWidth;
        const calcPercent = todayPercentage !== null ? todayPercentage : 50;
        const targetScroll = (scrollWidth * (calcPercent / 100)) - (gridTimelineRef.current.clientWidth / 2);
        gridTimelineRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
      }
    }, 150);
  };

  const handleScaleChange = (mode: TimeScaleMode) => {
    setTimeScale(mode);
    if (mode === "month" && zoomLevel < 125) {
      setZoomLevel(125);
    } else if (mode === "day" && zoomLevel < 75) {
      setZoomLevel(75);
    }
    setTimeout(() => {
      handleJumpToToday();
    }, 150);
  };

  useEffect(() => {
    if (timeScale === "month" && zoomLevel < 125) {
      setZoomLevel(125);
    } else if (timeScale === "day" && zoomLevel < 75) {
      setZoomLevel(75);
    }
  }, [timeScale, zoomLevel]);

  // Auto-center timeline container to Today on mount and year change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleJumpToToday();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedYear]);

  // Dynamically normalize card parent-child trees for real-time Gantt sync
  const normalizedCards = useMemo(() => {
    const rawActive = (cards || []).filter((c) => !c.is_archived);
    const cardMap = new Map<number, CyberboardCard>();

    // 1. Initialize card map with empty sub_cards arrays (resetting stale sub_cards)
    rawActive.forEach((c) => {
      cardMap.set(c.id, { ...c, sub_cards: [] });
    });

    // 2. Populate parent sub_cards arrays dynamically based on parent_id relationships
    rawActive.forEach((c) => {
      if (c.parent_id && cardMap.has(c.parent_id)) {
        const parent = cardMap.get(c.parent_id)!;
        const currentChild = cardMap.get(c.id)!;
        if (!parent.sub_cards!.some((sc) => sc.id === c.id)) {
          parent.sub_cards!.push(currentChild);
        }
      }
    });

    return Array.from(cardMap.values());
  }, [cards]);

  // Group cards according to groupBy option
  const groupedData = useMemo(() => {
    const activeCards = normalizedCards;

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

      const getCardPos = (c: CyberboardCard) => {
        if (customCardPositions[c.id] !== undefined) return customCardPositions[c.id];
        return 99999999;
      };

      const resultGroups = Array.from(phaseMap.values()).filter((g) => g.cards.length > 0 || g.id !== "phase-unphased");
      resultGroups.forEach((g) => {
        g.cards.sort((a, b) => {
          const posA = getCardPos(a);
          const posB = getCardPos(b);
          if (posA !== posB) return posA - posB;
          return a.id - b.id;
        });
      });
      return resultGroups;
    } else if (groupBy === "column") {
      const getCardPos = (c: CyberboardCard) => {
        if (customCardPositions[c.id] !== undefined) return customCardPositions[c.id];
        if (typeof c.position === "number") return c.position;
        return 99999999;
      };

      return columns.map((col, idx) => {
        const colCards = activeCards.filter((c) => c.column_id === col.id);
        colCards.sort((a, b) => {
          const posA = getCardPos(a);
          const posB = getCardPos(b);
          if (posA !== posB) return posA - posB;
          return a.id - b.id;
        });
        return {
          id: `col-${col.id}`,
          columnId: col.id,
          title: col.title,
          color: col.color || PRESET_COLORS[idx % PRESET_COLORS.length],
          cards: colCards,
        };
      });
    } else if (groupBy === "priority") {
      const getCardPos = (c: CyberboardCard) => {
        if (customCardPositions[c.id] !== undefined) return customCardPositions[c.id];
        return 99999999;
      };

      const priorities: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
      const priorityColors = {
        high: "#f43f5e",
        medium: "#f59e0b",
        low: "#10b981",
      };
      return priorities.map((prio) => {
        const prioCards = activeCards.filter((c) => c.priority === prio);
        prioCards.sort((a, b) => {
          const posA = getCardPos(a);
          const posB = getCardPos(b);
          if (posA !== posB) return posA - posB;
          return a.id - b.id;
        });
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
      const getCardPos = (c: CyberboardCard) => {
        if (customCardPositions[c.id] !== undefined) return customCardPositions[c.id];
        return 99999999;
      };

      const assigneeMap = new Map<string, { id: string; columnId?: number; title: string; color: string; cards: CyberboardCard[]; avatar?: string }>();

      assigneeMap.set("unassigned", {
        id: "assignee-unassigned",
        columnId: undefined,
        title: "Unassigned Tasks",
        color: "#64748b",
        cards: [],
      });

      if (board.creator) {
        const key = `user-${board.creator.id}`;
        if (!assigneeMap.has(key)) {
          assigneeMap.set(key, {
            id: `assignee-${board.creator.id}`,
            columnId: undefined,
            title: board.creator.name || "Board Host",
            color: PRESET_COLORS[assigneeMap.size % PRESET_COLORS.length],
            cards: [],
            avatar: board.creator.avatar,
          });
        }
      }

      activeCards.forEach((c) => {
        const assignees = c.assigned_users && c.assigned_users.length > 0
          ? c.assigned_users
          : c.assigned_user
          ? [c.assigned_user]
          : [];

        if (assignees.length > 0) {
          assignees.forEach((u) => {
            const key = `user-${u.id}`;
            if (!assigneeMap.has(key)) {
              assigneeMap.set(key, {
                id: `assignee-${u.id}`,
                columnId: undefined,
                title: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "Member",
                color: PRESET_COLORS[assigneeMap.size % PRESET_COLORS.length],
                cards: [],
                avatar: u.avatar,
              });
            }
            assigneeMap.get(key)?.cards.push(c);
          });
        } else {
          assigneeMap.get("unassigned")?.cards.push(c);
        }
      });

      const rawGroups = Array.from(assigneeMap.values()).filter((g) => g.cards.length > 0 || g.id !== "assignee-unassigned");
      rawGroups.forEach((g) => {
        g.cards.sort((a, b) => {
          const posA = getCardPos(a);
          const posB = getCardPos(b);
          if (posA !== posB) return posA - posB;
          return a.id - b.id;
        });
      });
      return rawGroups;
    }
  }, [groupBy, columns, normalizedCards, board.creator, customCardPositions]);

  const unscheduledCards = useMemo(() => {
    return cards.filter((c) => !c.is_archived && (!c.activity_date && !c.activity_end_date));
  }, [cards]);

  useEffect(() => {
    if (skipYearResetRef.current) {
      skipYearResetRef.current = false;
      return;
    }
    setStartDateStr(`${selectedYear}-01-01`);
    setEndDateStr(`${selectedYear}-12-31`);
  }, [selectedYear]);

  // Compute Timeline Columns based on timeScale and effectiveRange
  const timelineColumns = useMemo(() => {
    const rangeStart = effectiveRange.rangeStart;
    const rangeEnd = effectiveRange.rangeEnd;

    if (timeScale === "month") {
      const cols = [];
      let curr = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      const endLimit = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

      while (curr <= endLimit) {
        const mName = MONTH_NAMES[curr.getMonth()];
        const daysInM = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
        cols.push({
          label: `${mName} ${curr.getFullYear() !== selectedYear ? curr.getFullYear() : ""}`.trim(),
          sublabel: `${mName} 1–${daysInM}`,
        });
        curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
      }
      return cols.length > 0 ? cols : MONTH_NAMES.map((name) => ({ label: name, sublabel: "" }));
    } else if (timeScale === "week") {
      const cols = [];
      let curr = new Date(rangeStart);
      let weekNum = 1;

      while (curr <= rangeEnd) {
        const nextWeek = new Date(curr.getTime() + 6 * 24 * 60 * 60 * 1000);
        const actualEnd = nextWeek > rangeEnd ? rangeEnd : nextWeek;
        const mName = MONTH_NAMES[curr.getMonth()];

        cols.push({
          label: `W${weekNum}`,
          sublabel: `${mName} ${curr.getDate()}–${actualEnd.getDate()}`,
        });

        curr = new Date(curr.getTime() + 7 * 24 * 60 * 60 * 1000);
        weekNum++;
      }
      return cols.length > 0 ? cols : [{ label: "W1", sublabel: "" }];
    } else {
      const cols = [];
      let curr = new Date(rangeStart);
      const dayLetters = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      while (curr <= rangeEnd) {
        const mName = MONTH_NAMES[curr.getMonth()];
        const dNum = curr.getDate();
        const dayName = dayLetters[curr.getDay()];

        cols.push({
          label: `${dNum}`,
          sublabel: `${mName} ${dNum} (${dayName})`,
          fullLabel: `${mName} ${dNum}, ${curr.getFullYear()}`,
        });

        curr = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 1, 0, 0, 0, 0);
      }
      return cols.length > 0 ? cols : [{ label: "1", sublabel: "Day 1" }];
    }
  }, [timeScale, selectedYear, effectiveRange]);

  const minZoomLevel = timeScale === "month" ? 125 : timeScale === "day" ? 75 : 50;

  const gridMinWidth = useMemo(() => {
    let base = 1300;
    if (timeScale === "day") {
      base = Math.max(1300, timelineColumns.length * 55);
    } else if (timeScale === "week") {
      base = Math.max(1100, timelineColumns.length * 200);
    } else {
      base = Math.max(1300, timelineColumns.length * 110);
    }
    return Math.round(base * (zoomLevel / 100));
  }, [timeScale, timelineColumns.length, zoomLevel]);

  const effectiveGridWidth = useMemo(() => {
    return Math.max(gridMinWidth, containerWidth);
  }, [gridMinWidth, containerWidth]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(250, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(minZoomLevel, prev - 25));
  const handleResetZoom = () => setZoomLevel(timeScale === "month" ? 125 : 100);

  // Batch pre-compute card timeline positions once per cards update for 60 FPS performance
  const timelinePositionMap = useMemo(() => {
    const map = new Map<
      number,
      {
        leftPercent: number;
        widthPercent: number;
        rightPercent: number;
        startDateStr: string;
        endDateStr: string;
      }
    >();

    const rangeStartMs = effectiveRange.startMs;
    const totalMs = effectiveRange.totalMs;

    normalizedCards.forEach((card) => {
      let startDate: Date;
      let endDate: Date;

      const custom = customCardDates[card.id];
      const actDate = custom && custom.activity_date !== undefined ? custom.activity_date : card.activity_date;
      const actEndDate = custom && custom.activity_end_date !== undefined ? custom.activity_end_date : card.activity_end_date;

      if (actDate && actEndDate) {
        startDate = parseLocalDate(actDate, selectedYear, false);
        endDate = parseLocalDate(actEndDate, selectedYear, true);
      } else if (actDate) {
        startDate = parseLocalDate(actDate, selectedYear, false);
        endDate = parseLocalDate(actDate, selectedYear, true);
      } else if (actEndDate) {
        startDate = parseLocalDate(actEndDate, selectedYear, false);
        endDate = parseLocalDate(actEndDate, selectedYear, true);
      } else {
        startDate = new Date(card.created_at || Date.now());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const cardStartMs = startDate.getTime();
      const cardEndMs = endDate.getTime();

      const leftPercent = Math.max(0, Math.min(100, ((cardStartMs - rangeStartMs) / totalMs) * 100));
      const rightPercent = Math.max(0, Math.min(100, ((cardEndMs - rangeStartMs) / totalMs) * 100));
      const widthPercent = Math.max(0.6, rightPercent - leftPercent);

      map.set(card.id, {
        leftPercent,
        widthPercent,
        rightPercent,
        startDateStr: startDate.toISOString().split("T")[0],
        endDateStr: endDate.toISOString().split("T")[0],
      });
    });

    return map;
  }, [normalizedCards, effectiveRange, customCardDates]);

  const getCardTimelinePosition = useCallback(
    (card: CyberboardCard) => {
      const cached = timelinePositionMap.get(card.id);
      if (cached) return cached;
      return {
        leftPercent: 0,
        widthPercent: 10,
        startDateStr: `${selectedYear}-01-01`,
        endDateStr: `${selectedYear}-01-02`,
      };
    },
    [timelinePositionMap, selectedYear]
  );

  const hasCardDates = useCallback((c: CyberboardCard) => {
    const custom = customCardDates[c.id];
    const actDate = custom && custom.activity_date !== undefined ? custom.activity_date : c.activity_date;
    const actEndDate = custom && custom.activity_end_date !== undefined ? custom.activity_end_date : c.activity_end_date;
    return !!(actDate || actEndDate);
  }, [customCardDates]);

  const getPhaseTimelinePosition = useCallback(
    (groupCards: CyberboardCard[]) => {
      let minLeft = Infinity;
      let maxRight = -Infinity;
      let hasDatedCards = false;

      const processCard = (c: CyberboardCard) => {
        if (hasCardDates(c)) {
          const pos = timelinePositionMap.get(c.id);
          if (pos) {
            minLeft = Math.min(minLeft, pos.leftPercent);
            const cardRight = pos.rightPercent !== undefined ? pos.rightPercent : (pos.leftPercent + pos.widthPercent);
            maxRight = Math.max(maxRight, cardRight);
            hasDatedCards = true;
          }
        }
      };

      groupCards.forEach((c) => {
        processCard(c);
        if (c.sub_cards && c.sub_cards.length > 0) {
          c.sub_cards.forEach((sc) => {
            processCard(sc);
          });
        }
      });

      if (!hasDatedCards || minLeft === Infinity || maxRight === -Infinity) {
        return null;
      }

      const widthPercent = Math.max(0.6, maxRight - minLeft);
      return { leftPercent: minLeft, widthPercent };
    },
    [timelinePositionMap, hasCardDates]
  );

  const getCardCompletionRate = useCallback((card: CyberboardCard): number => {
    if (isColumnCompleted(card.column_id)) {
      return 100;
    }

    let cl: CyberboardChecklistItem[] = [];
    if (card.checklist) {
      if (typeof card.checklist === "string") {
        try {
          const parsed = JSON.parse(card.checklist);
          if (Array.isArray(parsed)) cl = parsed;
        } catch {
          cl = [];
        }
      } else if (Array.isArray(card.checklist)) {
        cl = card.checklist;
      }
    }

    const hasChecklist = cl.length > 0;
    const hasSubcards = !!(card.sub_cards && card.sub_cards.length > 0);

    let checklistRate = 0;
    if (hasChecklist) {
      const completedCount = cl.filter((item) => item.completed).length;
      checklistRate = (completedCount / cl.length) * 100;
    }

    let subcardsRate = 0;
    if (hasSubcards) {
      const completedSubcardsCount = card.sub_cards!.filter((sc) => isColumnCompleted(sc.column_id)).length;
      subcardsRate = (completedSubcardsCount / card.sub_cards!.length) * 100;
    }

    if (hasChecklist && hasSubcards) {
      return Math.round(checklistRate * 0.5 + subcardsRate * 0.5);
    }
    if (hasChecklist) {
      return Math.round(checklistRate);
    }
    if (hasSubcards) {
      return Math.round(subcardsRate);
    }

    return card.completion_percentage ?? 0;
  }, [isColumnCompleted]);

  const formatDateRangeTooltip = (startStr?: string, endStr?: string) => {
    if (!startStr) return "No date set";
    try {
      const d1 = new Date(startStr);
      const d2 = endStr ? new Date(endStr) : d1;
      const m1 = MONTH_NAMES[d1.getMonth()];
      const m2 = MONTH_NAMES[d2.getMonth()];
      if (startStr === endStr || !endStr) {
        return `${m1} ${d1.getDate()}, ${d1.getFullYear()}`;
      }
      return `${m1} ${d1.getDate()} – ${m2} ${d2.getDate()}, ${d2.getFullYear()}`;
    } catch {
      return `${startStr} – ${endStr}`;
    }
  };

  // Interactive Bar Edge Resizing & Bar Body Shifting (Start Date, End Date, and Shift Whole Date Range)
  const [resizingState, setResizingState] = useState<{
    cardId: number;
    mode: "start" | "end" | "move";
    startX: number;
    origStartDate: string;
    origEndDate: string;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    card: CyberboardCard,
    mode: "start" | "end" | "move"
  ) => {
    if (!canEditGantt) return;
    if (timeScale !== "day" && timeScale !== "week") return;
    e.stopPropagation();
    hasDraggedRef.current = false;

    const sDate = card.activity_date ? card.activity_date.split("T")[0] : new Date().toISOString().split("T")[0];
    const eDate = card.activity_end_date ? card.activity_end_date.split("T")[0] : sDate;

    setResizingState({
      cardId: card.id,
      mode,
      startX: e.clientX,
      origStartDate: sDate,
      origEndDate: eDate,
    });
  };

  useEffect(() => {
    if (!resizingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const dx = e.clientX - resizingState.startX;
      if (Math.abs(dx) > 3) {
        hasDraggedRef.current = true;
      }

      const sDate = new Date(startDateStr || `${selectedYear}-01-01`);
      const eDate = new Date(endDateStr || `${selectedYear}-12-31`);
      const rangeStartMs = isNaN(sDate.getTime())
        ? new Date(selectedYear, 0, 1).getTime()
        : new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()).getTime();
      const rangeEndMs = isNaN(eDate.getTime())
        ? new Date(selectedYear, 11, 31).getTime()
        : new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate()).getTime();
      const totalMs = Math.max(1, rangeEndMs - rangeStartMs);

      const msPerPx = totalMs / gridMinWidth;
      const msDelta = dx * msPerPx;
      const daysDelta = Math.round(msDelta / (24 * 60 * 60 * 1000));

      const origStart = new Date(resizingState.origStartDate);
      const origEnd = new Date(resizingState.origEndDate);

      let newStartStr = resizingState.origStartDate;
      let newEndStr = resizingState.origEndDate;

      if (resizingState.mode === "start") {
        const newStart = new Date(origStart.getTime() + daysDelta * 24 * 60 * 60 * 1000);
        if (newStart <= origEnd) {
          newStartStr = newStart.toISOString().split("T")[0];
        }
      } else if (resizingState.mode === "end") {
        const newEnd = new Date(origEnd.getTime() + daysDelta * 24 * 60 * 60 * 1000);
        if (newEnd >= origStart) {
          newEndStr = newEnd.toISOString().split("T")[0];
        }
      } else if (resizingState.mode === "move") {
        const newStart = new Date(origStart.getTime() + daysDelta * 24 * 60 * 60 * 1000);
        const newEnd = new Date(origEnd.getTime() + daysDelta * 24 * 60 * 60 * 1000);
        newStartStr = newStart.toISOString().split("T")[0];
        newEndStr = newEnd.toISOString().split("T")[0];
      }

      setCustomCardDates((prev) => ({
        ...prev,
        [resizingState.cardId]: { activity_date: newStartStr, activity_end_date: newEndStr },
      }));
    };

    const handleMouseUp = () => {
      if (resizingState && hasDraggedRef.current && customCardDates[resizingState.cardId]) {
        const updated = customCardDates[resizingState.cardId];
        if (onUpdateCardDate && updated.activity_date && updated.activity_end_date) {
          onUpdateCardDate(resizingState.cardId, updated.activity_date, updated.activity_end_date);
        }
      }
      setResizingState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingState, gridMinWidth, startDateStr, endDateStr, selectedYear, customCardDates, onUpdateCardDate]);

  const pxToDateStr = useCallback((px: number, totalWidth: number) => {
    const sDate = parseLocalDate(startDateStr, selectedYear, false);
    const eDate = parseLocalDate(endDateStr, selectedYear, true);
    const rangeStartMs = sDate.getTime();
    const rangeEndMs = eDate.getTime();
    const totalMs = Math.max(1, rangeEndMs - rangeStartMs);
    const pct = Math.max(0, Math.min(1, px / Math.max(1, totalWidth)));
    const dateMs = rangeStartMs + pct * totalMs;
    const d = new Date(dateMs);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [startDateStr, endDateStr, selectedYear]);

  useEffect(() => {
    if (!dragCreateState || !dragCreateState.isDragging || !dragCreateState.rowElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragCreateState.rowElement) return;
      const rect = dragCreateState.rowElement.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      setDragCreateState((prev) => (prev ? { ...prev, currentX } : null));
    };

    const handleMouseUp = () => {
      if (dragCreateState && dragCreateState.rowElement) {
        const rowWidth = dragCreateState.rowElement.getBoundingClientRect().width;
        const dist = Math.abs(dragCreateState.currentX - dragCreateState.startX);
        if (dist > 15) {
          // Dragged date range: Fill both start & end dates
          const minX = Math.min(dragCreateState.startX, dragCreateState.currentX);
          const maxX = Math.max(dragCreateState.startX, dragCreateState.currentX);
          const sDateStr = pxToDateStr(minX, rowWidth);
          const eDateStr = pxToDateStr(maxX, rowWidth);

          setQuickTypePromptData({
            isOpen: true,
            phase: dragCreateState.groupPhase,
            startDate: sDateStr,
            endDate: eDateStr,
          });
        } else {
          // Single click: Fill START date ONLY
          const sDateStr = pxToDateStr(dragCreateState.startX, rowWidth);

          setQuickTypePromptData({
            isOpen: true,
            phase: dragCreateState.groupPhase,
            startDate: sDateStr,
            endDate: "",
          });
        }
      }
      setDragCreateState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragCreateState, pxToDateStr]);

  const handleRowGridMouseDown = (e: React.MouseEvent, groupPhase: string, rowId: string) => {
    if (e.button !== 0 || !canEditGantt) return;
    if ((e.target as HTMLElement).closest('[data-gantt-card-id]')) return;
    const rowElement = e.currentTarget as HTMLElement;
    const rect = rowElement.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    setDragCreateState({
      isDragging: true,
      groupPhase,
      rowId,
      startX,
      currentX: startX,
      rowElement,
    });
  };

  const handleBarClick = (e: React.MouseEvent, card: CyberboardCard) => {
    e.stopPropagation();
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onSelectCard(card);
  };

  const canDragDates = timeScale === "day" || timeScale === "week";

  const handleLinkDragStart = (e: React.MouseEvent, cardId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!gridTimelineRef.current) return;

    const layout = layoutMap.get(cardId);
    const rowsEl = gridTimelineRef.current.querySelector(".flex-1.relative.z-10") || gridTimelineRef.current;
    const rowsRect = rowsEl.getBoundingClientRect();
    const currentX = e.clientX - rowsRect.left;
    const currentY = e.clientY - rowsRect.top;

    const startX = layout ? layout.endPx : currentX;
    const startY = layout ? layout.centerYPx : currentY;

    setLinkingState({
      fromCardId: cardId,
      startX,
      startY,
      currentX,
      currentY,
      targetCardId: null,
    });
  };

  const layoutMap = useMemo(() => {
    const layoutMap = new Map<number, { startPx: number; endPx: number; centerYPx: number; rowHeight: number }>();
    const rawLinks: Array<{
      id: string;
      fromCardId: number;
      toCardId: number;
      isDateless?: boolean;
    }> = [];

    let currentY = 0; // top offset inside timeline rows container
    const availableWidth = Math.max(1, effectiveGridWidth - 16);

    groupedData.forEach((group) => {
      const isPhaseCollapsed = !!collapsedPhases[group.id];
      const headerCenterY = currentY + 22; // Group header is 44px height

      const phasePos = getPhaseTimelinePosition(group.cards);
      const phaseStartPx = phasePos ? 8 + (availableWidth * phasePos.leftPercent) / 100 : 16;
      const phaseWidthPx = phasePos ? Math.max(28, (availableWidth * phasePos.widthPercent) / 100) : 160;
      const phaseEndPx = phaseStartPx + phaseWidthPx;

      currentY += 44; // group header height 44px

      if (isPhaseCollapsed) {
        // Map all cards in this collapsed group to the Phase Overview Bar header row!
        group.cards.forEach((card) => {
          layoutMap.set(card.id, {
            startPx: phaseStartPx,
            endPx: phaseEndPx,
            centerYPx: headerCenterY,
            rowHeight: 44,
          });
          if (card.sub_cards) {
            card.sub_cards.forEach((sc) => {
              layoutMap.set(sc.id, {
                startPx: phaseStartPx,
                endPx: phaseEndPx,
                centerYPx: headerCenterY,
                rowHeight: 44,
              });
            });
          }
        });
      } else {
        const parentCards = group.cards.filter((c) => !c.parent_id);

        if (parentCards.length === 0) {
          currentY += 44; // empty group placeholder row height 44px
        } else {
          parentCards.forEach((card) => {
            const isDateless = !card.activity_date && !card.activity_end_date;
            const rowHeight = 44;
            const centerY = currentY + rowHeight / 2;
            const pos = getCardTimelinePosition(card);
            const startPx = isDateless ? 16 : 8 + (availableWidth * pos.leftPercent) / 100;
            const widthPx = isDateless ? 160 : Math.max(28, (availableWidth * pos.widthPercent) / 100);
            const endPx = startPx + widthPx;

            layoutMap.set(card.id, {
              startPx,
              endPx,
              centerYPx: centerY,
              rowHeight,
            });

            currentY += rowHeight;

            // Subcards
            const isExpanded = !!expandedParents[card.id];
            if (isExpanded && card.sub_cards) {
              card.sub_cards.forEach((subCard) => {
                const isSubDateless = !subCard.activity_date && !subCard.activity_end_date;
                const subRowHeight = 38;
                const subCenterY = currentY + subRowHeight / 2;
                const subPos = getCardTimelinePosition(subCard);
                const subStartPx = isSubDateless ? 32 : 8 + (availableWidth * subPos.leftPercent) / 100;
                const subWidthPx = isSubDateless ? 140 : Math.max(20, (availableWidth * subPos.widthPercent) / 100);
                const subEndPx = subStartPx + subWidthPx;

                layoutMap.set(subCard.id, {
                  startPx: subStartPx,
                  endPx: subEndPx,
                  centerYPx: subCenterY,
                  rowHeight: subRowHeight,
                });

                currentY += subRowHeight;
              });
            }
          });
        }

        if (canEditGantt && !isExporting) {
          currentY += 38; // account for + Add Task in Phase inline row
        }
      }
    });

    // Collect explicit predecessor & subtask links
    groupedData.forEach((group) => {
      const parentCards = group.cards.filter((c) => !c.parent_id);

      parentCards.forEach((card) => {
        // 1. Explicit predecessor dependency
        const predIds = (card.predecessor_ids && card.predecessor_ids.length > 0)
          ? card.predecessor_ids
          : (card.predecessor_id ? [card.predecessor_id] : []);

        predIds.forEach((predecessorId) => {
          if (predecessorId && layoutMap.has(predecessorId) && layoutMap.has(card.id)) {
            rawLinks.push({
              id: `dep-${predecessorId}-${card.id}`,
              fromCardId: predecessorId,
              toCardId: card.id,
              isDateless: !card.activity_date && !card.activity_end_date,
            });
          }
        });

        // 2. Subtask explicit predecessor links
        const isExpanded = !!expandedParents[card.id];
        if (isExpanded && card.sub_cards && card.sub_cards.length > 0) {
          card.sub_cards.forEach((subCard) => {
            const subPredIds = (subCard.predecessor_ids && subCard.predecessor_ids.length > 0)
              ? subCard.predecessor_ids
              : (subCard.predecessor_id ? [subCard.predecessor_id] : []);

            subPredIds.forEach((sourceId) => {
              if (sourceId && layoutMap.has(sourceId) && layoutMap.has(subCard.id)) {
                rawLinks.push({
                  id: `dep-${sourceId}-${subCard.id}`,
                  fromCardId: sourceId,
                  toCardId: subCard.id,
                  isDateless: !subCard.activity_date && !subCard.activity_end_date,
                });
              }
            });
          });
        }
      });
    });

    // Group links by source card so multiple outgoing links share origin line & diverge gradually
    const linksBySource = new Map<number, typeof rawLinks>();
    rawLinks.forEach((link) => {
      if (!linksBySource.has(link.fromCardId)) {
        linksBySource.set(link.fromCardId, []);
      }
      linksBySource.get(link.fromCardId)!.push(link);
    });

    const lines: Array<{
      id: string;
      fromCardId: number;
      toCardId: number;
      pathD: string;
      toX: number;
      toY: number;
      X_trunk: number;
      isDateless?: boolean;
    }> = [];

    linksBySource.forEach((links, fromCardId) => {
      const fromPos = layoutMap.get(fromCardId)!;
      const x1 = fromPos.endPx;
      const y1 = fromPos.centerYPx;

      // Sort target cards vertically
      const sortedLinks = [...links].sort((a, b) => {
        const toA = layoutMap.get(a.toCardId)!;
        const toB = layoutMap.get(b.toCardId)!;
        return toA.centerYPx - toB.centerYPx;
      });

      sortedLinks.forEach((link) => {
        const toPos = layoutMap.get(link.toCardId)!;
        const x2 = toPos.startPx;
        const y2 = toPos.centerYPx;
        const targetX = x2 - 6;

        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        // Find all intermediate card bars in layoutMap spanning vertically between y1 and y2
        const intermediateLayouts: Array<{ startPx: number; endPx: number }> = [];
        layoutMap.forEach((layout) => {
          if (layout.centerYPx > minY + 2 && layout.centerYPx < maxY - 2) {
            intermediateLayouts.push(layout);
          }
        });

        // Check if candidate right trunk (x1 + 14) collides with any intermediate bar
        const candidateRightTrunk = x1 + 14;
        const isRightTrunkBlocked = intermediateLayouts.some(
          (layout) => candidateRightTrunk >= layout.startPx - 6 && candidateRightTrunk <= layout.endPx + 6
        );

        let pathD = "";
        let X_trunk = candidateRightTrunk;

        const maxIntermediateEndPx = intermediateLayouts.reduce((max, l) => Math.max(max, l.endPx), 0);
        const canUseRightCorridor = targetX >= maxIntermediateEndPx + 12 && maxIntermediateEndPx > 0;

        if (x2 >= x1 + 20 && !isRightTrunkBlocked) {
          // 1. Unblocked Direct Forward Right Trunk
          X_trunk = Math.max(x1 + 12, Math.min(x1 + 20, targetX - 8));
          const r = Math.min(6, Math.abs(X_trunk - x1) / 2, Math.abs(y2 - y1) / 2, Math.abs(targetX - X_trunk) / 2);
          const dirY = y2 >= y1 ? 1 : -1;

          if (r < 1.5 || Math.abs(y2 - y1) < 4) {
            pathD = `M ${x1} ${y1} H ${X_trunk} V ${y2} H ${targetX}`;
          } else {
            pathD = `M ${x1} ${y1}` +
                    ` H ${X_trunk - r}` +
                    ` Q ${X_trunk} ${y1}, ${X_trunk} ${y1 + r * dirY}` +
                    ` V ${y2 - r * dirY}` +
                    ` Q ${X_trunk} ${y2}, ${X_trunk + r} ${y2}` +
                    ` H ${targetX}`;
          }
        } else if (canUseRightCorridor) {
          // 2. Obstacle-Avoidance Right Bypass Corridor (Bypasses intermediate bars to the right)
          X_trunk = Math.max(x1 + 14, maxIntermediateEndPx + 12);
          const r = Math.min(6, Math.abs(X_trunk - x1) / 2, Math.abs(y2 - y1) / 2, Math.abs(targetX - X_trunk) / 2);
          const dirY = y2 >= y1 ? 1 : -1;

          if (r < 1.5 || Math.abs(y2 - y1) < 4) {
            pathD = `M ${x1} ${y1} H ${X_trunk} V ${y2} H ${targetX}`;
          } else {
            pathD = `M ${x1} ${y1}` +
                    ` H ${X_trunk - r}` +
                    ` Q ${X_trunk} ${y1}, ${X_trunk} ${y1 + r * dirY}` +
                    ` V ${y2 - r * dirY}` +
                    ` Q ${X_trunk} ${y2}, ${X_trunk + r} ${y2}` +
                    ` H ${targetX}`;
          }
        } else {
          // 3. Obstacle-Avoidance Left Bypass Corridor (Bypasses intermediate bars to the left)
          const minIntermediateStartPx = intermediateLayouts.reduce((min, l) => Math.min(min, l.startPx), x2);
          X_trunk = Math.max(8, Math.min(minIntermediateStartPx - 14, x2 - 12));

          const rowHalfHeight = fromPos.rowHeight / 2;
          const y_channel = y2 >= y1 ? y1 + rowHalfHeight + 4 : y1 - rowHalfHeight - 4;
          const dirY1 = y_channel >= y1 ? 1 : -1;
          const dirY2 = y2 >= y_channel ? 1 : -1;

          const maxR = 6;
          const r = Math.min(
            maxR,
            Math.abs(x1 + 12 - x1) / 2,
            Math.abs(y_channel - y1) / 2,
            Math.abs(x1 + 12 - X_trunk) / 2,
            Math.abs(y2 - y_channel) / 2,
            Math.abs(targetX - X_trunk) / 2
          );

          if (r < 1.5) {
            pathD = `M ${x1} ${y1} H ${x1 + 12} V ${y_channel} H ${X_trunk} V ${y2} H ${targetX}`;
          } else {
            pathD = `M ${x1} ${y1}` +
                    ` H ${x1 + 12 - r}` +
                    ` Q ${x1 + 12} ${y1}, ${x1 + 12} ${y1 + r * dirY1}` +
                    ` V ${y_channel - r * dirY1}` +
                    ` Q ${x1 + 12} ${y_channel}, ${x1 + 12 - r} ${y_channel}` +
                    ` H ${X_trunk + r}` +
                    ` Q ${X_trunk} ${y_channel}, ${X_trunk} ${y_channel + r * dirY2}` +
                    ` V ${y2 - r * dirY2}` +
                    ` Q ${X_trunk} ${y2}, ${X_trunk + r} ${y2}` +
                    ` H ${targetX}`;
          }
        }

        lines.push({
          id: link.id,
          fromCardId: link.fromCardId,
          toCardId: link.toCardId,
          pathD,
          toX: x2,
          toY: y2,
          X_trunk,
          isDateless: link.isDateless,
        });
      });
    });

    return layoutMap;
  }, [groupedData, effectiveGridWidth, expandedParents, collapsedPhases, getCardTimelinePosition, getPhaseTimelinePosition, canEditGantt, isExporting]);

  // Helper to extract assigned users array cleanly
  const getCardUsers = (cardItem: CyberboardCard) => {
    return cardItem.assigned_users && cardItem.assigned_users.length > 0
      ? cardItem.assigned_users
      : cardItem.assigned_user
      ? [cardItem.assigned_user]
      : [];
  };

  // Renderer for Left Tree Rows (Crisp Avatars + Unblocked Fixed Hover Popover Card)
  const renderTreeAssigneeAvatars = (cardItem: CyberboardCard) => {
    if (isExporting || groupBy === "assignee") return null;

    const users = getCardUsers(cardItem);
    if (users.length === 0) return null;

    return (
      <div
        className="relative flex items-center flex-shrink-0 cursor-pointer"
        onMouseEnter={(e) => handleMouseEnterAssignee(e, cardItem.id)}
        onMouseLeave={handleMouseLeaveAssignee}
      >
        {users.length === 1 ? (
          <img
            src={users[0].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(users[0].first_name)}&background=06b6d4&color=fff`}
            alt={users[0].first_name}
            className="w-5.5 h-5.5 rounded-full object-cover flex-shrink-0 border border-border/80 shadow-xs"
          />
        ) : (
          <div className="flex items-center -space-x-1.5 overflow-visible">
            {users.slice(0, 2).map((u) => (
              <img
                key={`tree-avatar-${cardItem.id}-${u.id}`}
                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                alt={u.first_name}
                className="w-5.5 h-5.5 rounded-full object-cover border border-surface-900 ring-1 ring-border shadow-xs"
              />
            ))}
            {users.length > 2 && (
              <span className="text-[9px] font-extrabold text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded-full shadow-xs">
                +{users.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Adaptive Renderer for Timeline Bars (Static Badges ONLY - Popover Disabled on Bars)
  const renderTimelineAssigneeAvatars = (cardItem: CyberboardCard, widthPercent: number) => {
    if (isExporting || groupBy === "assignee") return null;

    const users = getCardUsers(cardItem);
    if (users.length === 0) return null;

    const isNarrow = widthPercent < 12;

    return (
      <div className="flex items-center flex-shrink-0 ml-1.5" title={`Assigned to ${users.map((u) => u.first_name).join(", ")}`}>
        {isNarrow || users.length > 3 ? (
          <div className="flex items-center gap-1 bg-surface-800/90 border border-border/80 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-text-primary shadow-xs transition-colors">
            <Users className="w-3 h-3 text-primary flex-shrink-0" />
            <span>{users.length}</span>
          </div>
        ) : users.length === 1 ? (
          <img
            src={users[0].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(users[0].first_name)}&background=06b6d4&color=fff`}
            alt={users[0].first_name}
            className="w-4.5 h-4.5 rounded-full object-cover flex-shrink-0 border border-border/80 shadow-xs"
          />
        ) : (
          <div className="flex items-center -space-x-1.5 overflow-visible">
            {users.slice(0, 2).map((u) => (
              <img
                key={`bar-avatar-${cardItem.id}-${u.id}`}
                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                alt={u.first_name}
                className="w-4.5 h-4.5 rounded-full object-cover border border-surface-900 ring-1 ring-border shadow-xs"
              />
            ))}
            {users.length > 2 && (
              <span className="text-[9px] font-extrabold text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded-full shadow-xs">
                +{users.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full bg-surface-950 text-text-primary overflow-hidden">
      {/* 1. Responsive Header Toolbar */}
      <GanttToolbar
        onAddTask={() => setQuickTypePromptData({ isOpen: true })}
        canEditGantt={canEditGantt}
        showCriticalPath={showCriticalPath}
        setShowCriticalPath={setShowCriticalPath}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        timeScale={timeScale}
        handleScaleChange={handleScaleChange}
        zoomLevel={zoomLevel}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleResetZoom={handleResetZoom}
        startDateStr={startDateStr}
        setStartDateStr={setStartDateStr}
        endDateStr={endDateStr}
        setEndDateStr={setEndDateStr}
        handleFitToTaskDates={handleFitToTaskDates}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        handleJumpToToday={handleJumpToToday}
        showExportDropdown={showExportDropdown}
        setShowExportDropdown={setShowExportDropdown}
        isExporting={isExporting}
        handleExportGanttPng={handleExportGanttPng}
        handleExportGanttPdf={handleExportGanttPdf}
        handleExportExcelClick={handleExportExcelClick}
        unscheduledCardsCount={unscheduledCards.length}
        showUnscheduledDrawer={showUnscheduledDrawer}
        setShowUnscheduledDrawer={setShowUnscheduledDrawer}
        setShowGanttControlsSidebar={setShowGanttControlsSidebar}
      />

      {/* 2. Main Gantt Layout */}
      <div ref={ganttWorkspaceRef} className="flex flex-1 min-h-0 overflow-hidden relative bg-surface-950">
        {/* Left Column: Group & Task Hierarchy Titles + Dedicated STATUS Column */}
        <div className={`flex-shrink-0 bg-surface-900/90 border-r border-border/80 flex flex-col z-10 shadow-lg transition-all duration-300 ease-in-out ${isTaskListCollapsed ? "w-12 sm:w-14 overflow-hidden" : "w-72 sm:w-[400px]"}`}>
          <div className="h-12 box-border flex-shrink-0 border-b border-border/80 px-2 sm:px-3 flex items-center justify-between bg-surface-900/95 font-bold text-xs text-text-secondary uppercase tracking-wider">
            {isTaskListCollapsed ? (
              <button
                type="button"
                onClick={() => setIsTaskListCollapsed(false)}
                className="w-full flex items-center justify-center p-1 text-cyan-400 hover:text-white transition-colors cursor-pointer"
                title="Expand Task List Column"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            ) : (
              <>
                <span className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <Layers className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">{groupBy === "phase" ? "Tasks & Phases" : groupBy === "column" ? "Tasks & Stages" : groupBy === "priority" ? "Tasks & Priority" : "Tasks & Assignees"}</span>
                </span>
                <div className="w-28 flex-shrink-0 text-center font-bold text-[10px] text-text-muted uppercase tracking-widest border-l border-border/40 pl-2">
                  Status
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaskListCollapsed(true)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors ml-1 cursor-pointer"
                  title="Minimize Task List Column"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Rows List (Left Panel - Completely Hidden Scrollbar with Wheel Forwarding) */}
          <div
            ref={leftScrollRef}
            onWheel={(e) => {
              if (gridTimelineRef.current) {
                gridTimelineRef.current.scrollTop += e.deltaY;
              }
            }}
            className="flex-1 overflow-hidden select-none"
          >
            {groupedData.map((group) => {
              const parentCards = group.cards.filter((c) => !c.parent_id);
              const isGroupDragOver = dragOverGroupId === group.id;

              return (
                <div
                  key={group.id}
                  onDragOver={(e) => handleGanttGroupDragOver(e, group.id)}
                  onDragLeave={(e) => handleGanttGroupDragLeave(e, group.id)}
                  onDrop={(e) => handleGanttGroupDrop(e, group)}
                  className={`transition-colors duration-150 ${
                    isGroupDragOver ? "bg-primary/15 border-l-4 border-primary" : "bg-surface-900/40"
                  }`}
                >
                  {/* Group Title Bar */}
                  <div className="h-[44px] box-border px-3 flex items-center justify-between gap-2 bg-surface-900/80 border-b border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhaseCollapse(group.id);
                        }}
                        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors cursor-pointer"
                        title={collapsedPhases[group.id] ? "Expand Phase" : "Collapse Phase"}
                      >
                        {collapsedPhases[group.id] ? (
                          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                        )}
                      </button>
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
                  {!collapsedPhases[group.id] && (
                    <div className="flex flex-col">
                    {parentCards.length === 0 ? (
                      <div className="h-[44px] box-border px-4 flex items-center gap-2 text-xs font-semibold text-text-muted/70 bg-transparent border-b border-border/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40 flex-shrink-0" />
                        <span>No tasks in group</span>
                      </div>
                    ) : (
                      parentCards.map((card) => {
                        const hasSubCards = card.sub_cards && card.sub_cards.length > 0;
                        const isExpanded = !!expandedParents[card.id];
                        const statusInfo = getCardStatusInfo(card);

                        const isCardDragOver = dragOverCardId === card.id;

                        return (
                          <React.Fragment key={`row-left-${card.id}`}>
                            {/* Parent Card Row */}
                            <div
                              draggable
                              onDragStart={(e) => handleGanttCardDragStart(e, card.id)}
                              onDragOver={(e) => handleGanttCardDragOver(e, card.id)}
                              onDragLeave={(e) => handleGanttCardDragLeave(e, card.id)}
                              onDrop={(e) => handleGanttDropOnCard(e, card, group)}
                              className={`h-[44px] box-border px-3 flex items-center justify-between gap-2 transition-all border-b border-border/20 cursor-grab active:cursor-grabbing group/leftrow ${
                                isCardDragOver ? "bg-primary/20 border-t-2 border-primary ring-1 ring-primary/40" : "hover:bg-surface-800/40"
                              }`}
                            >
                              <div className="flex-1 items-center gap-2 min-w-0 flex">
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
                                  title={card.title}
                                >
                                  {card.title}
                                </span>
                                {!card.activity_date && !card.activity_end_date && (
                                  <span className="px-1.5 py-0.5 rounded bg-surface-800 border border-border/80 text-text-secondary text-[9px] font-bold flex items-center gap-1 flex-shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-primary" /> Dateless
                                  </span>
                                )}

                                {renderTreeAssigneeAvatars(card)}
                              </div>

                              {/* Dedicated STATUS Column Cell */}
                              <div className="w-28 flex-shrink-0 flex items-center justify-center border-l border-border/20 pl-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide shadow-2xs ${statusInfo.bg}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>

                            {/* Sub-cards Indented Rows */}
                            {isExpanded &&
                              card.sub_cards?.map((subCard) => {
                                const subStatusInfo = getCardStatusInfo(subCard);
                                return (
                                  <div
                                    key={`row-left-sub-${subCard.id}`}
                                    className="h-[38px] box-border pl-7 pr-3 flex items-center justify-between gap-2 bg-surface-950/40 hover:bg-surface-800/30 transition-colors border-l-2 border-primary/30 border-b border-border/20"
                                  >
                                    <div className="flex-1 items-center gap-2 min-w-0 flex">
                                      <span
                                        onClick={() => onSelectCard(subCard)}
                                        className="text-[11px] font-medium text-text-secondary hover:text-primary cursor-pointer truncate"
                                        title={subCard.title}
                                      >
                                        ↳ {subCard.title}
                                      </span>
                                      {!subCard.activity_date && !subCard.activity_end_date && (
                                        <span className="px-1.5 py-0.5 rounded bg-surface-800 border border-border/80 text-text-secondary text-[9px] font-bold flex items-center gap-1 flex-shrink-0">
                                          <Clock className="w-2.5 h-2.5 text-primary" /> Dateless
                                        </span>
                                      )}
                                      {renderTreeAssigneeAvatars(subCard)}
                                    </div>

                                    {/* Dedicated STATUS Column Cell for Subtask */}
                                    <div className="w-28 flex-shrink-0 flex items-center justify-center border-l border-border/20 pl-2">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wide ${subStatusInfo.bg}`}>
                                        {subStatusInfo.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </React.Fragment>
                        );
                      })
                    )}
                    {canEditGantt && !isExporting && (
                      <div
                        onClick={() => setQuickTypePromptData({ isOpen: true, phase: group.title })}
                        className="h-[38px] box-border px-3.5 flex items-center gap-2 bg-surface-950/20 hover:bg-surface-800/40 text-primary hover:text-primary-light border-b border-border/20 border-l-2 border-primary/40 cursor-pointer transition-colors group select-none"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="text-xs font-bold truncate">Add Task to {group.title}...</span>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
            {/* Horizontal scrollbar height spacer to maintain 100% vertical row alignment with right timeline */}
            {!isExporting && <div className="h-4 flex-shrink-0 border-t border-border/20 bg-surface-900/40" />}
          </div>
        </div>

        {/* Right Panel: Timeline Grid & Bars */}
        <div
          ref={gridTimelineRef}
          onScroll={handleRightScroll}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative scrollbar-thin bg-surface-950"
        >
          <div style={{ minWidth: `${gridMinWidth}px` }} className="flex-1 flex flex-col relative transition-all duration-200">
            {/* Timeline Column Headers Bar */}
            <GanttTimelineHeader
              timelineColumns={timelineColumns}
              todayPercentage={todayPercentage}
            />

            {/* Background Grid Columns */}
            <div className="absolute inset-0 top-12 flex pointer-events-none z-0">
              {timelineColumns.map((_, idx) => (
                <div key={`grid-${idx}`} className="flex-1 border-r border-border/20 h-full" />
              ))}

              {/* Vertical TODAY Line */}
              {todayPercentage !== null && !isExporting && (
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
            <div className="flex-1 relative z-10">
              {groupedData.map((group) => {
                const parentCards = group.cards.filter((c) => !c.parent_id);
                const isGroupDragOver = dragOverGroupId === group.id;

                return (
                  <div
                    key={`gantt-grid-group-${group.id}`}
                    onDragOver={(e) => handleGanttGroupDragOver(e, group.id)}
                    onDragLeave={(e) => handleGanttGroupDragLeave(e, group.id)}
                    onDrop={(e) => handleGanttGroupDrop(e, group)}
                    className={`transition-colors duration-150 ${
                      isGroupDragOver ? "bg-primary/10" : "bg-transparent"
                    }`}
                  >
                    {/* Group Header Row with Phase Overview Bar */}
                    {(() => {
                      const totalTasks = group.cards.length;
                      const phasePos = getPhaseTimelinePosition(group.cards);
                      if (totalTasks === 0 || !phasePos) {
                        return (
                          <div className="h-[44px] box-border border-b border-border/40 bg-surface-900/30 relative flex items-center select-none overflow-hidden px-4">
                            {totalTasks === 0 && <span className="text-xs font-semibold text-text-muted/70 italic">No tasks in phase</span>}
                          </div>
                        );
                      }

                      const completedTasks = group.cards.filter((c) => (c.completion_percentage || 0) === 100).length;
                      const avgCompletion = Math.round(group.cards.reduce((acc, c) => acc + (c.completion_percentage || 0), 0) / totalTasks);

                      return (
                        <div
                          className="h-[44px] box-border border-b border-border/40 bg-surface-900/30 relative flex items-center select-none overflow-hidden"
                          onClick={() => togglePhaseCollapse(group.id)}
                        >
                          {/* Phase Overview Summary Bar */}
                          <div
                            className="absolute h-6 rounded-lg flex items-center justify-between px-2.5 shadow-md border border-white/20 z-20 group/phasebar cursor-pointer transition-all duration-200 hover:scale-[1.005]"
                            style={{
                              left: `${phasePos.leftPercent}%`,
                              width: `${phasePos.widthPercent}%`,
                              minWidth: "28px",
                              backgroundColor: group.color || "#06b6d4",
                              backgroundImage: `linear-gradient(135deg, ${group.color || "#06b6d4"} 0%, ${group.color || "#06b6d4"}dd 100%)`,
                            }}
                            title={`${group.title} Overview (${totalTasks} Tasks, ${avgCompletion}% Complete - Click to toggle expand/collapse)`}
                          >
                            {/* Left Bracket End Cap */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/60 rounded-l-lg" />

                            {/* Summary Fill Track */}
                            {avgCompletion > 0 && (
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-white/25 rounded-l-lg transition-all duration-300 pointer-events-none"
                                style={{ width: `${avgCompletion}%` }}
                              />
                            )}

                            {/* Phase Summary Label */}
                            <span className="sticky left-2 z-10 text-[11px] font-extrabold text-white truncate drop-shadow-xs flex items-center gap-1.5 pointer-events-none">
                              <span>{group.title} Overview</span>
                              <span className="opacity-90 font-mono text-[10px]">({completedTasks}/{totalTasks} done • {avgCompletion}%)</span>
                            </span>

                            {/* Right Bracket End Cap */}
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/60 rounded-r-lg" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Timeline Bars for Cards & Sub-Cards */}
                    {!collapsedPhases[group.id] && (
                      <div className="flex flex-col relative">
                      {parentCards.length === 0 ? (
                        <div
                          onMouseDown={(e) => handleRowGridMouseDown(e, group.title, `no-task-${group.id}`)}
                          className="h-[44px] box-border border-b border-dashed border-border/30 flex items-center px-4 relative cursor-crosshair hover:bg-primary/10 transition-all group/addrow select-none"
                          title={`Click or drag across timeline to add a task in ${group.title}`}
                        >
                          {dragCreateState && dragCreateState.isDragging && dragCreateState.rowId === `no-task-${group.id}` && (
                            <div
                              className="absolute h-8 top-1.5 rounded-xl bg-primary/30 border-2 border-primary border-dashed z-50 pointer-events-none shadow-lg shadow-primary/20 flex items-center justify-center text-xs font-extrabold text-primary backdrop-blur-xs animate-pulse"
                              style={{
                                left: `${Math.min(dragCreateState.startX, dragCreateState.currentX)}px`,
                                width: `${Math.max(28, Math.abs(dragCreateState.currentX - dragCreateState.startX))}px`,
                              }}
                            >
                              <span className="truncate px-2">+ Create Task in {group.title}</span>
                            </div>
                          )}
                          <span className="sticky left-4 z-10 text-xs font-extrabold text-primary/80 group-hover/addrow:text-primary px-3 py-1 rounded-xl bg-surface-900/90 border border-primary/30 shadow-xs flex items-center gap-2 pointer-events-none group-hover/addrow:scale-105 transition-all">
                            <Plus className="w-3.5 h-3.5 text-primary" />
                            <span>No tasks in group — Click or drag to create</span>
                          </span>
                        </div>
                      ) : (
                        parentCards.map((card) => {
                          const pos = getCardTimelinePosition(card);
                          const cardColor = card.color_tag || group.color || "#06b6d4";
                          const isHovered = hoveredCardId === card.id;
                          const isExpanded = !!expandedParents[card.id];

                          return (
                            <React.Fragment key={`gantt-row-parent-${card.id}`}>
                              {/* Parent Bar Row */}
                              <div
                                onDragOver={(e) => handleGanttCardDragOver(e, card.id)}
                                onDragLeave={(e) => handleGanttCardDragLeave(e, card.id)}
                                onDrop={(e) => handleGanttDropOnCard(e, card, group)}
                                className={`h-[44px] box-border px-2 flex items-center relative transition-colors border-b border-border/20 ${
                                  dragOverCardId === card.id ? "bg-primary/15 border-t-2 border-primary" : "hover:bg-surface-900/10"
                                }`}
                              >
                                {!card.activity_date && !card.activity_end_date ? (
                                  <div
                                    draggable
                                    onDragStart={(e) => handleGanttCardDragStart(e, card.id)}
                                    onClick={() => onSelectCard(card)}
                                    className="sticky left-4 z-10 cursor-grab active:cursor-grabbing flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800/95 border border-border/90 text-text-primary text-xs font-semibold shadow-md hover:border-primary/60 hover:bg-surface-800 transition-all group"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-primary animate-pulse flex-shrink-0" />
                                    <span className="font-bold truncate max-w-[220px]">{card.title}</span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-surface-700 text-text-secondary text-[9px] font-bold uppercase tracking-wider border border-border/60">
                                      No dates set
                                    </span>
                                    {renderTimelineAssigneeAvatars(card, 20)}
                                  </div>
                                ) : (
                                  (() => {
                                    const isMilestone =
                                      card.activity_date &&
                                      card.activity_end_date &&
                                      card.activity_date === card.activity_end_date;
                                    const rate = getCardCompletionRate(card);

                                    if (isMilestone) {
                                      return (
                                        <div
                                          data-gantt-card-id={card.id}
                                          className="absolute h-8 top-1.5 flex items-center group/bar cursor-pointer select-none"
                                          style={{
                                            left: `${pos.leftPercent}%`,
                                            width: "36px",
                                          }}
                                          onMouseEnter={() => setHoveredCardId(card.id)}
                                          onMouseLeave={() => setHoveredCardId(null)}
                                        >
                                          {/* Left Target Connection Handle */}
                                          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-surface-950 shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />

                                          {/* Diamond Marker */}
                                          <div
                                            onClick={(e) => handleBarClick(e, card)}
                                            className="w-5 h-5 rotate-45 bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-surface-950 shadow-lg hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                                            title={`Milestone: ${card.title}`}
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-surface-950" />
                                          </div>

                                          {/* External Right Label */}
                                          {!isExporting && (
                                            <div className="flex items-center gap-1.5 pl-3 whitespace-nowrap z-10 pointer-events-auto">
                                              {renderTimelineAssigneeAvatars(card, 100)}
                                              <span
                                                onClick={(e) => handleBarClick(e, card)}
                                                className="text-xs font-bold text-text-primary hover:text-primary cursor-pointer whitespace-nowrap"
                                              >
                                                {card.title}
                                              </span>
                                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider">
                                                ◆ Milestone
                                              </span>
                                            </div>
                                          )}

                                          {/* Right Source Connection Handle */}
                                          {canEditGantt && (
                                            <div
                                              draggable={false}
                                              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onMouseDown={(e) => handleLinkDragStart(e, card.id)}
                                              className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-surface-950 shadow-md cursor-crosshair z-40 hover:scale-125 transition-all flex items-center justify-center ${
                                                linkingState ? "opacity-100 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "opacity-0 group-hover/bar:opacity-100"
                                              }`}
                                              title="Click & drag to link dependency"
                                            >
                                              <div className="w-1.5 h-1.5 rounded-full bg-surface-950" />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        data-gantt-card-id={card.id}
                                        draggable={!resizingState && !linkingState}
                                        onDragStart={(e) => {
                                          if (resizingState) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return;
                                          }
                                          handleGanttCardDragStart(e, card.id);
                                        }}
                                        className={`absolute h-8 top-1.5 flex items-center group/bar cursor-grab active:cursor-grabbing select-none ${
                                          linkingState?.targetCardId === card.id ? "ring-2 ring-cyan-400 animate-pulse scale-[1.02] z-30" : ""
                                        }`}
                                        style={{
                                          left: `${pos.leftPercent}%`,
                                          width: `${pos.widthPercent}%`,
                                          minWidth: "28px",
                                        }}
                                        onMouseEnter={() => setHoveredCardId(card.id)}
                                        onMouseLeave={() => setHoveredCardId(null)}
                                      >
                                        {/* Live Date Range Floating Tooltip */}
                                        {(isHovered || resizingState?.cardId === card.id) && (
                                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 px-2.5 py-0.5 rounded-lg bg-surface-950/95 border border-primary/60 text-primary text-[10px] font-bold shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md animate-in fade-in duration-150">
                                            <Calendar className="w-3 h-3 text-cyan-400" />
                                            <span>{formatDateRangeTooltip(pos.startDateStr, pos.endDateStr)}</span>
                                          </div>
                                        )}

                                        {/* Left Target Connection Handle */}
                                        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-surface-950 opacity-0 group-hover/bar:opacity-100 transition-opacity z-30" />

                                        {/* Left Date Handle */}
                                        {canDragDates && (timeScale === "day" || timeScale === "week") && (
                                          <div
                                            draggable={false}
                                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onMouseDown={(e) => handleResizeStart(e, card, "start")}
                                            className="absolute left-0 top-0 bottom-0 w-3 z-30 cursor-ew-resize hover:bg-white/50 rounded-l-xl flex items-center justify-center text-[10px] font-black text-white/90 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black/40 shadow-xs"
                                            title="Drag left/right to adjust start date"
                                          >
                                            ‹
                                          </div>
                                        )}

                                        {(() => {
                                           const isCritical = showCriticalPath && criticalPathCardIds.has(card.id);
                                           return (
                                             <div
                                               onMouseDown={(e) => {
                                                 hasDraggedRef.current = false;
                                                 handleResizeStart(e, card, "move");
                                               }}
                                               onClick={(e) => handleBarClick(e, card)}
                                               className={`w-full h-full rounded-xl flex items-center shadow-md cursor-pointer transition-all duration-200 border border-white/20 select-none overflow-hidden relative ${
                                                 isHovered ? "ring-2 ring-white/60 scale-[1.01] shadow-lg z-20" : ""
                                               } ${
                                                 isCritical ? "ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] z-30" : ""
                                               }`}
                                               style={{
                                                 backgroundColor: cardColor,
                                                 backgroundImage: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
                                               }}
                                             >
                                               {/* Inner Progress Bar Fill Shading Track */}
                                               {rate > 0 && (
                                                 <div
                                                   className="absolute left-0 top-0 bottom-0 bg-white/35 border-r border-white/50 pointer-events-none transition-all duration-300 rounded-l-xl z-0"
                                                   style={{ width: `${rate}%` }}
                                                 />
                                               )}
                                             </div>
                                           );
                                         })()}

                                        {/* External Label (Right of Task Bar) */}
                                        {!isExporting && (
                                          <div className="absolute left-full top-0 bottom-0 flex items-center gap-1.5 pl-2.5 whitespace-nowrap z-20 pointer-events-auto">
                                            {renderTimelineAssigneeAvatars(card, 100)}
                                            {card.phase && (
                                              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                                                {card.phase}
                                              </span>
                                            )}
                                            <span
                                              onClick={(e) => handleBarClick(e, card)}
                                              className="text-xs font-bold text-text-primary hover:text-primary cursor-pointer"
                                            >
                                              {card.title}
                                            </span>
                                            {showCriticalPath && criticalPathCardIds.has(card.id) && (
                                              <span className="px-1.5 py-0.5 rounded-md bg-rose-950/90 text-rose-300 border border-rose-500/60 text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                                                <AlertTriangle className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                                                Critical Task
                                              </span>
                                            )}
                                            {rate > 0 && (
                                              <span className="text-[10px] font-extrabold text-cyan-400 bg-surface-900/90 border border-border px-1.5 py-0.2 rounded-full shadow-2xs">
                                                {rate}%
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Right Date Handle */}
                                        {canDragDates && (timeScale === "day" || timeScale === "week") && (
                                          <div
                                            draggable={false}
                                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onMouseDown={(e) => handleResizeStart(e, card, "end")}
                                            className="absolute right-0 top-0 bottom-0 w-3 z-30 cursor-ew-resize hover:bg-white/50 rounded-r-xl flex items-center justify-center text-[10px] font-black text-white/90 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black/40 shadow-xs"
                                            title="Drag left/right to adjust end date"
                                          >
                                            ›
                                          </div>
                                        )}

                                        {/* Right Source Connection Handle Dot */}
                                        {canEditGantt && (
                                          <div
                                            draggable={false}
                                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onMouseDown={(e) => handleLinkDragStart(e, card.id)}
                                            className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-surface-950 shadow-md cursor-crosshair z-40 hover:scale-125 transition-all flex items-center justify-center ${
                                              linkingState ? "opacity-100 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "opacity-0 group-hover/bar:opacity-100"
                                            }`}
                                            title="Click & drag to link predecessor dependency"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-surface-950" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>

                              {/* Sub-Card Timeline Bars */}
                              {isExpanded &&
                                card.sub_cards?.map((subCard) => {
                                const subPos = getCardTimelinePosition(subCard);
                                const subColor = subCard.color_tag || cardColor;
                                const isSubHovered = hoveredCardId === subCard.id;
                                const isSubDateless = !subCard.activity_date && !subCard.activity_end_date;

                                return (
                                  <div
                                    key={`gantt-row-sub-${subCard.id}`}
                                    className="h-[38px] box-border px-2 flex items-center relative bg-surface-950/20 hover:bg-surface-900/10 transition-colors border-b border-border/20"
                                  >
                                    {isSubDateless ? (
                                      <div
                                        onClick={() => onSelectCard(subCard)}
                                        className="sticky left-8 z-10 cursor-pointer flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-800/95 border border-border/90 text-text-secondary text-[11px] font-medium shadow-xs hover:border-primary/60 hover:bg-surface-800 transition-all"
                                      >
                                        <Clock className="w-3 h-3 text-primary animate-pulse flex-shrink-0" />
                                        <span className="font-bold truncate max-w-[180px]">↳ {subCard.title}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-surface-700 text-text-muted text-[8px] font-bold uppercase tracking-wider border border-border/60">
                                          No dates set
                                        </span>
                                        {renderTimelineAssigneeAvatars(subCard, 20)}
                                      </div>
                                    ) : (
                                        <div
                                          data-gantt-card-id={subCard.id}
                                          className={`absolute h-6 top-1.5 flex items-center group/bar select-none ${
                                            linkingState?.targetCardId === subCard.id ? "ring-2 ring-cyan-400 animate-pulse scale-[1.02] z-30" : ""
                                          }`}
                                          style={{
                                            left: `${subPos.leftPercent}%`,
                                            width: `${subPos.widthPercent}%`,
                                            minWidth: "20px",
                                          }}
                                          onMouseEnter={() => setHoveredCardId(subCard.id)}
                                          onMouseLeave={() => setHoveredCardId(null)}
                                        >
                                          {/* Live Date Range Floating Tooltip for Subcard */}
                                          {(isSubHovered || resizingState?.cardId === subCard.id) && (
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 px-2 py-0.5 rounded-lg bg-surface-950/95 border border-primary/60 text-primary text-[10px] font-bold shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1 backdrop-blur-md animate-in fade-in duration-150">
                                              <Calendar className="w-2.5 h-2.5 text-cyan-400" />
                                              <span>{formatDateRangeTooltip(subPos.startDateStr, subPos.endDateStr)}</span>
                                            </div>
                                          )}

                                          {/* Subcard Left Handle */}
                                          {(timeScale === "day" || timeScale === "week") && (
                                            <div
                                              draggable={false}
                                              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onMouseDown={(e) => handleResizeStart(e, subCard, "start")}
                                              className="absolute left-0 top-0 bottom-0 w-2.5 z-30 cursor-ew-resize hover:bg-white/50 rounded-l-lg flex items-center justify-center text-[9px] font-black text-white/90 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black/40 shadow-xs"
                                              title="Drag to adjust start date"
                                            >
                                              ‹
                                            </div>
                                          )}

                                          {(() => {
                                             const isSubCritical = showCriticalPath && criticalPathCardIds.has(subCard.id);
                                             return (
                                               <div
                                                 onMouseDown={(e) => handleResizeStart(e, subCard, "move")}
                                                 onClick={(e) => handleBarClick(e, subCard)}
                                                 className={`w-full h-full rounded-lg px-2.5 flex items-center justify-between text-[11px] font-medium text-white shadow-sm cursor-pointer transition-all duration-200 border border-white/20 select-none overflow-hidden relative ${
                                                   isSubHovered ? "ring-2 ring-white/60 scale-[1.01] z-20" : ""
                                                 } ${
                                                   isSubCritical ? "ring-2 ring-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-30" : ""
                                                 }`}
                                                 style={{
                                                   backgroundColor: subColor,
                                                   backgroundImage: `linear-gradient(135deg, ${subColor} 0%, ${subColor}dd 100%)`,
                                                 }}
                                               >
                                                 {(() => {
                                                   const subRate = getCardCompletionRate(subCard);
                                                   return (
                                                     <>
                                                       {subRate > 0 && (
                                                         <div
                                                           className="absolute left-0 top-0 bottom-0 bg-white/30 border-r border-white/40 pointer-events-none transition-all duration-300 rounded-l-lg z-0"
                                                           style={{ width: `${subRate}%` }}
                                                         />
                                                       )}
                                                       <div className="flex items-center gap-1.5 truncate z-10">
                                                         <span className="truncate drop-shadow-xs text-[10px]">↳ {subCard.title}</span>
                                                         {subRate > 0 && (
                                                           <span className="px-1.5 py-0.2 rounded-full bg-black/40 border border-white/30 text-[8px] font-extrabold text-white shadow-xs backdrop-blur-xs flex-shrink-0">
                                                             {subRate}%
                                                           </span>
                                                         )}
                                                         {isSubCritical && (
                                                           <span className="px-1 py-0.2 rounded bg-rose-950/90 border border-rose-500/60 text-[8px] font-black text-rose-300 uppercase tracking-wider flex items-center gap-0.5">
                                                             <AlertTriangle className="w-2 h-2 text-rose-400 animate-pulse" />
                                                             CPM
                                                           </span>
                                                         )}
                                                       </div>
                                                       <div className="z-10">
                                                         {renderTimelineAssigneeAvatars(subCard, subPos.widthPercent)}
                                                       </div>
                                                     </>
                                                   );
                                                 })()}
                                               </div>
                                             );
                                           })()}

                                          {/* Subcard Right Handle */}
                                          {(timeScale === "day" || timeScale === "week") && (
                                            <div
                                              draggable={false}
                                              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                              onMouseDown={(e) => handleResizeStart(e, subCard, "end")}
                                              className="absolute right-0 top-0 bottom-0 w-2.5 z-30 cursor-ew-resize hover:bg-white/50 rounded-r-lg flex items-center justify-center text-[9px] font-black text-white/90 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black/40 shadow-xs"
                                              title="Drag to adjust end date"
                                            >
                                              ›
                                            </div>
                                          )}

                                           {/* Subcard Interactive Dependency Connector Handle Dot */}
                                            {canEditGantt && (
                                              <div
                                                draggable={false}
                                                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                onMouseDown={(e) => handleLinkDragStart(e, subCard.id)}
                                                className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-surface-950 shadow-md cursor-crosshair z-40 hover:scale-125 transition-all flex items-center justify-center ${
                                                  linkingState ? "opacity-100 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "opacity-0 group-hover/bar:opacity-100"
                                                }`}
                                                title="Click & drag to link predecessor dependency"
                                              >
                                                <div className="w-1 h-1 rounded-full bg-surface-950" />
                                              </div>
                                            )}
                                        </div>
                                    )}
                                  </div>
                                );
                              })}
                              </React.Fragment>
                            );
                        })
                      )}
                      {canEditGantt && !isExporting && (
                        <div
                          onMouseDown={(e) => handleRowGridMouseDown(e, group.title, `empty-${group.id}`)}
                          className="h-[38px] box-border border-b border-dashed border-transparent hover:border-primary/40 flex items-center px-4 relative cursor-crosshair hover:bg-primary/10 transition-all group/addrow select-none"
                          title={`Click or drag across timeline to add a task in ${group.title}`}
                        >
                          {dragCreateState && dragCreateState.isDragging && dragCreateState.rowId === `empty-${group.id}` && (
                            <div
                              className="absolute h-7 top-1 rounded-xl bg-primary/30 border-2 border-primary border-dashed z-50 pointer-events-none shadow-lg shadow-primary/20 flex items-center justify-center text-xs font-extrabold text-primary backdrop-blur-xs animate-pulse"
                              style={{
                                left: `${Math.min(dragCreateState.startX, dragCreateState.currentX)}px`,
                                width: `${Math.max(28, Math.abs(dragCreateState.currentX - dragCreateState.startX))}px`,
                              }}
                            >
                              <span className="truncate px-2">+ Create Task in {group.title}</span>
                            </div>
                          )}
                          <span className="sticky left-4 z-10 text-xs font-extrabold text-primary/75 group-hover/addrow:text-primary group-hover/addrow:scale-105 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-primary/10 group-hover/addrow:bg-primary/25 border border-primary/25 group-hover/addrow:border-primary/60 transition-all pointer-events-none shadow-xs">
                            <Plus className="w-3.5 h-3.5 text-primary" />
                            <span>Add Task to {group.title}</span>
                          </span>
                          <span className="sticky left-64 opacity-0 group-hover/addrow:opacity-100 text-[10px] font-mono font-bold text-primary bg-surface-900/90 px-2 py-0.5 rounded-lg border border-primary/30 transition-opacity pointer-events-none ml-4 hidden sm:inline-flex items-center gap-1 shadow-xs">
                            <span>+ Click or Drag to set dates</span>
                          </span>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                );
              })}

              {/* SVG Task Dependency Connector Lines Overlay */}
              <GanttDependencyCanvas
                cards={cards}
                cardRowHeights={layoutMap}
                timelinePositions={timelinePositionMap}
                containerWidth={effectiveGridWidth}
                hoveredLineId={hoveredLineId}
                setHoveredLineId={setHoveredLineId}
                hoveredCardId={hoveredCardId}
                canEditGantt={canEditGantt}
                onRemoveDependency={handleRemoveDependency}
                showCriticalPath={showCriticalPath}
                criticalPathCardIds={criticalPathCardIds}
                isExporting={isExporting}
                linkingState={linkingState}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Slide-Over Gantt Controls Sidebar Drawer */}
      <>
        {/* Click-Outside Backdrop Overlay */}
        <div
          onClick={() => setShowGanttControlsSidebar(false)}
          className={`fixed inset-0 z-[9990] bg-black/40 transition-opacity duration-300 ease-out ${
            showGanttControlsSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Sidebar Panel */}
        <div
          className={`fixed top-0 right-0 bottom-0 z-[9995] w-full sm:w-96 bg-surface-900 shadow-2xl border-l border-border/80 flex flex-col transition-all duration-300 ease-in-out will-change-transform ${
            showGanttControlsSidebar
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="h-16 px-5 border-b border-border/80 flex items-center justify-between bg-surface-900/90 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary">Gantt View Controls</h2>
                <p className="text-[11px] text-text-muted">Grouping, Scale & Date Filters</p>
              </div>
            </div>

            <button
              onClick={() => setShowGanttControlsSidebar(false)}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
              aria-label="Close Gantt controls sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
            {/* Grouping */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Group Tasks By:</label>
              <div className="grid grid-cols-2 gap-2">
                {(["phase", "column", "priority", "assignee"] as const).map((mode) => (
                  <button
                    key={`gantt-sidebar-group-${mode}`}
                    onClick={() => setGroupBy(mode)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      groupBy === mode
                        ? "bg-primary text-surface-950 border-primary font-bold shadow-xs"
                        : "bg-surface-800/80 text-text-secondary border-border/60 hover:text-text-primary"
                    }`}
                  >
                    {mode === "phase" ? "Phases" : mode === "column" ? "Columns" : mode === "priority" ? "Priority" : "Assignee"}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Scale */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Time Scale Granularity:</label>
              <div className="grid grid-cols-3 gap-2">
                {(["month", "week", "day"] as const).map((mode) => (
                  <button
                    key={`gantt-sidebar-scale-${mode}`}
                    onClick={() => handleScaleChange(mode)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${
                      timeScale === mode
                        ? "bg-primary text-surface-950 border-primary font-bold shadow-xs"
                        : "bg-surface-800/80 text-text-secondary border-border/60 hover:text-text-primary"
                    }`}
                  >
                    {mode}s
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Gantt Zoom Level:</label>
              <div className="flex items-center justify-between bg-surface-800/90 p-2.5 rounded-xl border border-border/60">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span
                  onClick={handleResetZoom}
                  className="text-xs font-bold text-text-primary font-mono cursor-pointer hover:text-primary transition-colors"
                >
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 250}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Date Range Filter:</label>
                <button
                  onClick={handleFitToTaskDates}
                  className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Limit timeline range to earliest start date & latest end date of tasks"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Fit Tasks</span>
                </button>
              </div>
              <div className="flex flex-col gap-2 bg-surface-800/90 p-3 rounded-xl border border-border/60">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-muted font-semibold uppercase">Start Date:</span>
                  <input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="bg-surface-900 border border-border/80 text-text-primary px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-muted font-semibold uppercase">End Date:</span>
                  <input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="bg-surface-900 border border-border/80 text-text-primary px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Export Actions Section */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Export Options:</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleExportGanttPng}
                  disabled={isExporting}
                  className="w-full px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Export Chart as PNG</span>
                </button>
                <button
                  onClick={handleExportGanttPdf}
                  disabled={isExporting}
                  className="w-full px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Export Chart as PDF</span>
                </button>
                <button
                  onClick={handleExportExcelClick}
                  disabled={isExporting}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export Board to Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Bottom Close Sidebar Action Button */}
            <div className="pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowGanttControlsSidebar(false)}
                className="w-full py-3 px-4 rounded-xl border border-border/80 text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <X className="w-4 h-4 text-text-muted" />
                <span>Close Gantt Controls</span>
              </button>
            </div>
          </div>
        </div>
      </>

      {/* Unblocked Fixed Hover Popover for Assigned Members */}
      {hoveredAssigneeCardId && hoveredAssigneePos && (() => {
        const targetCard = cards.find((c) => c.id === hoveredAssigneeCardId);
        if (!targetCard) return null;
        const users = getCardUsers(targetCard);
        if (users.length === 0) return null;

        return (
          <div
            style={{ top: `${hoveredAssigneePos.top}px`, left: `${hoveredAssigneePos.left}px` }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={handleMouseLeaveAssignee}
            className="fixed w-64 bg-surface-900/98 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-[100] p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2 flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Assigned Members ({users.length})
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {users.map((u) => (
                <div key={`fixed-tree-popover-${targetCard.id}-${u.id}`} className="flex items-center gap-2.5 text-xs p-1 rounded-lg hover:bg-surface-800/60 transition-colors">
                  <img
                    src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                    alt={u.first_name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-border shadow-xs"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-text-primary text-xs truncate leading-snug">
                      {u.first_name} {u.last_name}
                    </span>
                    <span className="text-[10px] text-text-muted truncate">
                      @{u.username || u.first_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Fullscreen Export Loading Overlay */}
      {isExporting && (
        <div className="export-ignore fixed inset-0 bg-surface-950/85 backdrop-blur-md z-[10000] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-150">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-lg animate-bounce">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <h4 className="text-sm font-bold text-text-primary">Generating Gantt Chart Export...</h4>
            <p className="text-xs text-text-muted">Preparing high-resolution chart. Please wait a moment.</p>
          </div>
        </div>
      )}

      {/* Quick Creation Item Type Selection Prompt Modal */}
      {quickTypePromptData && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface-900 border border-border rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary uppercase tracking-wider">
                <Plus className="w-4 h-4 text-primary" />
                <span>Select Item Type to Add</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickTypePromptData(null)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickTypePromptData.phase && (
              <div className="px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs font-semibold text-text-secondary flex items-center justify-between">
                <span className="text-text-muted">Target Phase / Sprint:</span>
                <strong className="text-primary font-bold">{quickTypePromptData.phase}</strong>
              </div>
            )}

            {quickTypePromptData.startDate && (
              <div className="px-3 py-2 rounded-xl bg-surface-800/70 border border-border/60 text-[11px] font-semibold text-text-muted flex items-center justify-between">
                <span>Date Schedule:</span>
                <span className="font-mono text-text-primary font-bold">
                  {quickTypePromptData.startDate} {quickTypePromptData.endDate ? `→ ${quickTypePromptData.endDate}` : "(Single Day)"}
                </span>
              </div>
            )}

            {/* 3 Item Type Selection Options */}
            <div className="space-y-3">
              {/* Option 1: Standard Task */}
              <button
                type="button"
                onClick={() => {
                  setGanttQuickCreateData({
                    type: "task",
                    phase: quickTypePromptData.phase || "",
                    startDate: quickTypePromptData.startDate || "",
                    endDate: quickTypePromptData.endDate || "",
                  });
                  setQuickTypePromptData(null);
                }}
                className="w-full p-4 rounded-2xl bg-surface-800 hover:bg-surface-750 border border-border hover:border-primary/60 transition-all flex items-start gap-3.5 text-left group cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>Standard Task / Deliverable</span>
                    <span className="text-[10px] text-primary font-bold">Standard →</span>
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    Regular task initiative with start date, deadline, and assigned members.
                  </p>
                </div>
              </button>

              {/* Option 2: Milestone Checkpoint */}
              <button
                type="button"
                onClick={() => {
                  setGanttQuickCreateData({
                    type: "milestone",
                    phase: quickTypePromptData.phase || "",
                    startDate: quickTypePromptData.startDate || new Date().toISOString().split("T")[0],
                    endDate: "",
                  });
                  setQuickTypePromptData(null);
                }}
                className="w-full p-4 rounded-2xl bg-surface-800 hover:bg-surface-750 border border-border hover:border-primary/60 transition-all flex items-start gap-3.5 text-left group cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                  <span className="text-lg font-black">◆</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>Milestone Checkpoint</span>
                    <span className="text-[10px] text-primary font-bold">1-Day Gate →</span>
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    Single-day milestone checkpoint marker for release gates or major approvals.
                  </p>
                </div>
              </button>

              {/* Option 3: Sub-Task */}
              <button
                type="button"
                onClick={() => {
                  setGanttQuickCreateData({
                    type: "subtask",
                    phase: quickTypePromptData.phase || "",
                    startDate: quickTypePromptData.startDate || "",
                    endDate: quickTypePromptData.endDate || "",
                  });
                  setQuickTypePromptData(null);
                }}
                className="w-full p-4 rounded-2xl bg-surface-800 hover:bg-surface-750 border border-border hover:border-primary/60 transition-all flex items-start gap-3.5 text-left group cursor-pointer shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>Sub-Task</span>
                    <span className="text-[10px] text-primary font-bold">Child Item →</span>
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    Child sub-task linked under a parent task item.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gantt Quick Create Modal (lightweight type-specific form) */}
      {ganttQuickCreateData && onQuickCreateCard && (
        <GanttQuickCreateModal
          type={ganttQuickCreateData.type}
          phase={ganttQuickCreateData.phase}
          startDate={ganttQuickCreateData.startDate}
          endDate={ganttQuickCreateData.endDate}
          columns={columns}
          allCards={cards}
          onClose={() => setGanttQuickCreateData(null)}
          onSubmit={onQuickCreateCard}
        />
      )}
    </div>
  );
}
