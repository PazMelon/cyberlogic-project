import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Layers,
  Clock,
  Plus,
  SlidersHorizontal,
  Users,
  ZoomIn,
  ZoomOut,
  X,
  Lock,
} from "lucide-react";
import type { CyberboardBoard, CyberboardColumn, CyberboardCard, CyberboardChecklistItem } from "../../utils/api";
import { updateCyberboardCard, batchReorderCyberboardCards } from "../../utils/api";

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
  onAddNewCard?: (columnId?: number) => void;
  onUpdateCardPhase?: (cardId: number, phase: string) => Promise<void>;
  onMoveCardColumn?: (cardId: number, targetColumnId: number) => Promise<void>;
  onUpdateCardPriority?: (cardId: number, priority: "high" | "medium" | "low") => Promise<void>;
  onUpdateCardAssignees?: (cardId: number, userIds: number[]) => Promise<void>;
}

type GroupByOption = "phase" | "column" | "priority" | "assignee";
type TimeScaleMode = "month" | "week" | "day";

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
  const [timeScale, setTimeScale] = useState<TimeScaleMode>("week");
  const [groupBy, setGroupBy] = useState<GroupByOption>("phase");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(false);
  const [showGanttControlsSidebar, setShowGanttControlsSidebar] = useState<boolean>(false);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [hoveredAssigneeCardId, setHoveredAssigneeCardId] = useState<number | null>(null);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
  const [customCardDates, setCustomCardDates] = useState<Record<number, { activity_date?: string | null; activity_end_date?: string | null }>>({});

  const handleRemoveDependency = async (targetCardId: number, fromCardId: number) => {
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

  // Drag-to-Link global mousemove and mouseup listeners
  useEffect(() => {
    if (!linkingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridTimelineRef.current) return;
      const containerRect = gridTimelineRef.current.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left + gridTimelineRef.current.scrollLeft;
      const currentY = e.clientY - containerRect.top + gridTimelineRef.current.scrollTop;

      let hoveredTargetId: number | null = null;
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elements) {
        const cardIdAttr = el.getAttribute("data-gantt-card-id");
        if (cardIdAttr) {
          const id = Number(cardIdAttr);
          if (id && id !== linkingState.fromCardId) {
            hoveredTargetId = id;
            break;
          }
        }
      }

      setLinkingState((prev) =>
        prev ? { ...prev, currentX, currentY, targetCardId: hoveredTargetId } : null
      );
    };

    const handleMouseUp = async () => {
      if (linkingState && linkingState.targetCardId) {
        const targetId = linkingState.targetCardId;
        const sourceId = linkingState.fromCardId;
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
      setLinkingState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [linkingState]);



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
    }
    setTimeout(() => {
      handleJumpToToday();
    }, 150);
  };

  useEffect(() => {
    if (timeScale === "month" && zoomLevel < 125) {
      setZoomLevel(125);
    }
  }, [timeScale, zoomLevel]);

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

      const resultGroups = Array.from(phaseMap.values()).filter((g) => g.cards.length > 0 || g.id !== "phase-unphased");
      resultGroups.forEach((g) => {
        g.cards.sort((a, b) => {
          const posA = customCardPositions[a.id] ?? a.position ?? 0;
          const posB = customCardPositions[b.id] ?? b.position ?? 0;
          return posA - posB;
        });
      });
      return resultGroups;
    } else if (groupBy === "column") {
      return columns.map((col, idx) => {
        const colCards = activeCards.filter((c) => c.column_id === col.id);
        colCards.sort((a, b) => {
          const posA = customCardPositions[a.id] ?? a.position ?? 0;
          const posB = customCardPositions[b.id] ?? b.position ?? 0;
          return posA - posB;
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
      const priorities: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
      const priorityColors = {
        high: "#f43f5e",
        medium: "#f59e0b",
        low: "#10b981",
      };
      return priorities.map((prio) => {
        const prioCards = activeCards.filter((c) => c.priority === prio);
        prioCards.sort((a, b) => {
          const posA = customCardPositions[a.id] ?? a.position ?? 0;
          const posB = customCardPositions[b.id] ?? b.position ?? 0;
          return posA - posB;
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
          const posA = customCardPositions[a.id] ?? a.position ?? 0;
          const posB = customCardPositions[b.id] ?? b.position ?? 0;
          return posA - posB;
        });
      });
      return rawGroups;
    }
  }, [groupBy, columns, normalizedCards, board.creator, customCardPositions]);

  const unscheduledCards = useMemo(() => {
    return cards.filter((c) => !c.is_archived && (!c.activity_date && !c.activity_end_date));
  }, [cards]);

  useEffect(() => {
    setStartDateStr(`${selectedYear}-01-01`);
    setEndDateStr(`${selectedYear}-12-31`);
  }, [selectedYear]);

  // Compute Timeline Columns based on timeScale and date range
  const timelineColumns = useMemo(() => {
    const sDate = new Date(startDateStr || `${selectedYear}-01-01`);
    const eDate = new Date(endDateStr || `${selectedYear}-12-31`);

    const rangeStart = isNaN(sDate.getTime()) ? new Date(selectedYear, 0, 1) : sDate;
    const rangeEnd = isNaN(eDate.getTime()) ? new Date(selectedYear, 11, 31) : eDate;

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

        curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000);
      }
      return cols.length > 0 ? cols : [{ label: "1", sublabel: "Day 1" }];
    }
  }, [timeScale, selectedYear, startDateStr, endDateStr]);

  const minZoomLevel = timeScale === "month" ? 125 : 50;

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
        startDateStr: string;
        endDateStr: string;
      }
    >();

    const sDate = new Date(startDateStr || `${selectedYear}-01-01`);
    const eDate = new Date(endDateStr || `${selectedYear}-12-31`);

    const rangeStartMs = isNaN(sDate.getTime())
      ? new Date(selectedYear, 0, 1, 0, 0, 0).getTime()
      : new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0).getTime();

    const rangeEndMs = isNaN(eDate.getTime())
      ? new Date(selectedYear, 11, 31, 23, 59, 59).getTime()
      : new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59).getTime();

    const totalMs = Math.max(1, rangeEndMs - rangeStartMs);

    normalizedCards.forEach((card) => {
      let startDate: Date;
      let endDate: Date;

      const custom = customCardDates[card.id];
      const actDate = custom && custom.activity_date !== undefined ? custom.activity_date : card.activity_date;
      const actEndDate = custom && custom.activity_end_date !== undefined ? custom.activity_end_date : card.activity_end_date;

      if (actDate && actEndDate) {
        startDate = new Date(actDate);
        endDate = new Date(actEndDate);
        if (typeof actEndDate === "string" && !actEndDate.includes("T")) {
          endDate.setHours(23, 59, 59, 999);
        }
      } else if (actDate) {
        startDate = new Date(actDate);
        endDate = new Date(actDate);
        if (typeof actDate === "string" && !actDate.includes("T")) {
          endDate.setHours(23, 59, 59, 999);
        }
      } else if (actEndDate) {
        startDate = new Date(actEndDate);
        endDate = new Date(actEndDate);
        if (typeof actEndDate === "string" && !actEndDate.includes("T")) {
          endDate.setHours(23, 59, 59, 999);
        }
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
        startDateStr: startDate.toISOString().split("T")[0],
        endDateStr: endDate.toISOString().split("T")[0],
      });
    });

    return map;
  }, [normalizedCards, startDateStr, endDateStr, selectedYear, customCardDates]);

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
    const containerRect = gridTimelineRef.current.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left + gridTimelineRef.current.scrollLeft;
    const currentY = e.clientY - containerRect.top + gridTimelineRef.current.scrollTop;

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

  const { dependencyLines, layoutMap } = useMemo(() => {
    const layoutMap = new Map<number, { startPx: number; endPx: number; centerYPx: number; rowHeight: number }>();
    const rawLinks: Array<{
      id: string;
      fromCardId: number;
      toCardId: number;
      isDateless?: boolean;
    }> = [];

    let currentY = 0; // top offset inside timeline rows container

    groupedData.forEach((group) => {
      currentY += 44; // group header height 44px
      const parentCards = group.cards.filter((c) => !c.parent_id);

      if (parentCards.length === 0) {
        currentY += 44; // empty group placeholder row height 44px
      } else {
        parentCards.forEach((card) => {
          const isDateless = !card.activity_date && !card.activity_end_date;
          const rowHeight = 44;
          const centerY = currentY + rowHeight / 2;
          const pos = getCardTimelinePosition(card);
          const startPx = isDateless ? 16 : (gridMinWidth * pos.leftPercent) / 100;
          const widthPx = isDateless ? 160 : Math.max(24, (gridMinWidth * pos.widthPercent) / 100);
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
              const subStartPx = isSubDateless ? 32 : (gridMinWidth * subPos.leftPercent) / 100;
              const subWidthPx = isSubDateless ? 140 : Math.max(20, (gridMinWidth * subPos.widthPercent) / 100);
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

      // Y range spanned by source and all targets in this group
      const allY = [y1, ...sortedLinks.map((l) => layoutMap.get(l.toCardId)!.centerYPx)];
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);

      // Find the minimum startPx of ALL cards in layoutMap located within the vertical row range [minY, maxY]
      let minCardStartX = Math.min(x1, ...sortedLinks.map((l) => layoutMap.get(l.toCardId)!.startPx));
      layoutMap.forEach((layout) => {
        if (layout.centerYPx >= minY - 4 && layout.centerYPx <= maxY + 4) {
          if (layout.startPx < minCardStartX) {
            minCardStartX = layout.startPx;
          }
        }
      });

      // Check if all targets are far enough forward (x2 >= x1 + 24)
      const allForward = sortedLinks.every((l) => layoutMap.get(l.toCardId)!.startPx >= x1 + 24);

      // Check if x1 + 14 right stem trunk collides with any card bar in the Y range
      let trunkRightBlocked = false;
      layoutMap.forEach((layout) => {
        if (layout.centerYPx >= minY - 4 && layout.centerYPx <= maxY + 4) {
          if (layout.startPx < x1 + 20 && layout.endPx > x1 + 8) {
            trunkRightBlocked = true;
          }
        }
      });

      const useLeftTrunk = !allForward || trunkRightBlocked || minCardStartX < x1 + 16;

      // X position of shared vertical trunk line
      const X_trunk = useLeftTrunk
        ? Math.max(8, minCardStartX - 16)
        : x1 + 14;

      const rowHalfHeight = fromPos.rowHeight / 2;
      const y_channel = maxY >= y1
        ? y1 + rowHalfHeight + 4
        : y1 - rowHalfHeight - 4;

      sortedLinks.forEach((link) => {
        const toPos = layoutMap.get(link.toCardId)!;
        const x2 = toPos.startPx;
        const y2 = toPos.centerYPx;

        let pathD = "";

        if (!useLeftTrunk) {
          // Shared Right Trunk (Forward target cards):
          // Line leaves x1 -> X_trunk (x1 + 14), goes vertically down X_trunk, and branches horizontally to x2 - 4 at target row y2
          const r = Math.min(6, Math.abs(X_trunk - x1) / 2, Math.abs(y2 - y1) / 2, Math.abs(x2 - 4 - X_trunk) / 2);
          const dirY = y2 >= y1 ? 1 : -1;

          if (r < 1.5 || Math.abs(y2 - y1) < 4) {
            pathD = `M ${x1} ${y1} H ${X_trunk} V ${y2} H ${x2 - 4}`;
          } else {
            pathD = `M ${x1} ${y1}` +
                    ` H ${X_trunk - r}` +
                    ` Q ${X_trunk} ${y1}, ${X_trunk} ${y1 + r * dirY}` +
                    ` V ${y2 - r * dirY}` +
                    ` Q ${X_trunk} ${y2}, ${X_trunk + r} ${y2}` +
                    ` H ${x2 - 4}`;
          }
        } else {
          // Shared Left Bypass Trunk (Backward/Overlapping targets or blocked path):
          // Leaves (x1, y1) -> goes right 14px -> curves to y_channel -> goes left to X_trunk (left of ALL cards)
          // -> runs down shared vertical trunk X_trunk (|) -> branches right at target y2 (|_____) into x2 - 4
          const dirY1 = y_channel >= y1 ? 1 : -1;
          const dirY2 = y2 >= y_channel ? 1 : -1;

          const maxR = 6;
          const r = Math.min(
            maxR,
            Math.abs(x1 + 14 - x1) / 2,
            Math.abs(y_channel - y1) / 2,
            Math.abs(x1 + 14 - X_trunk) / 2,
            Math.abs(y2 - y_channel) / 2,
            Math.abs(x2 - 4 - X_trunk) / 2
          );

          if (r < 1.5) {
            pathD = `M ${x1} ${y1} H ${x1 + 14} V ${y_channel} H ${X_trunk} V ${y2} H ${x2 - 4}`;
          } else {
            pathD = `M ${x1} ${y1}` +
                    ` H ${x1 + 14 - r}` +
                    ` Q ${x1 + 14} ${y1}, ${x1 + 14} ${y1 + r * dirY1}` +
                    ` V ${y_channel - r * dirY1}` +
                    ` Q ${x1 + 14} ${y_channel}, ${x1 + 14 - r} ${y_channel}` +
                    ` H ${X_trunk + r}` +
                    ` Q ${X_trunk} ${y_channel}, ${X_trunk} ${y_channel + r * dirY2}` +
                    ` V ${y2 - r * dirY2}` +
                    ` Q ${X_trunk} ${y2}, ${X_trunk + r} ${y2}` +
                    ` H ${x2 - 4}`;
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

    return { dependencyLines: lines, layoutMap };
  }, [groupedData, gridMinWidth, expandedParents, getCardTimelinePosition]);

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
    if (groupBy === "assignee") return null;

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
            className="w-5.5 h-5.5 rounded-full object-cover flex-shrink-0 border border-surface-700 shadow-xs"
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
              <span className="text-[10px] font-bold text-text-primary bg-surface-800 border border-border px-1.5 py-0.5 rounded-full shadow-xs">
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
    if (groupBy === "assignee") return null;

    const users = getCardUsers(cardItem);
    if (users.length === 0) return null;

    const isNarrow = widthPercent < 12;

    return (
      <div className="flex items-center flex-shrink-0 ml-1.5" title={`Assigned to ${users.map((u) => u.first_name).join(", ")}`}>
        {isNarrow || users.length > 3 ? (
          <div className="flex items-center gap-1 bg-surface-950/40 backdrop-blur-xs px-1.5 py-0.5 rounded-full border border-white/20 text-[10px] font-bold text-white shadow-xs">
            <Users className="w-3 h-3 text-white/90" />
            <span>{users.length}</span>
          </div>
        ) : users.length === 1 ? (
          <img
            src={users[0].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(users[0].first_name)}&background=06b6d4&color=fff`}
            alt={users[0].first_name}
            className="w-4 h-4 rounded-full object-cover flex-shrink-0 border border-white/30"
          />
        ) : (
          <div className="flex items-center -space-x-1.5 overflow-visible">
            {users.slice(0, 2).map((u) => (
              <img
                key={`bar-avatar-${cardItem.id}-${u.id}`}
                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                alt={u.first_name}
                className="w-4 h-4 rounded-full object-cover border border-surface-900 ring-1 ring-white/30"
              />
            ))}
            {users.length > 2 && (
              <span className="text-[9px] font-extrabold text-white bg-surface-950/60 px-1 rounded-full border border-white/20">
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
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 bg-surface-900/90 border-b border-border/80 backdrop-blur-md sticky top-0 z-20">
        {/* Title & Today Jump (Visible on all screens) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-text-primary">
            <Layers className="w-4 h-4 text-primary" />
            <span>Gantt Roadmap</span>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1 rounded-xl bg-surface-800 border border-border text-xs font-bold text-primary hover:bg-primary/10 hover:border-primary/40 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

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

        {/* Desktop Toolbar Controls (>= 1440px 2xl screens) */}
        <div className="hidden 2xl:flex items-center gap-3">
          {/* Grouping Buttons */}
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
              Phases
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

          {/* Scale Selector */}
          <div className="flex items-center gap-1.5 bg-surface-800/80 p-1 rounded-xl border border-border/60">
            <span className="text-xs text-text-muted font-medium px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Scale:
            </span>
            <button
              onClick={() => handleScaleChange("month")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeScale === "month"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              Months
            </button>
            <button
              onClick={() => handleScaleChange("week")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeScale === "week"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => handleScaleChange("day")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeScale === "day"
                  ? "bg-primary text-surface-950 shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-700/50"
              }`}
            >
              Days
            </button>
          </div>

          {/* Zoom Level Control */}
          <div className="flex items-center gap-1 bg-surface-800/90 border border-border px-2 py-1 rounded-xl text-xs text-text-primary shadow-xs">
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
              className="px-1.5 text-xs font-bold text-text-primary font-mono cursor-pointer hover:text-primary transition-colors min-w-[42px] text-center"
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

          {/* Interactive Date Range Picker */}
          <div className="flex items-center gap-1.5 bg-surface-800/90 border border-border px-2.5 py-1 rounded-xl text-xs text-text-primary shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-text-muted font-bold text-[10px] uppercase tracking-wider">Range:</span>
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
          </div>

          {/* Year Selector */}
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

          {/* Unscheduled items badge (Icon + Count only) */}
          {unscheduledCards.length > 0 && (
            <button
              onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
              className={`px-2 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showUnscheduledDrawer
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-surface-800/80 text-amber-400 border-border hover:bg-surface-700/60"
              }`}
              title={`${unscheduledCards.length} unscheduled tasks without dates`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{unscheduledCards.length}</span>
            </button>
          )}
        </div>

        {/* Mobile, Tablet & HD Screens Controls Drawer Button (< 1440px 2xl screens) */}
        <div className="flex 2xl:hidden items-center gap-2">
          {unscheduledCards.length > 0 && (
            <button
              onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
              className="px-2 py-1 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{unscheduledCards.length}</span>
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

      {/* 2. Main Gantt Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Column: Group & Task Hierarchy Titles + Dedicated STATUS Column */}
        <div className="w-72 sm:w-[400px] flex-shrink-0 bg-surface-900/90 border-r border-border/80 flex flex-col z-10 shadow-lg">
          <div className="h-12 border-b border-border/80 px-3 flex items-center justify-between bg-surface-900/95 font-bold text-xs text-text-secondary uppercase tracking-wider">
            <span className="flex items-center gap-2 flex-1 min-w-0 pr-2">
              <Layers className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{groupBy === "phase" ? "Tasks & Phases" : groupBy === "column" ? "Tasks & Stages" : groupBy === "priority" ? "Tasks & Priority" : "Tasks & Assignees"}</span>
            </span>
            <div className="w-28 flex-shrink-0 text-center font-bold text-[10px] text-text-muted uppercase tracking-widest border-l border-border/40 pl-2">
              Status
            </div>
          </div>

          {/* Rows List (Left Panel - Completely Hidden Scrollbar with Wheel Forwarding) */}
          <div
            ref={leftScrollRef}
            onWheel={(e) => {
              if (gridTimelineRef.current) {
                gridTimelineRef.current.scrollTop += e.deltaY;
              }
            }}
            className="flex-1 overflow-hidden divide-y divide-border/40 select-none"
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
                      <div className="h-[44px] px-4 flex items-center gap-2 text-xs font-semibold text-text-muted/80 bg-surface-950/20 border-b border-border/20">
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
                              className={`h-[44px] px-3 flex items-center justify-between gap-2 transition-all border-b border-border/20 cursor-grab active:cursor-grabbing group/leftrow ${
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
                                    className="h-[38px] pl-7 pr-3 flex items-center justify-between gap-2 bg-surface-950/40 hover:bg-surface-800/30 transition-colors border-l-2 border-primary/30 border-b border-border/20"
                                  >
                                    <div className="flex-1 items-center gap-2 min-w-0 flex">
                                      <span
                                        onClick={() => onSelectCard(subCard)}
                                        className="text-[11px] font-medium text-text-secondary hover:text-primary cursor-pointer truncate"
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
                  </div>
                </div>
              );
            })}
            {/* Horizontal scrollbar height spacer to maintain 100% vertical row alignment with right timeline */}
            <div className="h-4 flex-shrink-0 border-t border-border/20 bg-surface-900/40" />
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
            <div className="h-12 border-b border-border/80 flex items-center bg-surface-900/90 sticky top-0 z-20 backdrop-blur-md">
              {timelineColumns.map((col, cIdx) => (
                <div
                  key={`timeline-col-${cIdx}`}
                  className="flex-1 h-full border-r border-border/40 flex flex-col items-center justify-center font-bold text-text-secondary uppercase px-1 text-center"
                >
                  <span className="text-[11px] tracking-wider font-bold text-text-primary">{col.label}</span>
                  {col.sublabel && (
                    <span className="text-[9px] text-text-muted font-mono font-normal leading-none">{col.sublabel}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Background Grid Columns */}
            <div className="absolute inset-0 top-12 flex pointer-events-none z-0">
              {timelineColumns.map((_, idx) => (
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
              {/* SVG Task Dependency Connector Lines Overlay */}
              <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
                <defs>
                  <marker
                    id="gantt-arrow"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                  </marker>
                  <marker
                    id="gantt-arrow-active"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
                  </marker>
                </defs>
                {dependencyLines.map((line) => {
                  const isHovered =
                    hoveredLineId === line.id ||
                    hoveredCardId === line.fromCardId ||
                    hoveredCardId === line.toCardId;

                  return (
                    <g key={line.id}>
                      {/* Invisible wider hit area for easy hover & click */}
                      <path
                        d={line.pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="18"
                        pointerEvents="stroke"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredLineId(line.id)}
                        onMouseLeave={() => setHoveredLineId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDependency(line.toCardId, line.fromCardId);
                        }}
                      />
                      {/* Visual Dependency Line */}
                      <path
                        d={line.pathD}
                        fill="none"
                        stroke={isHovered ? (hoveredLineId === line.id ? "#f43f5e" : "#06b6d4") : "#64748b"}
                        strokeWidth={isHovered ? "2.5" : "1.5"}
                        opacity={isHovered ? "1" : "0.55"}
                        strokeDasharray={line.isDateless ? "4,4" : "none"}
                        markerEnd={isHovered ? "url(#gantt-arrow-active)" : "url(#gantt-arrow)"}
                        pointerEvents="none"
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}
                {linkingState && (
                  <g>
                    <line
                      x1={linkingState.startX}
                      y1={linkingState.startY}
                      x2={linkingState.currentX}
                      y2={linkingState.currentY}
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />
                    <circle
                      cx={linkingState.currentX}
                      cy={linkingState.currentY}
                      r="6"
                      fill="#06b6d4"
                      className="animate-ping"
                    />
                  </g>
                )}
              </svg>

              {/* Floating HTML Unlink Task Button at line endpoint */}
              {(() => {
                const activeLine = dependencyLines.find((l) => l.id === hoveredLineId);
                if (!activeLine) return null;
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${Math.max(activeLine.X_trunk + 8, activeLine.toX - 95)}px`,
                      top: `${activeLine.toY - 14}px`,
                    }}
                    className="z-50 pointer-events-auto flex items-center animate-in fade-in zoom-in-95 duration-150"
                    onMouseEnter={() => setHoveredLineId(activeLine.id)}
                    onMouseLeave={() => setHoveredLineId(null)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDependency(activeLine.toCardId, activeLine.fromCardId);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-surface-950/95 border border-error text-error hover:bg-error hover:text-white text-[11px] font-bold shadow-2xl flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-all scale-105 active:scale-95"
                      title="Click to remove predecessor dependency link"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Unlink Task</span>
                    </button>
                  </div>
                );
              })()}
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
                    {/* Group Header Spacer */}
                    <div className="h-[44px] border-b border-border/40 bg-surface-900/30" />

                    {/* Timeline Bars for Cards & Sub-Cards */}
                    <div className="divide-y divide-border/20">
                      {parentCards.length === 0 ? (
                        <div className="h-[44px] border-b border-border/20 flex items-center px-4 relative pointer-events-none">
                          <span className="sticky left-4 z-10 text-xs font-semibold text-text-muted italic px-3 py-1 rounded-lg bg-surface-800/90 border border-border/70 shadow-xs">
                            No tasks in group
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
                                className={`h-[44px] px-2 flex items-center relative transition-colors border-b border-border/20 ${
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
                                <div
                                    data-gantt-card-id={card.id}
                                    draggable={!resizingState}
                                    onDragStart={(e) => {
                                      if (resizingState) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                      }
                                      handleGanttCardDragStart(e, card.id);
                                    }}
                                    className={`relative h-8 my-0.5 flex items-center group/bar cursor-grab active:cursor-grabbing select-none ${
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
                                    {/* Live Date Range Floating Tooltip on Hover / Drag */}
                                    {(isHovered || resizingState?.cardId === card.id) && (
                                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 px-2.5 py-0.5 rounded-lg bg-surface-950/95 border border-primary/60 text-primary text-[10px] font-bold shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md animate-in fade-in duration-150">
                                        <Calendar className="w-3 h-3 text-cyan-400" />
                                        <span>{formatDateRangeTooltip(pos.startDateStr, pos.endDateStr)}</span>
                                      </div>
                                    )}

                                    {/* Left Date Handle (Start Date extension) */}
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

                                    <div
                                      onMouseDown={(e) => {
                                        hasDraggedRef.current = false;
                                        handleResizeStart(e, card, "move");
                                      }}
                                      onClick={(e) => handleBarClick(e, card)}
                                      className={`w-full h-full rounded-xl px-3 flex items-center justify-between text-xs font-semibold text-white shadow-md cursor-pointer transition-all duration-200 border border-white/20 select-none overflow-hidden relative ${
                                        isHovered ? "ring-2 ring-white/60 scale-[1.01] shadow-lg z-20" : ""
                                      }`}
                                      style={{
                                        backgroundColor: cardColor,
                                        backgroundImage: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
                                      }}
                                    >
                                      {(() => {
                                        const rate = getCardCompletionRate(card);
                                        return (
                                          <>
                                            {rate > 0 && (
                                              <div
                                                className="absolute left-0 top-0 bottom-0 bg-white/30 border-r border-white/40 pointer-events-none transition-all duration-300 rounded-l-xl z-0"
                                                style={{ width: `${rate}%` }}
                                              />
                                            )}
                                            <div className="flex items-center gap-1.5 truncate pr-1 z-10">
                                              <span className="truncate drop-shadow-xs font-bold text-white text-[11px]">
                                                {card.title}
                                              </span>
                                              {rate > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-full bg-black/40 border border-white/30 text-[9px] font-extrabold text-white shadow-xs backdrop-blur-xs flex-shrink-0">
                                                  {rate}%
                                                </span>
                                              )}
                                            </div>

                                            <div className="z-10">
                                              {renderTimelineAssigneeAvatars(card, pos.widthPercent)}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* Right Date Handle (End Date extension) */}
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

                                    {/* Interactive Dependency Connector Handle Dot (Restored) */}
                                    <div
                                      draggable={false}
                                      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                      onMouseDown={(e) => handleLinkDragStart(e, card.id)}
                                      className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-surface-950 shadow-md cursor-crosshair z-40 hover:scale-125 opacity-0 group-hover/bar:opacity-100 transition-all flex items-center justify-center"
                                      title="Click & drag to link predecessor dependency"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-surface-950" />
                                    </div>
                                  </div>
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
                                    className="h-[38px] px-2 flex items-center relative bg-surface-950/20 hover:bg-surface-900/10 transition-colors border-b border-border/20"
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
                                          className={`relative h-6 my-0.5 flex items-center group/bar select-none ${
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

                                          <div
                                            onMouseDown={(e) => handleResizeStart(e, subCard, "move")}
                                            onClick={(e) => handleBarClick(e, subCard)}
                                            className={`w-full h-full rounded-lg px-2.5 flex items-center justify-between text-[11px] font-medium text-white shadow-sm cursor-pointer transition-all duration-200 border border-white/20 select-none overflow-hidden relative ${
                                              isSubHovered ? "ring-2 ring-white/60 scale-[1.01] z-20" : ""
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
                                                  </div>
                                                  <div className="z-10">
                                                    {renderTimelineAssigneeAvatars(subCard, subPos.widthPercent)}
                                                  </div>
                                                </>
                                              );
                                            })()}
                                          </div>

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

                                           {/* Subcard Interactive Dependency Connector Handle Dot (Restored) */}
                                           <div
                                             draggable={false}
                                             onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                             onMouseDown={(e) => handleLinkDragStart(e, subCard.id)}
                                             className="absolute -right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-surface-950 shadow-md cursor-crosshair z-40 hover:scale-125 opacity-0 group-hover/bar:opacity-100 transition-all flex items-center justify-center"
                                             title="Click & drag to link predecessor dependency"
                                           >
                                             <div className="w-1 h-1 rounded-full bg-surface-950" />
                                           </div>
                                        </div>
                                    )}
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

      {/* Mobile / Tablet Slide-Over Gantt Controls Sidebar Drawer */}
      {showGanttControlsSidebar && (
        <div className="fixed top-0 right-0 bottom-0 z-50 w-80 sm:w-96 bg-surface-900 shadow-2xl border-l border-border/80 flex flex-col animate-in slide-in-from-right duration-200">
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
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Date Range Filter:</label>
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
          </div>
        </div>
      )}

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
    </div>
  );
}
