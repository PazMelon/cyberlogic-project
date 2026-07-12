import { useRef, useState } from "react";
import { Link } from "react-router";
import { Smile, Info, CornerUpLeft, Trash2, ShieldAlert, Pencil } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ReactionPicker from "./ReactionPicker";
import { PromptDialog } from "../ui";

export interface ChatMessage {
  id: number;
  channelId: string;
  author: string;
  authorAvatar: string;
  authorId: number;
  authorUsername?: string | null;
  content: string;
  timestamp: string;
  isSystem?: boolean;
  isDeleted?: boolean;
  isMe?: boolean;
  deletionReason?: string | null;
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
    authorUsername?: string | null;
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
  onDelete?: (msg: ChatMessage) => void;
  onEdit?: (messageId: number, newContent: string) => void;
  readReceipts?: { user_id: number; name: string; avatar: string | null; message_id: number }[];
  onToast?: (msg: string) => void;
  onJumpToMessage?: (parentId: number) => void;
}

const formatMessageTimestamp = (timestampStr: string) => {
  if (!timestampStr) return "";
  try {
    const d = new Date(timestampStr);
    if (isNaN(d.getTime())) {
      return timestampStr;
    }
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    }
  } catch {
    return timestampStr;
  }
};

export default function MessageBubble({
  message,
  isMe,
  onReact,
  activePickerId,
  setActivePickerId,
  onOpenFullPicker,
  onReply,
  onDelete,
  onEdit,
  readReceipts = [],
  onToast,
  onJumpToMessage,
}: MessageBubbleProps) {
  const touchTimerRef = useRef<any>(null);
  const isTouchMoved = useRef(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);

  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const seenUsers = readReceipts.filter(
    (r) => r.message_id === message.id && (user ? Number(r.user_id) !== Number(user.id) : true)
  );

  const isFreedomWall = message.channelId === 'freedom-wall';
  const isMeLayout = isMe && !isFreedomWall;

  if (message.isSystem) {
    return (
      <div className="flex flex-col items-center justify-center my-2 space-y-1">
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-800/50 max-w-md mx-auto">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>{message.content}</span>
        </div>
        {message.timestamp && !isFreedomWall && (
          <span className="text-[9px] text-text-muted/40 font-medium">
            {formatMessageTimestamp(message.timestamp)}
          </span>
        )}
      </div>
    );
  }

  // Render moderation-deleted messages with distinct style
  if (message.isDeleted) {
    return (
      <div
        id={`message-${message.id}`}
        className={`flex items-start gap-3 p-1 ${isMeLayout ? "justify-end" : "justify-start"}`}
      >
        {!isMeLayout && (
          isFreedomWall ? (
            <div className="flex-shrink-0 mt-5">
              <img
                src={message.authorAvatar}
                alt={message.author}
                className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-border opacity-50"
              />
            </div>
          ) : (
            <Link to={message.authorUsername ? `/app/u/${message.authorUsername}` : `/app/profile/${message.authorId}`} className="hover:opacity-85 transition-opacity flex-shrink-0 mt-5">
              <img
                src={message.authorAvatar}
                alt={message.author}
                className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-border opacity-50"
              />
            </Link>
          )
        )}
        <div className="flex flex-col w-fit max-w-[70%]">
          <div className={`flex items-baseline gap-2 mb-1 ${isMeLayout ? "justify-end" : "justify-start"}`}>
            <span className="text-xs font-semibold text-text-muted/60">{message.author}</span>
            {!isFreedomWall && (
              <span className="text-[10px] text-text-muted/40">{formatMessageTimestamp(message.timestamp)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-error/5 border border-error/15">
            <ShieldAlert className="w-3.5 h-3.5 text-error/50 flex-shrink-0" />
            <span className="text-xs text-text-muted italic">{message.content}</span>
          </div>
        </div>
        {isMeLayout && (
          <Link to={message.authorUsername ? `/app/u/${message.authorUsername}` : `/app/profile/${message.authorId}`} className="hover:opacity-85 transition-opacity flex-shrink-0 mt-5">
            <img
              src={message.authorAvatar}
              alt={message.author}
              className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-primary/20 opacity-50"
            />
          </Link>
        )}
      </div>
    );
  }

  const showReactionTrigger = activePickerId === message.id;

  // Touch handlers for combined Swipe-To-Reply and Long-Press Reactions
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchMoved.current = false;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isSwiping.current = true;

    if (bubbleRef.current) {
      bubbleRef.current.style.transition = "none";
    }

    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      if (!isTouchMoved.current && isSwiping.current) {
        setActivePickerId(message.id);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !isSwiping.current || !bubbleRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;

    // Detect if movement is mostly horizontal
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      isTouchMoved.current = true;
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    }

    if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      // Swiping horizontally, lock vertical scrolling
      if (e.cancelable) e.preventDefault();

      let translation = 0;
      if (isMeLayout) {
        // Outgoing: swipe left to reply (negative translation)
        translation = Math.min(0, Math.max(-75, diffX));
      } else {
        // Incoming: swipe right to reply (positive translation)
        translation = Math.max(0, Math.min(75, diffX));
      }

      bubbleRef.current.style.transform = `translateX(${translation}px)`;

      const indicator = document.getElementById(`reply-indicator-${message.id}`);
      if (indicator) {
        const progress = Math.min(1, Math.abs(translation) / 55);
        indicator.style.opacity = String(progress);
        indicator.style.transform = `translateY(-50%) scale(${0.75 + progress * 0.25})`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    if (!isSwiping.current || !bubbleRef.current) return;
    isSwiping.current = false;

    // Reset transition
    bubbleRef.current.style.transition = "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
    
    // Retrieve current transform
    const transformStr = bubbleRef.current.style.transform;
    const match = transformStr.match(/translateX\(([-\d.]+)px\)/);
    const translation = match ? parseFloat(match[1]) : 0;

    bubbleRef.current.style.transform = "translateX(0px)";

    const indicator = document.getElementById(`reply-indicator-${message.id}`);
    if (indicator) {
      indicator.style.opacity = "0";
      indicator.style.transform = "translateY(-50%) scale(0.75)";
    }

    if (onReply && Math.abs(translation) >= 50) {
      onReply(message);
    }
  };

  // Mouse handlers for Desktop drag-to-reply gesture
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with main mouse button (left click)
    if (e.button !== 0 || !onReply) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isSwiping.current = true;

    if (bubbleRef.current) {
      bubbleRef.current.style.transition = "none";
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isSwiping.current || !bubbleRef.current) return;
      const diffX = moveEvent.clientX - startX.current;
      const diffY = moveEvent.clientY - startY.current;

      if (Math.abs(diffX) > Math.abs(diffY) * 1.2) {
        let translation = 0;
        if (isMeLayout) {
          translation = Math.min(0, Math.max(-75, diffX));
        } else {
          translation = Math.max(0, Math.min(75, diffX));
        }

        bubbleRef.current.style.transform = `translateX(${translation}px)`;

        const indicator = document.getElementById(`reply-indicator-${message.id}`);
        if (indicator) {
          const progress = Math.min(1, Math.abs(translation) / 55);
          indicator.style.opacity = String(progress);
          indicator.style.transform = `translateY(-50%) scale(${0.75 + progress * 0.25})`;
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      if (!isSwiping.current || !bubbleRef.current) return;
      isSwiping.current = false;

      bubbleRef.current.style.transition = "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
      
      const transformStr = bubbleRef.current.style.transform;
      const match = transformStr.match(/translateX\(([-\d.]+)px\)/);
      const translation = match ? parseFloat(match[1]) : 0;

      bubbleRef.current.style.transform = "translateX(0px)";

      const indicator = document.getElementById(`reply-indicator-${message.id}`);
      if (indicator) {
        indicator.style.opacity = "0";
        indicator.style.transform = "translateY(-50%) scale(0.75)";
      }

      if (Math.abs(translation) >= 50) {
        onReply(message);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleReactionClick = (emoji: string) => {
    onReact(message.id, emoji);
  };

  const handleScrollToMessage = (parentId: number) => {
    if (onJumpToMessage) {
      onJumpToMessage(parentId);
      return;
    }

    const el = document.getElementById(`message-${parentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950", "rounded-2xl", "duration-500");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950");
      }, 2000);
    } else {
      if (onToast) {
        onToast("This message was sent earlier. Load older messages above to view.");
      }
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
          return null; // Hide the raw URL link text since the image itself is rendered inline
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
              <div key={idx} className="relative bg-surface-900 min-h-[120px] max-h-60 flex items-center justify-center overflow-hidden animate-pulse">
                <img
                  src={imgUrl}
                  alt="Inline Shared Media"
                  loading="lazy"
                  decoding="async"
                  className="max-h-60 object-contain w-full hover:scale-101 transition-transform cursor-pointer opacity-0 transition-opacity duration-300"
                  onClick={() => window.open(imgUrl, "_blank")}
                  onLoad={(e) => {
                    e.currentTarget.classList.remove("opacity-0");
                    e.currentTarget.parentElement?.classList.remove("animate-pulse");
                  }}
                  onError={(e) => {
                    // Hide error icon and container if url fails
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) parent.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const contentContainer = (
    <div
      ref={bubbleRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ willChange: "transform", transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      className="relative group/message flex flex-col w-fit max-w-[70%] select-none cursor-grab active:cursor-grabbing"
    >
      {/* Desktop hover controls: Smile picker trigger & Reply button */}
      <div
        className={`absolute bottom-0 translate-y-1/4 hidden md:group-hover/message:flex items-center gap-1 z-10 ${
          isMeLayout ? "right-full pr-2 -mr-0.5" : "left-full pl-2 -ml-0.5"
        }`}
      >
        <button
          type="button"
          onClick={() => setActivePickerId(showReactionTrigger ? null : message.id)}
          className="reaction-trigger-btn p-1.5 rounded-full bg-surface-800 border border-border text-text-muted hover:text-text-primary hover:border-primary/50 transition-colors shadow-md cursor-pointer"
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
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message)}
            className="p-1.5 rounded-full bg-surface-800 border border-border text-text-muted hover:text-error hover:border-error/50 transition-colors shadow-md cursor-pointer"
            title="Delete message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-full bg-surface-800 border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-colors shadow-md cursor-pointer"
            title="Edit message"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Reaction Bar popover */}
      {showReactionTrigger && (
        <ReactionPicker
          reactions={message.reactions}
          onReact={handleReactionClick}
          onOpenFullPicker={() => onOpenFullPicker(message.id)}
          onClose={() => setActivePickerId(null)}
        />
      )}

      {/* Reply Quote Display */}
      {message.replyTo && (() => {
        const imageExtensions = /\.(gif|jpe?g|png|webp|svg)/i;
        const cleanUrl = message.replyTo.content.trim();
        const isImage = cleanUrl.match(/(https?:\/\/[^\s]+)/g) && (
          cleanUrl.match(imageExtensions) ||
          cleanUrl.includes("giphy.com/media/") ||
          cleanUrl.includes("giphy.com/gifs/") ||
          cleanUrl.includes("tenor.com/view/")
        );

        return (
          <div
            onClick={() => handleScrollToMessage(message.replyTo!.id)}
            className={`flex flex-col gap-1 text-xs text-text-secondary mb-1.5 px-3 py-1.5 rounded-xl bg-surface-800 border border-border/50 hover:text-text-primary hover:border-primary/50 cursor-pointer transition-all max-w-[85%] ${
              isMeLayout ? "self-end origin-bottom-right" : "self-start origin-bottom-left"
            }`}
          >
            <div className="min-w-0">
              {isImage ? (
                <div className="relative bg-surface-900 min-h-[40px] max-h-20 max-w-[120px] rounded-lg overflow-hidden flex items-center justify-center animate-pulse">
                  <img
                    src={cleanUrl}
                    alt="Replied Image"
                    loading="lazy"
                    decoding="async"
                    className="max-h-20 max-w-[120px] object-contain border border-border/30 opacity-0 transition-opacity duration-300"
                    onLoad={(e) => {
                      e.currentTarget.classList.remove("opacity-0");
                      e.currentTarget.parentElement?.classList.remove("animate-pulse");
                    }}
                    onError={(e) => {
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) parent.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <span className="opacity-90 break-words whitespace-pre-wrap">{message.replyTo.content}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5">
              <CornerUpLeft className="w-3 h-3 text-primary flex-shrink-0" />
              {message.replyTo.authorUsername && !isFreedomWall ? (
                <Link to={`/app/u/${message.replyTo.authorUsername}`} className="font-bold text-primary hover:underline">
                  @{message.replyTo.author}
                </Link>
              ) : (
                <span className="font-bold text-primary">@{message.replyTo.author}</span>
              )}
            </div>
          </div>
        );
      })()}

      <div className={`flex flex-col ${isMeLayout ? "items-end" : "items-start"}`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isMeLayout ? "justify-end" : "justify-start"}`}>
          {!isMeLayout && (
            isFreedomWall ? (
              <span className="text-xs font-semibold text-text-primary select-none">
                {message.author}
              </span>
            ) : (
              <Link
                to={message.authorUsername ? `/app/u/${message.authorUsername}` : `/app/profile/${message.authorId}`}
                className="text-xs font-semibold text-text-primary hover:text-primary transition-colors select-none"
              >
                {message.author}
              </Link>
            )
          )}
          {!isFreedomWall && (
            <span className="text-[10px] text-text-muted select-none">{formatMessageTimestamp(message.timestamp)}</span>
          )}
          {isMeLayout && (
            <Link
              to={message.authorUsername ? `/app/u/${message.authorUsername}` : `/app/profile/${message.authorId}`}
              className="text-xs font-semibold text-primary hover:text-primary transition-colors select-none"
            >
              {message.author}
            </Link>
          )}
        </div>

        <div
          className={`border rounded-2xl px-3.5 py-2 relative transition-all w-fit ${
            isMeLayout
              ? "bg-primary/15 border-primary/30 rounded-tr-none"
              : "bg-white/[0.03] border-border/40 rounded-tl-none"
          }`}
        >
          {renderMessageContent(message.content)}

          {/* Facebook-style reaction badges overlay placed on the bottom corner edge of the message bubble */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute bottom-[-10px] flex items-center gap-0.5 bg-surface-900 border border-border/50 rounded-full px-1.5 py-0.5 shadow-md z-10 transition-all ${
              isMeLayout ? "left-3" : "right-3"
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
          <div className={`flex flex-wrap gap-1 mt-3 ${isMeLayout ? "justify-end" : "justify-start"}`}>
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

                <div className={`absolute bottom-full mb-1 bg-surface-900 border border-border text-[9px] text-text-secondary rounded-lg px-2 py-1 shadow-md opacity-0 pointer-events-none group-hover/pill:opacity-100 transition-opacity whitespace-nowrap z-30 ${
                  isMeLayout ? "right-0" : "left-0"
                }`}>
                  {reaction.users.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seen Indicators */}
        {seenUsers.length > 0 && (
          <div className={`flex items-center gap-1 mt-1.5 ${isMeLayout ? "justify-end" : "justify-start"}`}>
            <div className="flex -space-x-1 overflow-hidden items-center">
              {seenUsers.slice(0, 10).map((u) => (
                <img
                  key={u.user_id}
                  src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.name}`}
                  alt={u.name}
                  title={`Seen by ${u.name}`}
                  className="h-4 w-4 rounded-full ring-1 ring-surface-950 object-cover bg-surface-800"
                />
              ))}
              {seenUsers.length > 10 && (
                <span 
                  title={seenUsers.slice(10).map(u => u.name).join(", ")}
                  className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-surface-800 border border-border/40 text-[8px] font-bold text-text-secondary select-none ml-1 ring-1 ring-surface-950"
                >
                  +{seenUsers.length - 10}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      id={`message-container-${message.id}`}
      className="relative overflow-visible w-full"
    >
      {onReply && (
        <div
          id={`reply-indicator-${message.id}`}
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/30 text-primary transition-all scale-75 opacity-0 pointer-events-none z-0 ${
            isMeLayout ? "right-16" : "left-16"
          }`}
          style={{ transform: "translateY(-50%) scale(0.75)" }}
        >
          <CornerUpLeft className="w-4 h-4" />
        </div>
      )}
      <div
        id={`message-${message.id}`}
        className={`flex items-start gap-3 p-1 transition-all duration-300 ${
          isMeLayout ? "justify-end" : "justify-start"
        } ${message.animate || ""}`}
      >
        {!isMeLayout && (
          isFreedomWall ? (
            <div className="flex-shrink-0 mt-5">
              <img
                src={message.authorAvatar}
                alt={message.author}
                className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-border"
              />
            </div>
          ) : (
            <Link to={message.authorUsername ? `/app/u/${message.authorUsername}` : `/app/profile/${message.authorId}`} className="hover:opacity-85 transition-opacity flex-shrink-0 mt-5">
              <img
                src={message.authorAvatar}
                alt={message.author}
                className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-border"
              />
            </Link>
          )
        )}
        {contentContainer}
        {isMeLayout && (
          <Link to={message.authorUsername ? `/app/u/${message.authorUsername}` : `/app/profile/${message.authorId}`} className="hover:opacity-85 transition-opacity flex-shrink-0 mt-5">
            <img
              src={message.authorAvatar}
              alt={message.author}
              className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-primary/30"
            />
          </Link>
        )}
      </div>
      {onEdit && (
        <PromptDialog
          isOpen={isEditing}
          title="Edit Message"
          message="Modify your message content below:"
          defaultValue={message.content}
          confirmText="Save Changes"
          onConfirm={(newText) => {
            if (newText.trim() && newText.trim() !== message.content) {
              onEdit(message.id, newText.trim());
            }
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
