import React from "react";
import type { CyberboardCard } from "../../../utils/api";

interface GanttDependencyCanvasProps {
  cards: CyberboardCard[];
  cardRowHeights: Map<number, { startPx: number; endPx: number; centerYPx: number; rowHeight: number }> | Record<number, { top: number; height: number }>;
  timelinePositions: Map<number, { leftPercent: number; widthPercent: number }>;
  containerWidth: number;
  hoveredLineId: string | null;
  setHoveredLineId: (id: string | null) => void;
  hoveredCardId: number | null;
  canEditGantt?: boolean;
  onRemoveDependency?: (targetCardId: number, fromCardId: number) => void;
  showCriticalPath?: boolean;
  criticalPathCardIds?: Set<number>;
}

export const GanttDependencyCanvas: React.FC<GanttDependencyCanvasProps> = ({
  cards,
  cardRowHeights,
  timelinePositions,
  containerWidth,
  hoveredLineId,
  setHoveredLineId,
  hoveredCardId,
  canEditGantt = true,
  onRemoveDependency,
  showCriticalPath = false,
  criticalPathCardIds = new Set(),
}) => {
  if (containerWidth <= 0) return null;

  // ── Step 1: Precompute left/right/top/bottom bounds for all visible task bars ──
  const taskBounds = new Map<number, { left: number; right: number; top: number; bottom: number; centerY: number }>();
  cards.forEach((c) => {
    if (c.is_archived) return;
    const cRow = cardRowHeights instanceof Map ? cardRowHeights.get(c.id) : (cardRowHeights as any)[c.id];
    const cPos = timelinePositions.get(c.id);
    if (!cRow || !cPos) return;
    const cY = 'centerYPx' in cRow ? cRow.centerYPx : (cRow.top + cRow.height / 2);
    const left = (cPos.leftPercent / 100) * containerWidth;
    const right = ((cPos.leftPercent + cPos.widthPercent) / 100) * containerWidth;
    taskBounds.set(c.id, { left, right, top: cY - 18, bottom: cY + 18, centerY: cY });
  });

  // ── Step 2: Collect raw dependency pairs ──────────────────────────────
  const rawPairs: Array<{
    id: string;
    fromId: number;
    toId: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    isCritical: boolean;
  }> = [];

  cards.forEach((targetCard) => {
    const predIds =
      targetCard.predecessor_ids && targetCard.predecessor_ids.length > 0
        ? targetCard.predecessor_ids
        : targetCard.predecessor_id
        ? [targetCard.predecessor_id]
        : [];

    if (predIds.length === 0) return;

    const toRow = cardRowHeights instanceof Map ? cardRowHeights.get(targetCard.id) : (cardRowHeights as any)[targetCard.id];
    const toPos = timelinePositions.get(targetCard.id);
    if (!toRow || !toPos) return;

    const toX = (toPos.leftPercent / 100) * containerWidth;
    const toY = 'centerYPx' in toRow ? toRow.centerYPx : (toRow.top + toRow.height / 2);

    predIds.forEach((fromId) => {
      const fromCard = cards.find((c) => c.id === fromId);
      if (!fromCard) return;

      const fromRow = cardRowHeights instanceof Map ? cardRowHeights.get(fromId) : (cardRowHeights as any)[fromId];
      const fromPos = timelinePositions.get(fromId);
      if (!fromRow || !fromPos) return;

      const fromX = ((fromPos.leftPercent + fromPos.widthPercent) / 100) * containerWidth;
      const fromY = 'centerYPx' in fromRow ? fromRow.centerYPx : (fromRow.top + fromRow.height / 2);

      const isCritical =
        showCriticalPath &&
        criticalPathCardIds.has(fromId) &&
        criticalPathCardIds.has(targetCard.id);

      rawPairs.push({
        id: `dep-${fromId}-${targetCard.id}`,
        fromId,
        toId: targetCard.id,
        fromX,
        fromY,
        toX,
        toY,
        isCritical,
      });
    });
  });

  // Sort pairs deterministically by target Y row position
  rawPairs.sort((a, b) => a.toY - b.toY || a.fromY - b.fromY);

  // ── Step 3: Compute clean left-side trunk orthogonal paths ───────────
  // All vertical drop lines are strictly placed on the FAR LEFT of all cards in the vertical span (leftCorridorX < minSpanLeftX)
  const lines: Array<{
    id: string;
    fromId: number;
    toId: number;
    path: string;
    midX: number;
    midY: number;
    isCritical: boolean;
  }> = rawPairs.map((pair, idx) => {
    const { fromX, fromY, toX, toY, fromId, toId, isCritical } = pair;

    const minY = Math.min(fromY, toY);
    const maxY = Math.max(fromY, toY);

    // Find the minimum LEFT position of any task bar vertically between fromY and toY
    let minSpanLeftX = Math.min(toX, taskBounds.get(fromId)?.left ?? fromX);

    taskBounds.forEach((tb) => {
      if (tb.bottom >= minY - 4 && tb.top <= maxY + 4) {
        if (tb.left < minSpanLeftX) minSpanLeftX = tb.left;
      }
    });

    const pad = 16;
    const laneOffset = (idx % 4) * 6; // Spacing parallel vertical trunk lines 6px apart

    // The vertical drop line is ALWAYS placed to the LEFT of the leftmost card in the span
    const leftCorridorX = Math.max(12, minSpanLeftX - pad - laneOffset);
    const midY = (fromY + toY) / 2;

    let path = "";

    // For direct adjacent cascade steps (e.g. fromX < toX and toY is close to fromY), route smooth 3-segment:
    if (toX >= fromX + 24 && Math.abs(toY - fromY) <= 60 && toX - 14 > fromX) {
      const midStepX = (fromX + toX) / 2;
      path = `M ${fromX} ${fromY} H ${midStepX} V ${toY} H ${toX}`;
    } else {
      // For trunk dependencies: exit right → drop to midY → route LEFT to leftCorridorX → drop to toY → enter target left (toX)
      const exitX = fromX + 10;
      path = `M ${fromX} ${fromY} H ${exitX} V ${midY} H ${leftCorridorX} V ${toY} H ${toX}`;
    }

    return {
      id: pair.id,
      fromId,
      toId,
      path,
      midX: leftCorridorX,
      midY,
      isCritical,
    };
  });

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
      style={{ minWidth: containerWidth }}
    >
      <defs>
        <marker
          id="gantt-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" fillOpacity="0.85" />
        </marker>
        <marker
          id="gantt-arrow-critical"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
        </marker>
        <marker
          id="gantt-arrow-hover"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
        </marker>
      </defs>

      {lines.map((line) => {
        const isHovered =
          hoveredLineId === line.id ||
          hoveredCardId === line.fromId ||
          hoveredCardId === line.toId;

        const strokeColor = isHovered
          ? "#ec4899"
          : line.isCritical
          ? "#f43f5e"
          : "#06b6d4";

        const strokeOpacity = isHovered
          ? 1
          : line.isCritical
          ? 0.9
          : 0.45;

        const markerId = isHovered
          ? "url(#gantt-arrow-hover)"
          : line.isCritical
          ? "url(#gantt-arrow-critical)"
          : "url(#gantt-arrow)";

        return (
          <g key={line.id} className="group pointer-events-auto">
            {/* Invisible wider hit area stroke for easy clicking/hovering */}
            <path
              d={line.path}
              fill="none"
              stroke="transparent"
              strokeWidth="14"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
              onClick={() => {
                if (canEditGantt && onRemoveDependency) {
                  onRemoveDependency(line.toId, line.fromId);
                }
              }}
            />
            {/* Visible Dependency Line */}
            <path
              d={line.path}
              fill="none"
              stroke={strokeColor}
              strokeOpacity={strokeOpacity}
              strokeWidth={isHovered || line.isCritical ? 2.5 : 1.6}
              markerEnd={markerId}
              className="transition-all duration-150"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default GanttDependencyCanvas;
