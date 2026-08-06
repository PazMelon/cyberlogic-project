import { useEffect } from "react";
import { Pin, Plus } from "lucide-react";

const QUICK_EMOJIS_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export interface ReactionPickerProps {
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
  reactions,
  onReact,
  onOpenFullPicker,
  onClose,
  onTogglePin,
  isPinned = false,
  isSidebar = true,
}: ReactionPickerProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Transparent non-blurred backdrop covering the viewport */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent pointer-events-auto cursor-pointer z-40"
      />

      {/* Floating Reaction Bar - Perfectly Centered in Cyberboard Sidebar without background blur */}
      <div
        className={`reaction-picker-container fixed pointer-events-auto flex items-center justify-between gap-1 sm:gap-1.5 bg-surface-900 border border-border/80 rounded-[22px] p-2 shadow-2xl animate-fade-in-up z-50 ${
          isSidebar
            ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:left-auto sm:right-[192px] sm:translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 w-[325px] max-w-[88vw]"
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] max-w-[90vw]"
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
    </div>
  );
}
