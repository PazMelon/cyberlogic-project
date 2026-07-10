import { useEffect, useState } from "react";

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
  onClose?: () => void;
}

export default function ReactionPicker({
  reactions,
  onReact,
  onOpenFullPicker,
  align,
  onClose,
}: ReactionPickerProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <>
        {/* Backdrop for mobile/tablet */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-xs z-40 animate-fade-in"
        />
        {/* Centered Floating Menu for mobile/tablet */}
        <div
          className="fixed left-1/2 bottom-12 -translate-x-1/2 z-50 flex items-center justify-between gap-2.5 bg-surface-900 border border-border/80 rounded-2xl px-4 py-3 shadow-2xl animate-fade-in-up w-[90%] max-w-sm"
        >
          <div className="flex items-center gap-2">
            {QUICK_EMOJIS.map((emoji) => {
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
            })}
          </div>
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
        </div>
      </>
    );
  }

  // Desktop layout (absolute to the message bubble)
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
            onClick={() => {
              onReact(emoji);
              if (onClose) onClose();
            }}
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
        onClick={() => {
          onOpenFullPicker();
          if (onClose) onClose();
        }}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 text-text-muted hover:text-text-primary transition-all text-xs cursor-pointer font-bold border border-border/40"
        title="More emojis"
      >
        +
      </button>
    </div>
  );
}
