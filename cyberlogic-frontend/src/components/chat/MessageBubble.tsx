import { useRef } from "react";
import { Smile, Info, CornerUpLeft } from "lucide-react";
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
  animate?: string;
  replyTo?: {
    id: number;
    author: string;
    content: string;
  } | null;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  onReact: (messageId: number, emoji: string) => void;
  activePickerId: number | null;
  setActivePickerId: (id: number | null) => void;
  onOpenFullPicker: (messageId: number) => void;
  onReply?: (msg: ChatMessage) => void;
}

export default function MessageBubble({
  message,
  isMe,
  onReact,
  activePickerId,
  setActivePickerId,
  onOpenFullPicker,
  onReply,
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

  const handleScrollToMessage = (parentId: number) => {
    const el = document.getElementById(`message-${parentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950", "rounded-2xl", "duration-500");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950");
      }, 2000);
    }
  };

  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const imageExtensions = /\.(gif|jpe?g|png|webp|svg)/i;
    const mentionRegex = /(@[A-Za-z0-9._\s]+?)(?=\s|[.,!?;:]|$)/g;

    const imagesToRender: string[] = [];

    const renderedParts = parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const cleanUrl = part.trim();
        // Check if image link
        if (
          cleanUrl.match(imageExtensions) ||
          cleanUrl.includes("giphy.com/media/") ||
          cleanUrl.includes("giphy.com/gifs/") ||
          cleanUrl.includes("tenor.com/view/")
        ) {
          imagesToRender.push(cleanUrl);
        }
        return (
          <a
            key={index}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all inline-block"
          >
            {cleanUrl}
          </a>
        );
      }

      // Parse Mentions in non-URL segments
      const textParts = part.split(mentionRegex);
      return textParts.map((tPart, tIdx) => {
        if (tPart.startsWith("@")) {
          return (
            <span
              key={`${index}-${tIdx}`}
              className="bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-md text-xs select-none inline-block align-middle"
            >
              {tPart}
            </span>
          );
        }
        return tPart;
      });
    });

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap">
          {renderedParts}
        </p>

        {imagesToRender.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1.5 max-w-sm rounded-xl overflow-hidden border border-border bg-surface-950">
            {imagesToRender.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt="Inline Shared Media"
                className="max-h-60 object-contain w-full hover:scale-101 transition-transform cursor-pointer"
                onClick={() => window.open(imgUrl, "_blank")}
                onError={(e) => {
                  // Hide error icon if url fails
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const contentContainer = (
    <div className="relative group/message flex flex-col w-fit max-w-[70%]">
      {/* Desktop hover controls: Smile picker trigger & Reply button */}
      <div
        className={`absolute bottom-0 translate-y-1/4 hidden md:group-hover/message:flex items-center gap-1 z-10 ${
          isMe ? "right-full pr-2 -mr-0.5" : "left-full pl-2 -ml-0.5"
        }`}
      >
        <button
          type="button"
          onClick={() => setActivePickerId(showReactionTrigger ? null : message.id)}
          className="p-1.5 rounded-full bg-surface-800 border border-border text-text-muted hover:text-text-primary hover:border-primary/50 transition-colors shadow-md cursor-pointer"
          title="React to message"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1.5 rounded-full bg-surface-800 border border-border text-text-muted hover:text-text-primary hover:border-primary/50 transition-colors shadow-md cursor-pointer"
            title="Reply to message"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        )}
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

      {/* Reply Quote Display */}
      {message.replyTo && (
        <div
          onClick={() => handleScrollToMessage(message.replyTo!.id)}
          className={`flex items-start gap-2 text-xs text-text-secondary mb-1.5 px-3 py-1.5 rounded-xl bg-surface-800 border border-border/50 hover:text-text-primary hover:border-primary/50 cursor-pointer transition-all max-w-[85%] ${
            isMe ? "self-end origin-bottom-right" : "self-start origin-bottom-left"
          }`}
        >
          <CornerUpLeft className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-primary flex-shrink-0">@{message.replyTo.author}</span>
            <span className="opacity-90 break-words whitespace-pre-wrap">{message.replyTo.content}</span>
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
          {!isMe && <span className="text-xs font-semibold text-text-primary">{message.author}</span>}
          <span className="text-[10px] text-text-muted">{message.timestamp}</span>
          {isMe && <span className="text-xs font-semibold text-primary">{message.author}</span>}
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`border rounded-2xl px-3.5 py-2 relative transition-all w-fit ${
            isMe
              ? "bg-primary/15 border-primary/30 rounded-tr-none"
              : "bg-white/[0.03] border-border/40 rounded-tl-none"
          }`}
        >
          {renderMessageContent(message.content)}

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
    <div
      id={`message-${message.id}`}
      className={`flex items-start gap-3 p-1 transition-all duration-300 ${
        isMe ? "justify-end" : "justify-start"
      } ${message.animate || ""}`}
    >
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
