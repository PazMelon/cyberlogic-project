
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
}

export default function ReactionPicker({
  reactions,
  onReact,
  onOpenFullPicker,
  onClose,
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
        className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-all text-xl cursor-pointer ${
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
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-800 border border-border/40 hover:bg-white/5 active:scale-125 text-text-muted hover:text-text-primary transition-all text-lg cursor-pointer font-bold"
      title="More emojis"
    >
      +
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop covering the entire viewport */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-surface-950/60 backdrop-blur-xs pointer-events-auto cursor-pointer animate-fade-in"
      />
      {/* Centered Floating Reaction Bar */}
      <div 
        style={{ width: "max-content", maxWidth: "95vw" }}
        className="reaction-picker-container fixed left-1/2 bottom-12 md:bottom-20 -translate-x-1/2 pointer-events-auto flex items-center justify-between gap-1 bg-surface-900 border border-border/80 rounded-2xl px-3 py-2 shadow-2xl animate-fade-in-up"
      >
        <div className="flex items-center gap-1">
          {emojiButtons}
        </div>
        {plusButton}
      </div>
    </div>
  );
}
