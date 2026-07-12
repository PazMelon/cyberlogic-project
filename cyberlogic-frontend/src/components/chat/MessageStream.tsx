import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Hash, ArrowDown } from "lucide-react";
import { SkeletonCircle, SkeletonLine } from "../Skeleton";
import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "./MessageBubble";

export interface TypingUser {
  userId: number;
  name: string;
  firstName: string;
  avatar: string;
}

export interface MessageStreamProps {
  messages: ChatMessage[];
  messagesLoading: boolean;
  typingUsers: TypingUser[];
  currentUserId?: number;
  activeChannelName?: string;
  onReact: (messageId: number, emoji: string) => void;
  activePickerId: number | null;
  setActivePickerId: (id: number | null) => void;
  onOpenFullPicker: (messageId: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onReply?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  onEdit?: (messageId: number, newContent: string) => void;
  readReceipts?: { user_id: number; name: string; avatar: string | null; message_id: number }[];
  onToast?: (msg: string) => void;
  onJumpToMessage?: (parentId: number) => void;
  onLoadNewer?: () => void;
  hasNewer?: boolean;
  isFetchingNewer?: boolean;
  jumpToId?: number | null;
  onJumpToIdCleared?: () => void;
  onJumpToPresent?: () => void;
}

export default function MessageStream({
  messages,
  messagesLoading,
  typingUsers,
  currentUserId,
  activeChannelName,
  onReact,
  activePickerId,
  setActivePickerId,
  onOpenFullPicker,
  onLoadMore,
  hasMore = false,
  isFetchingMore = false,
  onReply,
  onDelete,
  onEdit,
  readReceipts = [],
  onToast,
  onJumpToMessage,
  onLoadNewer,
  hasNewer = false,
  isFetchingNewer = false,
  jumpToId = null,
  onJumpToIdCleared,
  onJumpToPresent,
}: MessageStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFirstMessageIdRef = useRef<number | null>(null);
  const lastLastMessageIdRef = useRef<number | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const lastChannelRef = useRef<string>("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Scroll position stabilizer
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];

    // Priority Case: Jump to a specific message ID
    if (jumpToId !== null && messages.some((m) => m.id === jumpToId)) {
      const targetEl = container.querySelector(`#message-${jumpToId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ block: "center" });
        onJumpToIdCleared?.();
        
        lastFirstMessageIdRef.current = firstMsg?.id || null;
        lastLastMessageIdRef.current = lastMsg?.id || null;
        prevScrollHeightRef.current = container.scrollHeight;
        return;
      }
    }

    // Case 1: Channel changed or initial load (no previous message IDs tracked yet)
    if (lastFirstMessageIdRef.current === null || (lastFirstMessageIdRef.current !== firstMsg?.id && lastLastMessageIdRef.current !== lastMsg?.id)) {
      container.scrollTop = container.scrollHeight;
    }
    // Case 2: Historical messages prepended (first ID changed, but last ID stayed the same)
    else if (firstMsg && lastMsg && lastFirstMessageIdRef.current !== firstMsg.id && lastLastMessageIdRef.current === lastMsg.id) {
      const scrollHeightDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = scrollHeightDiff;
    }
    // Case 3: New message added to bottom
    else if (lastMsg && lastLastMessageIdRef.current !== lastMsg.id) {
      const isSentByMe = currentUserId && Number(lastMsg.authorId) === Number(currentUserId);
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      if (isSentByMe || isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }

    lastFirstMessageIdRef.current = firstMsg?.id || null;
    lastLastMessageIdRef.current = lastMsg?.id || null;
    prevScrollHeightRef.current = container.scrollHeight;
  }, [messages, messagesLoading, jumpToId]);

  // Scroll to bottom on initial load complete or active channel change
  useEffect(() => {
    if (!activeChannelName) return;

    if (activeChannelName !== lastChannelRef.current || messagesLoading) {
      if (!messagesLoading && messages.length > 0 && !hasNewer) {
        lastChannelRef.current = activeChannelName;
        const timer = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 60);
        return () => clearTimeout(timer);
      }
    }
  }, [messagesLoading, messages.length, activeChannelName, hasNewer]);

  // Handle scrolling to load older/newer messages
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Scroll near top: load older messages
    if (onLoadMore && hasMore && !messagesLoading && !isFetchingMore) {
      if (container.scrollTop < 50) {
        prevScrollHeightRef.current = container.scrollHeight;
        onLoadMore();
      }
    }

    // Scroll near bottom: load newer messages
    if (onLoadNewer && hasNewer && !isFetchingNewer) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        onLoadNewer();
      }
    }

    // Show Jump to bottom button if scrolled up from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottom(distanceFromBottom > 400);
  };

  const handleScrollToBottom = () => {
    if (hasNewer && onJumpToPresent) {
      onJumpToPresent();
    } else if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="flex-1 relative flex flex-col min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4"
      >
        {isFetchingMore && (
          <div className="flex justify-center py-2 animate-fadeIn">
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        )}

        {messagesLoading ? (
          <div className="space-y-5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <SkeletonCircle className="w-9 h-9 bg-surface-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <SkeletonLine widthClass="w-24" heightClass="h-3.5" />
                    <SkeletonLine widthClass="w-12" heightClass="h-3" />
                  </div>
                  <SkeletonLine widthClass={i % 2 === 0 ? "w-3/4" : "w-1/2"} heightClass="h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm gap-2">
            <Hash className="w-8 h-8 opacity-30" />
            <p>Welcome to #{activeChannelName || ""}. This is the start of the message history.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={!!msg.isMe || msg.authorId === currentUserId}
              onReact={onReact}
              activePickerId={activePickerId}
              setActivePickerId={setActivePickerId}
              onOpenFullPicker={onOpenFullPicker}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              readReceipts={readReceipts}
              onToast={onToast}
              onJumpToMessage={onJumpToMessage}
            />
          ))
        )}

        {isFetchingNewer && (
          <div className="flex justify-center py-2 animate-fadeIn">
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-text-muted px-2 py-1 select-none animate-pulse">
            {typingUsers.length === 1 ? (
              <img
                src={typingUsers[0].avatar}
                alt={typingUsers[0].name}
                className="w-5 h-5 rounded-full object-cover bg-surface-700 animate-pulse border border-border"
              />
            ) : (
              <div className="flex -space-x-2 overflow-hidden">
                {typingUsers.map((u) => (
                  <img
                    key={u.userId}
                    src={u.avatar}
                    alt={u.name}
                    className="inline-block h-5 w-5 rounded-full ring-2 ring-surface-950 object-cover bg-surface-700"
                  />
                ))}
              </div>
            )}
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].firstName} is typing`
                : typingUsers.length === 2
                ? `${typingUsers[0].firstName} and ${typingUsers[1].firstName} are typing`
                : `${typingUsers.map((u) => u.firstName).join(", ")} and more are typing`}
            </span>
            <span className="flex gap-0.5 items-center ml-0.5 h-3">
              <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce" />
            </span>
          </div>
        )}
      </div>

      {showScrollBottom && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-6 right-6 p-2.5 rounded-full bg-primary/95 text-white shadow-xl hover:bg-primary hover:scale-105 active:scale-95 transition-all duration-200 border border-primary/20 z-30 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider pl-4 pr-3.5 cursor-pointer animate-fadeIn"
        >
          <span>{hasNewer ? "Jump to present" : "Jump to bottom"}</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      )}
    </div>
  );
}
