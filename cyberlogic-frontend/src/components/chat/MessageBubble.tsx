import { useRef } from "react";
import { Smile, Info } from "lucide-react";
import ReactionPicker from "./ReactionPicker";

export interface ChatMessage {
  id: number;
  channelId: string;
  author: string;
  authorAvatar: string;
  authorId: number;
  content: string;
  timestamp: string;
  isSystem?: boolean;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
    reacted: boolean;
    userIds?: number[];
  }[];
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  onReact: (messageId: number, emoji: string) => void;
  activePickerId: number | null;
  setActivePickerId: (id: number | null) => void;
  onOpenFullPicker: (messageId: number) => void;
}

export default function MessageBubble({
  message,
  isMe,
  onReact,
  activePickerId,
  setActivePickerId,
  onOpenFullPicker,
}: MessageBubbleProps) {
  const touchTimerRef = useRef<any>(null);
  const isTouchMoved = useRef(false);

  if (message.isSystem) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-800/50 my-2 max-w-md mx-auto">
        <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span>{message.content}</span>
      </div>
    );
  }

  const showReactionTrigger = activePickerId === message.id;

  // Mobile long press gestures
  const handleTouchStart = () => {
    isTouchMoved.current = false;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      if (!isTouchMoved.current) {
        setActivePickerId(message.id);
      }
    }, 500);
  };

  const handleTouchMove = () => {
    isTouchMoved.current = true;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const handleReactionClick = (emoji: string) => {
    onReact(message.id, emoji);
  };

  const contentContainer = (
    <div className="relative group/message flex flex-col min-w-[120px] max-w-[70%]">
      {/* Desktop hover Smile picker trigger placed in the bottom left relative to message bubble row */}
      {/* We use a negative margin / overlay container to bridge hover space so it doesn't disappear when moving the cursor */}
      <div className={`absolute bottom-0 translate-y-1/4 hidden md:group-hover/message:flex items-center z-10 ${
        isMe ? "right-full pr-1.5 -mr-0.5" : "left-full pl-1.5 -ml-0.5"
      }`}>
        <button
          type="button"
          onClick={() => setActivePickerId(showReactionTrigger ? null : message.id)}
          className="p-1.5 rounded-full bg-surface-800 border border-border text-text-muted hover:text-text-primary hover:border-primary/50 transition-colors shadow-md cursor-pointer"
          title="React to message"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Reaction Bar popover */}
      {showReactionTrigger && (
        <ReactionPicker
          reactions={message.reactions}
          onReact={handleReactionClick}
          onOpenFullPicker={() => onOpenFullPicker(message.id)}
          align={isMe ? "right" : "left"}
        />
      )}

      <div className="flex flex-col">
        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
          {!isMe && <span className="text-xs font-semibold text-text-primary">{message.author}</span>}
          <span className="text-[10px] text-text-muted">{message.timestamp}</span>
          {isMe && <span className="text-xs font-semibold text-primary">{message.author}</span>}
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`border rounded-2xl px-3.5 py-2 relative transition-all ${
            isMe
              ? "bg-primary/15 border-primary/30 rounded-tr-none"
              : "bg-white/[0.03] border-border/40 rounded-tl-none"
          }`}
        >
          <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Facebook-style reaction badges overlay placed on the bottom corner edge of the message bubble */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute bottom-[-10px] flex items-center gap-0.5 bg-surface-900 border border-border/50 rounded-full px-1.5 py-0.5 shadow-md z-10 transition-all ${
              isMe ? "left-3" : "right-3"
            }`}>
              {[...message.reactions]
                .sort((a, b) => (b.reacted ? 1 : 0) - (a.reacted ? 1 : 0))
                .slice(0, 3)
                .map((reaction) => (
                  <span key={reaction.emoji} className="text-xs select-none">
                    {reaction.emoji}
                  </span>
                ))}
              <span className="text-[9px] font-bold text-text-muted px-0.5 select-none">
                {message.reactions.reduce((sum, r) => sum + r.count, 0)}
              </span>
            </div>
          )}
        </div>

        {/* Aggregate reaction lists pills underneath the message row (still keeping clickable pills for details) */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-3 ${isMe ? "justify-end" : "justify-start"}`}>
            {message.reactions.map((reaction) => (
              <div key={reaction.emoji} className="group/pill relative">
                <button
                  type="button"
                  onClick={() => handleReactionClick(reaction.emoji)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                    reaction.reacted
                      ? "bg-primary/15 border-primary/40 text-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-surface-800 border-border text-text-muted hover:text-text-primary hover:bg-surface-700"
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>

                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface-900 border border-border text-[9px] text-text-secondary rounded-lg px-2 py-1 shadow-md opacity-0 pointer-events-none group-hover/pill:opacity-100 transition-opacity whitespace-nowrap z-30">
                  {reaction.users.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex items-start gap-3 p-1 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
        <img
          src={message.authorAvatar}
          alt={message.author}
          className="w-8 h-8 rounded-full bg-surface-700 object-cover flex-shrink-0 border border-border mt-5"
        />
      )}
      {contentContainer}
      {isMe && (
        <img
          src={message.authorAvatar}
          alt={message.author}
          className="w-8 h-8 rounded-full bg-surface-700 object-cover flex-shrink-0 border border-primary/30 mt-5"
        />
      )}
    </div>
  );
}
