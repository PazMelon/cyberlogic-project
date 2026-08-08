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
  isExporting?: boolean;
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
  isExporting = false,
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

  // ── Step 3: Compute clean orthogonal paths with rounded corners (from commit 5f1a571) ─────
  const lines: Array<{
    id: string;
    fromId: number;
    toId: number;
    path: string;
    midX: number;
    midY: number;
    isCritical: boolean;
  }> = rawPairs.map((pair) => {
    const { fromX: x1, fromY: y1, toX: targetX, toY: y2, fromId, toId, isCritical } = pair;
    const x2 = targetX;

    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Compute intermediate task bar layouts between y1 and y2
    const intermediateLayouts: Array<{ startPx: number; endPx: number }> = [];
    cards.forEach((c) => {
      if (c.id === fromId || c.id === toId || c.is_archived) return;
      const cRow = cardRowHeights instanceof Map ? cardRowHeights.get(c.id) : (cardRowHeights as any)[c.id];
      const cPos = timelinePositions.get(c.id);
      if (!cRow || !cPos) return;

      const cY = 'centerYPx' in cRow ? cRow.centerYPx : (cRow.top + cRow.height / 2);
      if (cY > minY + 2 && cY < maxY - 2) {
        const startPx = (cPos.leftPercent / 100) * containerWidth;
        const endPx = ((cPos.leftPercent + cPos.widthPercent) / 100) * containerWidth;
        intermediateLayouts.push({ startPx, endPx });
      }
    });

    const candidateRightTrunk = Math.max(x1 + 12, Math.min(x1 + 20, targetX - 8));
    const isRightTrunkBlocked = intermediateLayouts.some(
      (l) => candidateRightTrunk >= l.startPx - 6 && candidateRightTrunk <= l.endPx + 6
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
      // 2. Obstacle-Avoidance Right Bypass Corridor
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

      const rowHalfHeight = 22;
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

    return {
      id: pair.id,
      fromId,
      toId,
      path: pathD,
      midX: X_trunk,
      midY: (y1 + y2) / 2,
      isCritical,
    };
  });

  // Sort lines so hovered / active highlighted lines render LAST in SVG DOM order (bringing them to top of z-stack)
  const sortedLines = [...lines].sort((a, b) => {
    const aHovered =
      hoveredLineId === a.id ||
      hoveredCardId === a.fromId ||
      hoveredCardId === a.toId;
    const bHovered =
      hoveredLineId === b.id ||
      hoveredCardId === b.fromId ||
      hoveredCardId === b.toId;
    if (aHovered && !bHovered) return 1;
    if (!aHovered && bHovered) return -1;
    return 0;
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
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" fillOpacity="1" />
        </marker>
        <marker
          id="gantt-arrow-critical"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7.5"
          markerHeight="7.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" fillOpacity="1" />
        </marker>
        <marker
          id="gantt-arrow-hover"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" fillOpacity="1" />
        </marker>
      </defs>

      {sortedLines.map((line) => {
        const isHovered =
          hoveredLineId === line.id ||
          hoveredCardId === line.fromId ||
          hoveredCardId === line.toId;

        const strokeColor = isHovered
          ? "#ec4899"
          : line.isCritical
          ? "#e11d48"
          : "#0284c7";

        const strokeOpacity = 1;

        const strokeWidth = isExporting
          ? 2.4
          : isHovered || line.isCritical
          ? 2.8
          : 2;

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
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={markerId}
              className="transition-all duration-150"
            />
            {/* Interactive Red 'X' Delete Button on Hover */}
            {isHovered && canEditGantt && onRemoveDependency && (
              <g
                transform={`translate(${line.midX}, ${line.midY})`}
                className="cursor-pointer group/btn transition-all animate-in fade-in zoom-in-75 duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDependency(line.toId, line.fromId);
                }}
                onMouseEnter={() => setHoveredLineId(line.id)}
              >
                <circle r="9" fill="#ef4444" className="shadow-lg hover:scale-125 transition-transform" />
                <path
                  d="M -3 -3 L 3 3 M 3 -3 L -3 3"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default GanttDependencyCanvas;
