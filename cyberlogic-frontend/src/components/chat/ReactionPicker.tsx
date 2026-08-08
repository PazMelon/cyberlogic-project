import { useEffect, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Pin, Plus } from "lucide-react";

const QUICK_EMOJIS_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export interface ReactionPickerProps {
  targetMessageId?: number | null;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
    reacted: boolean;
  }[];
  onReact: (emoji: string) => void;
  onOpenFullPicker: () => void;
  align?: "left" | "right";
  onClose?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  isSidebar?: boolean;
}

export default function ReactionPicker({
  targetMessageId,
  reactions,
  onReact,
  onOpenFullPicker,
  onClose,
  onTogglePin,
  isPinned = false,
  isSidebar = false,
}: ReactionPickerProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Compute smart popover position relative to target message bubble
  useLayoutEffect(() => {
    const computePos = () => {
      if (!targetMessageId) return;
      const el = document.getElementById(`msg-bubble-${targetMessageId}`);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const barWidth = Math.min(325, window.innerWidth * 0.88);
      const barHeight = 52;

      // Preferred position: 10px above top of bubble
      let top = rect.top - barHeight - 10;
      // If it would overflow top edge of screen, flip to below the bubble
      if (top < 16) {
        top = rect.bottom + 10;
      }
      // Clamp Y within viewport with 12px margin
      top = Math.max(12, Math.min(window.innerHeight - barHeight - 12, top));

      // Center horizontally over the message bubble
      const bubbleCenter = rect.left + rect.width / 2;
      let left = bubbleCenter - barWidth / 2;

      // Determine horizontal boundary limits
      let minLeft = 12;
      let maxLeft = window.innerWidth - barWidth - 12;

      if (isSidebar && window.innerWidth >= 640) {
        const sidebarWidth = 384; // sm:w-96
        const sidebarLeft = window.innerWidth - sidebarWidth;
        minLeft = sidebarLeft + 12;
        maxLeft = window.innerWidth - barWidth - 12;
      }

      left = Math.max(minLeft, Math.min(maxLeft, left));

      setCoords({ top, left });
    };

    computePos();
    window.addEventListener("resize", computePos);
    window.addEventListener("scroll", computePos, true);

    return () => {
      window.removeEventListener("resize", computePos);
      window.removeEventListener("scroll", computePos, true);
    };
  }, [targetMessageId, isSidebar]);

  // Listen for clicks anywhere on document to close reaction bar immediately
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".reaction-picker-container") && onClose) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose]);

  const emojiButtons = QUICK_EMOJIS_LIST.map((emoji) => {
    const existingReaction = reactions?.find((r) => r.emoji === emoji);
    const isReacted = existingReaction ? existingReaction.reacted : false;
    return (
      <button
        key={emoji}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReact(emoji);
          if (onClose) onClose();
        }}
        className={`w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-all text-lg sm:text-xl cursor-pointer ${
          isReacted ? "bg-primary/20 ring-2 ring-primary/40" : ""
        }`}
      >
        {emoji}
      </button>
    );
  });

  const plusButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenFullPicker();
        if (onClose) onClose();
      }}
      className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl bg-surface-800/90 border border-border/60 hover:bg-surface-700 active:scale-95 text-text-muted hover:text-text-primary transition-all cursor-pointer flex-shrink-0"
      title="More emojis"
    >
      <Plus className="w-4 h-4" />
    </button>
  );

  const pinButton = onTogglePin ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTogglePin();
        if (onClose) onClose();
      }}
      className={`w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl border transition-all cursor-pointer flex-shrink-0 active:scale-95 ${
        isPinned
          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
          : "bg-surface-800/90 border-border/60 text-text-muted hover:text-amber-400 hover:bg-amber-500/10"
      }`}
      title={isPinned ? "Unpin Message" : "Pin Message"}
    >
      <Pin className={`w-4 h-4 ${isPinned ? "fill-amber-400 text-amber-400" : ""}`} />
    </button>
  ) : null;

  // Fallback position if coords are not calculated yet
  const fallbackPositionClass = isSidebar
    ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:left-auto sm:right-[192px] sm:translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2"
    : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
      {/* Transparent backdrop covering the viewport */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent pointer-events-auto cursor-pointer z-[10000]"
      />

      {/* Floating Reaction Bar - Positioned above target bubble with smart anti-clipping fallback */}
      <div
        style={
          coords
            ? {
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: "none",
              }
            : undefined
        }
        className={`reaction-picker-container fixed pointer-events-auto flex items-center justify-between gap-1 sm:gap-1.5 bg-surface-900 border border-border/80 rounded-[22px] p-2 shadow-2xl animate-fade-in-up z-[10001] w-[325px] max-w-[88vw] ${
          !coords ? fallbackPositionClass : ""
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-1">
          {emojiButtons}
        </div>
        
        <div className="w-px h-6 bg-border/60 mx-0.5 flex-shrink-0" />

        <div className="flex items-center gap-1 sm:gap-1 flex-shrink-0">
          {plusButton}
          {pinButton}
        </div>
      </div>
    </div>,
    document.body
  );
}
