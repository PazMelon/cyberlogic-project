import { useState, useRef, useEffect } from "react";
import { Hash, Send, Smile, Paperclip, Users, Info } from "lucide-react";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";
import { useWebSocket } from "../context/WebSocketContext";
import { apiRequest, useAuth } from "../context/AuthContext";

interface ChatChannel {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: string;
  allowed_roles?: string[] | null;
  write_roles?: string[] | null;
  is_archived?: boolean;
}

interface ChatMessage {
  id: number;
  channelId: string;
  author: string;
  authorAvatar: string;
  authorId: number;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

interface TypingUser {
  userId: number;
  name: string;
  firstName: string;
  avatar: string;
}

export default function Chat() {
  const { subscribe, sendMessage, onlineUsers, isConnected } = useWebSocket();
  const { user: currentUser } = useAuth();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Local user typing state refs
  const isLocalTypingRef = useRef(false);
  const lastLocalTypingTimeRef = useRef(0);
  const stopTypingTimerRef = useRef<any>(null);

  // Stale typing indicators timeouts map
  const typingTimeoutsRef = useRef<Map<number, any>>(new Map());

  const activeChannelData = channels.find((c) => c.slug === activeChannel);

  // Check write permissions for the current user
  const hasWritePermission = !activeChannelData || 
    !activeChannelData.write_roles || 
    !Array.isArray(activeChannelData.write_roles) || 
    (currentUser && activeChannelData.write_roles.includes(currentUser.role));

  // 1. Load channels on mount
  useEffect(() => {
    async function loadChannels() {
      try {
        setChannelsLoading(true);
        const res = await apiRequest("/api/chat/channels");
        if (res.ok) {
          const data: ChatChannel[] = await res.json();
          setChannels(data);
          if (data.length > 0) {
            setActiveChannel(data[0].slug);
          }
        }
      } catch (err) {
        console.error("Failed to load chat channels:", err);
      } finally {
        setChannelsLoading(false);
      }
    }
    loadChannels();
  }, []);

  // 2. Load message history and subscribe to realtime channel when active channel changes
  useEffect(() => {
    if (!activeChannel) return;

    // Reset typing indicators for the new channel
    setTypingUsers([]);
    typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    typingTimeoutsRef.current.clear();

    // Reset local typing state
    if (isLocalTypingRef.current) {
      isLocalTypingRef.current = false;
      sendMessage("typing", `chat:${activeChannel}`, { isTyping: false });
    }
    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = null;
    }

    // Load history
    async function loadHistory() {
      try {
        setMessagesLoading(true);
        const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages`);
        if (res.ok) {
          const data: ChatMessage[] = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setMessagesLoading(false);
      }
    }
    loadHistory();

    // Subscribe to WS channel
    const wsChannel = `chat:${activeChannel}`;
    const unsubscribe = subscribe(wsChannel, (payload: any, type: string) => {
      if (type === "message") {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      } else if (type === "typing") {
        const { userId, name, avatar, isTyping } = payload;

        // Clear existing cleanup timeout for this user if they are still typing
        if (typingTimeoutsRef.current.has(userId)) {
          clearTimeout(typingTimeoutsRef.current.get(userId));
          typingTimeoutsRef.current.delete(userId);
        }

        if (isTyping) {
          setTypingUsers((prev) => {
            if (prev.some((u) => u.userId === userId)) return prev;
            const firstName = payload.firstName || name.split(' ')[0];
            return [...prev, { userId, name, firstName, avatar }];
          });

          // Set a fallback pruning timeout to clear stuck typing indicators (e.g. on client network loss)
          const timeoutId = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
            typingTimeoutsRef.current.delete(userId);
          }, 4000);
          typingTimeoutsRef.current.set(userId, timeoutId);
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }
      }
    });

    return () => {
      // Clean up WS subscription
      unsubscribe();
      // Clean up timeouts
      typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      typingTimeoutsRef.current.clear();
    };
  }, [activeChannel, subscribe]);

  // 3. Scroll to bottom on load/new messages/typing indicators
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, messagesLoading, typingUsers]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (stopTypingTimerRef.current) {
        clearTimeout(stopTypingTimerRef.current);
      }
      typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);

    if (!activeChannel || !isConnected || !hasWritePermission) return;

    // Send typing state update to server
    const now = Date.now();
    if (!isLocalTypingRef.current || now - lastLocalTypingTimeRef.current > 1500) {
      isLocalTypingRef.current = true;
      lastLocalTypingTimeRef.current = now;
      sendMessage("typing", `chat:${activeChannel}`, { isTyping: true });
    }

    // Reset local typing inactivity timeout
    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
    }

    stopTypingTimerRef.current = setTimeout(() => {
      if (isLocalTypingRef.current) {
        isLocalTypingRef.current = false;
        sendMessage("typing", `chat:${activeChannel}`, { isTyping: false });
      }
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChannel || !hasWritePermission) return;

    // Send message via WebSocket
    sendMessage("message", `chat:${activeChannel}`, {
      content: messageText,
    });

    // Reset local typing timers immediately
    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = null;
    }
    if (isLocalTypingRef.current) {
      isLocalTypingRef.current = false;
      sendMessage("typing", `chat:${activeChannel}`, { isTyping: false });
    }

    setMessageText("");
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-950">
      {/* Channel Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border bg-surface-900/50 hidden sm:flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary font-[family-name:var(--font-heading)]">
            Channels
          </h2>
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-success" : "bg-error animate-pulse"}`} title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channelsLoading ? (
            <div className="space-y-3 p-2">
              <SkeletonLine widthClass="w-full" heightClass="h-7" />
              <SkeletonLine widthClass="w-full" heightClass="h-7" />
              <SkeletonLine widthClass="w-full" heightClass="h-7" />
            </div>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.slug)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeChannel === ch.slug
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <Hash className="w-4 h-4 flex-shrink-0 opacity-60" />
                <span className="truncate flex-1 text-left">{ch.name}</span>
              </button>
            ))
          )}
        </div>

        {/* Online Members Preview */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="font-medium text-text-primary">{onlineUsers.length} online</span>
          </div>
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 5).map((m) => (
              <img
                key={m.id}
                src={m.avatar}
                alt={m.name}
                className="w-7 h-7 rounded-full border-2 border-surface-900 bg-surface-700 object-cover"
                title={m.name}
              />
            ))}
            {onlineUsers.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-surface-900 bg-surface-700 flex items-center justify-center text-[10px] text-text-muted font-bold">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-surface-900/30 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="w-5 h-5 text-text-muted flex-shrink-0" />
            <h3 className="text-sm font-semibold text-text-primary truncate">{activeChannelData?.name || "Loading..."}</h3>
            <span className="hidden md:inline text-xs text-text-muted">—</span>
            <span className="hidden md:inline text-xs text-text-muted truncate">
              {activeChannelData?.description}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${
                showMembers ? "text-primary bg-primary/10" : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
              aria-label="Toggle members"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Channel info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages + Optional Members Panel */}
        <div className="flex-1 flex min-h-0">
          {/* Message Stream */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
          >
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
                <p>Welcome to #{activeChannelData?.name || ""}. This is the start of the message history.</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex items-center justify-center gap-2 text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-800/50 my-2 max-w-md mx-auto">
                      <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{msg.content}</span>
                    </div>
                  );
                }

                const isMe = msg.authorId === currentUser?.id;

                if (isMe) {
                  return (
                    <div key={msg.id} className="flex items-start justify-end gap-3 p-1">
                      <div className="flex flex-col items-end max-w-[70%] min-w-0">
                        <div className="flex items-baseline gap-2 mb-1 justify-end">
                          <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
                          <span className="text-xs font-semibold text-primary">{msg.author}</span>
                        </div>
                        <div className="bg-primary/15 border border-primary/30 rounded-2xl rounded-tr-none px-3.5 py-2">
                          <p className="text-sm text-text-primary leading-relaxed break-words whitespace-pre-wrap text-left">{msg.content}</p>
                        </div>
                      </div>
                      <img
                        src={msg.authorAvatar}
                        alt={msg.author}
                        className="w-8 h-8 rounded-full bg-surface-700 object-cover flex-shrink-0 border border-primary/30 mt-5"
                      />
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start justify-start gap-3 p-1">
                    <img
                      src={msg.authorAvatar}
                      alt={msg.author}
                      className="w-8 h-8 rounded-full bg-surface-700 object-cover flex-shrink-0 border border-border mt-5"
                    />
                    <div className="flex flex-col items-start max-w-[70%] min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-text-primary">{msg.author}</span>
                        <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
                      </div>
                      <div className="bg-white/[0.03] border border-border/40 rounded-2xl rounded-tl-none px-3.5 py-2">
                        <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
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
                    : `${typingUsers.map(u => u.firstName).join(", ")} and more are typing`}
                </span>
                <span className="flex gap-0.5 items-center ml-0.5 h-3">
                  <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 rounded-full bg-text-muted animate-bounce" />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sidebar Panel for Online Members */}
          {showMembers && (
            <div className="w-60 flex-shrink-0 border-l border-border bg-surface-900/30 flex flex-col animate-slideLeft">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Channel Members
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {onlineUsers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                    <div className="relative">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-8 h-8 rounded-full bg-surface-700 object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-950 bg-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-primary truncate">{m.name}</p>
                      <p className="text-[9px] text-text-muted truncate capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-surface-900/30 flex-shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-800 border border-border focus-within:border-primary/50 transition-all"
          >
            <button
              type="button"
              disabled={!hasWritePermission}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
              aria-label="Upload file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              placeholder={
                !activeChannelData
                  ? "Connect to a channel..."
                  : !hasWritePermission
                  ? `Message #${activeChannelData.name} (Read-only)`
                  : `Message #${activeChannelData.name}`
              }
              disabled={!activeChannel || !isConnected || !hasWritePermission}
              className="flex-1 bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 py-1 disabled:text-text-muted disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={!hasWritePermission}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
              aria-label="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!messageText.trim() || !activeChannel || !isConnected || !hasWritePermission}
              className="p-2 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white transition-colors"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
