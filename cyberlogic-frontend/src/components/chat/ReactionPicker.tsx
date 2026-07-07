const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export interface ReactionPickerProps {
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
    reacted: boolean;
  }[];
  onReact: (emoji: string) => void;
  onOpenFullPicker: () => void;
  align: "left" | "right";
}

export default function ReactionPicker({
  reactions,
  onReact,
  onOpenFullPicker,
  align,
}: ReactionPickerProps) {
  return (
    <div
      className={`absolute bottom-full mb-1 z-20 flex items-center gap-1 bg-surface-900/95 border border-border backdrop-blur-md rounded-full px-2.5 py-1 shadow-xl animate-fade-in-up ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {QUICK_EMOJIS.map((emoji) => {
        const existingReaction = reactions?.find((r) => r.emoji === emoji);
        const isReacted = existingReaction ? existingReaction.reacted : false;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-all text-sm cursor-pointer ${
              isReacted ? "bg-primary/20 ring-1 ring-primary/40" : ""
            }`}
          >
            {emoji}
          </button>
        );
      })}
      
      <button
        type="button"
        onClick={onOpenFullPicker}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 text-text-muted hover:text-text-primary transition-all text-xs cursor-pointer font-bold border border-border/40"
        title="More emojis"
      >
        +
      </button>
    </div>
  );
}
