import { Pin } from "lucide-react";

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
}

export default function ReactionPicker({
  reactions,
  onReact,
  onOpenFullPicker,
  onClose,
  onTogglePin,
  isPinned = false,
}: ReactionPickerProps) {
  const emojiButtons = QUICK_EMOJIS_LIST.map((emoji) => {
    const existingReaction = reactions?.find((r) => r.emoji === emoji);
    const isReacted = existingReaction ? existingReaction.reacted : false;
    return (
      <button
        key={emoji}
        type="button"
        onClick={() => {
          onReact(emoji);
          if (onClose) onClose();
        }}
        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-all text-lg sm:text-xl cursor-pointer ${
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
      onClick={() => {
        onOpenFullPicker();
        if (onClose) onClose();
      }}
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-surface-800 border border-border/40 hover:bg-white/5 active:scale-125 text-text-muted hover:text-text-primary transition-all text-base sm:text-lg cursor-pointer font-bold flex-shrink-0"
      title="More emojis"
    >
      +
    </button>
  );

  const pinButton = onTogglePin ? (
    <button
      type="button"
      onClick={() => {
        onTogglePin();
        if (onClose) onClose();
      }}
      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
        isPinned
          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
          : "bg-surface-800 border-border/40 text-text-muted hover:text-amber-400 hover:bg-white/5"
      }`}
      title={isPinned ? "Unpin Message" : "Pin Message"}
    >
      <Pin className={`w-4 h-4 ${isPinned ? "fill-amber-400 text-amber-400" : ""}`} />
    </button>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop covering the entire viewport */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-surface-950/60 backdrop-blur-xs pointer-events-auto cursor-pointer animate-fade-in"
      />
      {/* Centered Floating Reaction Bar */}
      <div
        style={{ maxWidth: "min(400px, 92vw)" }}
        className="reaction-picker-container fixed left-1/2 bottom-12 md:bottom-20 -translate-x-1/2 pointer-events-auto flex items-center justify-between gap-1 bg-surface-900 border border-border/80 rounded-2xl px-2.5 py-1.5 shadow-2xl animate-fade-in-up max-w-[92vw] overflow-x-auto scrollbar-none"
      >
        <div className="flex items-center gap-1">
          {emojiButtons}
        </div>
        <div className="flex items-center gap-1 border-l border-border/60 pl-1.5 ml-0.5">
          {plusButton}
          {pinButton}
        </div>
      </div>
    </div>
  );
}
