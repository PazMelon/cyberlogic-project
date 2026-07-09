import { useLayoutEffect, useRef } from "react";
import { Hash } from "lucide-react";
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
}: MessageStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFirstMessageIdRef = useRef<number | null>(null);
  const lastLastMessageIdRef = useRef<number | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // Scroll position stabilizer
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];

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
      // Only scroll to bottom if user was already near the bottom (within 250px)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }

    lastFirstMessageIdRef.current = firstMsg?.id || null;
    lastLastMessageIdRef.current = lastMsg?.id || null;
    prevScrollHeightRef.current = container.scrollHeight;
  }, [messages, messagesLoading]);

  // Handle scrolling to the top to load more older messages
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || !onLoadMore || !hasMore || messagesLoading || isFetchingMore) return;

    if (container.scrollTop < 50) {
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
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
            isMe={msg.authorId === currentUserId}
            onReact={onReact}
            activePickerId={activePickerId}
            setActivePickerId={setActivePickerId}
            onOpenFullPicker={onOpenFullPicker}
            onReply={onReply}
          />
        ))
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
  );
}
