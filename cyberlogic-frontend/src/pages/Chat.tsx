import { useState, useRef, useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { apiRequest, useAuth } from "../context/AuthContext";

// Modular sub-components
import ChannelSidebar from "../components/chat/ChannelSidebar";
import type { ChatChannel } from "../components/chat/ChannelSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import MessageStream from "../components/chat/MessageStream";
import type { TypingUser } from "../components/chat/MessageStream";
import MessageInput from "../components/chat/MessageInput";
import EmojiSearchPicker from "../components/chat/EmojiSearchPicker";
import type { ChatMessage } from "../components/chat/MessageBubble";

export default function Chat() {
  const { subscribe, sendMessage, onlineUsers, isConnected } = useWebSocket();
  const { user: currentUser } = useAuth();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showMobileChannels, setShowMobileChannels] = useState(false);
  
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Reaction states
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<number | null>(null);
  const [activeFullPickerMessageId, setActiveFullPickerMessageId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapse state for grouping categories
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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

  // Load channels on mount
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

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load message history and subscribe to realtime channel when active channel changes
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
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      } else if (type === "reaction_update") {
        const { messageId, reactions } = payload;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              const mappedReactions = reactions.map((r: any) => {
                const userIdsMapped = Array.isArray(r.userIds) 
                  ? r.userIds.map((uid: any) => Number(uid)) 
                  : [];
                return {
                  emoji: r.emoji,
                  count: r.count,
                  users: r.users,
                  reacted: currentUser ? userIdsMapped.includes(Number(currentUser.id)) : false,
                };
              });
              return { ...msg, reactions: mappedReactions };
            }
            return msg;
          })
        );
      } else if (type === "reaction_error") {
        const { message } = payload;
        triggerToast(message);
      } else if (type === "typing") {
        const { userId, name, avatar, isTyping } = payload;

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
      unsubscribe();
      typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      typingTimeoutsRef.current.clear();
    };
  }, [activeChannel, subscribe, currentUser]);

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

    const now = Date.now();
    if (!isLocalTypingRef.current || now - lastLocalTypingTimeRef.current > 1500) {
      isLocalTypingRef.current = true;
      lastLocalTypingTimeRef.current = now;
      sendMessage("typing", `chat:${activeChannel}`, { isTyping: true });
    }

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

    sendMessage("message", `chat:${activeChannel}`, {
      content: messageText,
    });

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

  // Toggle emoji reactions via WS
  const handleToggleEmoji = (messageId: number, emoji: string) => {
    if (!activeChannel || !isConnected) return;
    sendMessage("reaction", `chat:${activeChannel}`, {
      messageId,
      emoji,
    });
    setActiveReactionPickerMessageId(null);
    setActiveFullPickerMessageId(null);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-950">
      {/* Toast alert for max reaction error */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-error/95 border border-error/50 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* Mobile Drawer */}
      {showMobileChannels && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileChannels(false)}
          />
          
          <div className="relative flex w-64 max-w-xs flex-col bg-surface-900 border-r border-border animate-slideRight">
            {/* Render ChannelSidebar directly, passing onClose handler callback to let it close drawer */}
            <ChannelSidebar
              channels={channels}
              activeChannel={activeChannel}
              setActiveChannel={setActiveChannel}
              channelsLoading={channelsLoading}
              onlineUsers={onlineUsers as any}
              isConnected={!!isConnected}
              onChannelSelect={() => setShowMobileChannels(false)}
              collapsedGroups={collapsedGroups}
              setCollapsedGroups={setCollapsedGroups}
              className="flex flex-col h-full w-full"
            />
          </div>
        </div>
      )}

      {/* Desktop Channel Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        channelsLoading={channelsLoading}
        onlineUsers={onlineUsers as any}
        isConnected={!!isConnected}
        collapsedGroups={collapsedGroups}
        setCollapsedGroups={setCollapsedGroups}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          activeChannelData={activeChannelData}
          showMembers={showMembers}
          setShowMembers={setShowMembers}
          onOpenMobileMenu={() => setShowMobileChannels(true)}
        />

        <div className="flex-1 flex min-h-0 relative">
          {/* Full emoji picker popup overlay */}
          {activeFullPickerMessageId !== null && (
            <EmojiSearchPicker
              onSelectEmoji={(emoji) => handleToggleEmoji(activeFullPickerMessageId, emoji)}
              onClose={() => setActiveFullPickerMessageId(null)}
            />
          )}

          <MessageStream
            messages={messages}
            messagesLoading={messagesLoading}
            typingUsers={typingUsers}
            currentUserId={currentUser?.id}
            activeChannelName={activeChannelData?.name}
            onReact={handleToggleEmoji}
            activePickerId={activeReactionPickerMessageId}
            setActivePickerId={setActiveReactionPickerMessageId}
            onOpenFullPicker={setActiveFullPickerMessageId}
          />

          {/* Members Sidebar Panel */}
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

        <MessageInput
          messageText={messageText}
          placeholder={
            !activeChannelData
              ? "Connect to a channel..."
              : !hasWritePermission
              ? `Message #${activeChannelData.name} (Read-only)`
              : `Message #${activeChannelData.name}`
          }
          disabled={!activeChannel || !isConnected || !hasWritePermission}
          onSubmit={handleSendMessage}
          onChange={handleInputChange}
          hasWritePermission={!!hasWritePermission}
        />
      </div>
    </div>
  );
}
