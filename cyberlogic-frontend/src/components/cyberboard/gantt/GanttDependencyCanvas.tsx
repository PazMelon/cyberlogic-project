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

  // Build dependency lines
  const lines: Array<{
    id: string;
    fromId: number;
    toId: number;
    path: string;
    midX: number;
    midY: number;
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

      const fromX =
        ((fromPos.leftPercent + fromPos.widthPercent) / 100) * containerWidth;
      const fromY = 'centerYPx' in fromRow ? fromRow.centerYPx : (fromRow.top + fromRow.height / 2);

      const isCritical =
        showCriticalPath &&
        criticalPathCardIds.has(fromId) &&
        criticalPathCardIds.has(targetCard.id);

      // Smart 90-degree Orthogonal Polyline Routing: M x1 y1 H mx V y2 H x2
      const gap = 12;
      const midX = Math.max(fromX + gap, (fromX + toX) / 2);
      const path = `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`;

      lines.push({
        id: `dep-${fromId}-${targetCard.id}`,
        fromId,
        toId: targetCard.id,
        path,
        midX,
        midY: (fromY + toY) / 2,
        isCritical,
      });
    });
  });

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
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
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
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
              strokeWidth={isHovered || line.isCritical ? 2.5 : 1.8}
              strokeDasharray={line.isCritical ? "none" : undefined}
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
