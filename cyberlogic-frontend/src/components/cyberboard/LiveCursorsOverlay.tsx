import { MousePointer } from "lucide-react";

export interface RemoteCursor {
  x: number;
  y: number;
  name: string;
  avatar?: string | null;
  updatedAt: number;
}

export interface RemoteDraggingCard {
  cardId: number;
  title: string;
  x: number;
  y: number;
  name: string;
  avatar?: string | null;
}

interface LiveCursorsOverlayProps {
  remoteCursors: Record<number, RemoteCursor>;
  remoteDraggingCards: Record<number, RemoteDraggingCard>;
}

export default function LiveCursorsOverlay({
  remoteCursors,
  remoteDraggingCards,
}: LiveCursorsOverlayProps) {
  return (
    <>
      {/* Live Remote Cursors Overlay */}
      {Object.entries(remoteCursors).map(([idStr, cursor]) => (
        <div
          key={`cursor-${idStr}`}
          className="pointer-events-none absolute top-0 left-0 z-50 flex items-start gap-1 font-sans will-change-transform"
          style={{
            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
            transition: "transform 60ms linear",
          }}
        >
          <MousePointer className="w-5 h-5 text-primary fill-primary drop-shadow-md -rotate-45" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-900/90 border border-primary/40 shadow-xl text-[10px] font-bold text-text-primary backdrop-blur-xs">
            <img
              src={cursor.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
              alt={cursor.name}
              className="w-3.5 h-3.5 rounded-full border border-primary object-cover"
            />
            <span>{cursor.name}</span>
          </div>
        </div>
      ))}

      {/* Live Remote Dragging Cards Ghost Overlay */}
      {Object.entries(remoteDraggingCards).map(([idStr, cardDrag]) => (
        <div
          key={`drag-${idStr}`}
          className="pointer-events-none absolute top-0 left-0 z-50 p-3 rounded-xl bg-primary/20 border-2 border-primary border-dashed shadow-2xl backdrop-blur-md max-w-xs space-y-1.5 scale-105 will-change-transform"
          style={{
            transform: `translate3d(${cardDrag.x + 15}px, ${cardDrag.y + 15}px, 0)`,
            transition: "transform 60ms linear",
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
            <img
              src={cardDrag.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
              alt={cardDrag.name}
              className="w-4 h-4 rounded-full border border-primary object-cover"
            />
            <span>{cardDrag.name} is dragging...</span>
          </div>
          <p className="text-xs font-semibold text-text-primary line-clamp-1">
            {cardDrag.title}
          </p>
        </div>
      ))}
    </>
  );
}
