import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useWebSocket } from "../context/WebSocketContext";
import { apiRequest, useAuth } from "../context/AuthContext";
import { ShieldAlert, X } from "lucide-react";

// Modular sub-components
import ChannelSidebar from "../components/chat/ChannelSidebar";
import type { ChatChannel } from "../components/chat/ChannelSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import MessageStream from "../components/chat/MessageStream";
import type { TypingUser } from "../components/chat/MessageStream";
import MessageInput from "../components/chat/MessageInput";
import EmojiSearchPicker from "../components/chat/EmojiSearchPicker";
import type { ChatMessage } from "../components/chat/MessageBubble";
import { useSEO } from "../utils/useSEO";

export default function Chat() {
  useSEO({
    title: "Realtime Chat",
    description: "Connect and collaborate with other members of Cyberlogic Club in realtime chat rooms.",
  });

  const { subscribe, sendMessage, onlineUsers, isConnected } = useWebSocket();
  const { user: currentUser, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const channelParam = searchParams.get("channel");
  const messageIdParam = searchParams.get("message_id");

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");

  const [showMobileChannels, setShowMobileChannels] = useState(false);
  const [showMembersList, setShowMembersList] = useState(window.innerWidth >= 1024);

  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingMoreMessages, setIsFetchingMoreMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; author: string; content: string } | null>(null);
  const [showChatEditorEmojiPicker, setShowChatEditorEmojiPicker] = useState(false);

  const [channelsLoading, setChannelsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Reaction states
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<number | null>(null);
  const [activeFullPickerMessageId, setActiveFullPickerMessageId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapse state for grouping categories
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Message deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

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

  // Fetch all directory users for mentions autocompletion
  useEffect(() => {
    async function loadDirectoryUsers() {
      try {
        const res = await apiRequest("/api/directory");
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data);
        }
      } catch (err) {
        console.error("Failed to load directory users:", err);
      }
    }
    loadDirectoryUsers();
  }, []);

  // Load channels on mount
  useEffect(() => {
    async function loadChannels() {
      try {
        setChannelsLoading(true);
        const res = await apiRequest("/api/chat/channels");
        if (res.ok) {
          const data: ChatChannel[] = await res.json();
          setChannels(data);

          // Check query parameters first
          const params = new URLSearchParams(window.location.search);
          const chan = params.get("channel");
          if (chan && data.some((c) => c.slug === chan)) {
            setActiveChannel(chan);
          } else if (data.length > 0) {
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

  // Listen to channel changes from query param (e.g. notification click)
  useEffect(() => {
    if (channelParam && channels.some((c) => c.slug === channelParam)) {
      setActiveChannel(channelParam);
    }
  }, [channelParam, channels]);

  // Scroll to specified message_id if present
  useEffect(() => {
    if (messageIdParam && !messagesLoading && messages.length > 0) {
      const msgId = Number(messageIdParam);
      if (messages.some((m) => m.id === msgId)) {
        setTimeout(() => {
          const el = document.getElementById(`message-${msgId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950", "rounded-2xl", "duration-500");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950");
            }, 2000);

            // Prune message_id param from URL
            setSearchParams((prev) => {
              const newParams = new URLSearchParams(prev);
              newParams.delete("message_id");
              return newParams;
            }, { replace: true });
          }
        }, 300);
      }
    }
  }, [messageIdParam, messagesLoading, messages, setSearchParams]);

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
        setHasMoreMessages(true);
        const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages`);
        if (res.ok) {
          const data: ChatMessage[] = await res.json();
          setMessages(data);
          if (data.length < 50) {
            setHasMoreMessages(false);
          }
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
          return [...prev, { ...payload, animate: "animate-message-arrive" }];
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
      } else if (type === "message_deleted") {
        const { messageId, content } = payload;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, isDeleted: true, reactions: [] }
              : msg
          )
        );
      } else if (type === "rate_limit") {
        const { message } = payload;
        triggerToast(message);
      }
    });

    return () => {
      unsubscribe();
      typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      typingTimeoutsRef.current.clear();
    };
  }, [activeChannel, subscribe, currentUser]);

  // Load older history
  async function loadMoreHistory() {
    if (isFetchingMoreMessages || !hasMoreMessages || messages.length === 0) return;
    try {
      setIsFetchingMoreMessages(true);
      const oldestId = messages[0].id;
      const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages?before_id=${oldestId}`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        if (data.length === 0) {
          setHasMoreMessages(false);
        } else {
          setMessages((prev) => [...data, ...prev]);
          if (data.length < 50) {
            setHasMoreMessages(false);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load more chat history:", err);
    } finally {
      setIsFetchingMoreMessages(false);
    }
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (stopTypingTimerRef.current) {
        clearTimeout(stopTypingTimerRef.current);
      }
      typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      parentId: replyingTo?.id || null,
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
    setReplyingTo(null);
  };

  const handleSelectGif = (url: string) => {
    if (!activeChannel || !hasWritePermission) return;
    sendMessage("message", `chat:${activeChannel}`, {
      content: url,
      parentId: replyingTo?.id || null,
    });
    setReplyingTo(null);
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

  // Handle opening the delete confirmation modal
  const handleDeleteClick = (msg: ChatMessage) => {
    setDeletingMessage(msg);
    setDeleteReason("");
    setDeleteModalOpen(true);
  };

  // Handle confirming a message deletion
  const handleConfirmDelete = () => {
    if (!deletingMessage || !deleteReason.trim() || !activeChannel) return;

    sendMessage("delete_message", `chat:${activeChannel}`, {
      messageId: deletingMessage.id,
      reason: deleteReason.trim(),
    });

    setDeleteModalOpen(false);
    setDeletingMessage(null);
    setDeleteReason("");
  };

  const canDeleteMessages = hasPermission('manage_chat');

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-950">
      {/* Toast alert for errors */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-error/95 border border-error/50 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      {deleteModalOpen && deletingMessage && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative bg-surface-900 border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fadeIn">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-error/10 border border-error/20">
                <ShieldAlert className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Delete Message</h3>
                <p className="text-xs text-text-muted">This action will replace the message with a moderation notice.</p>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-surface-800 border border-border/50">
              <p className="text-xs text-text-muted mb-1">Message by <span className="font-semibold text-text-secondary">{deletingMessage.author}</span>:</p>
              <p className="text-xs text-text-secondary line-clamp-3 break-words">{deletingMessage.content}</p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Reason for deletion <span className="text-error">*</span></label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter the reason why this message is being removed..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface-800 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-error/50 focus:border-error/50 resize-none transition-all"
                rows={3}
                maxLength={500}
                autoFocus
              />
              <p className="text-[10px] text-text-muted mt-1 text-right">{deleteReason.length}/500</p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-surface-800 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim()}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-error border border-error/50 text-white hover:bg-error/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Delete Message
              </button>
            </div>
          </div>
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

      {/* Mobile/Tablet Members Drawer */}
      {showMembersList && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMembersList(false)}
          />

          <div className="relative flex w-60 max-w-xs flex-col bg-surface-900 border-l border-border animate-slideLeft h-full">
            <div className="h-[57px] border-b border-border flex items-center justify-between px-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Online Members
              </h3>
              <button
                type="button"
                onClick={() => setShowMembersList(false)}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
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
          onOpenMobileMenu={() => setShowMobileChannels(true)}
          showMembersList={showMembersList}
          onToggleMembersList={() => setShowMembersList((prev) => !prev)}
        />

        <div className="flex-1 flex min-h-0 relative">
          {/* Full emoji picker popup overlay */}
          {activeFullPickerMessageId !== null && (
            <EmojiSearchPicker
              onSelectEmoji={(emoji) => handleToggleEmoji(activeFullPickerMessageId, emoji)}
              onClose={() => setActiveFullPickerMessageId(null)}
            />
          )}

          {/* Chat input emoji picker overlay (renders in main content) */}
          {showChatEditorEmojiPicker && (
            <EmojiSearchPicker
              onSelectEmoji={(emoji) => {
                setMessageText((prev) => prev + emoji);
                setShowChatEditorEmojiPicker(false);
              }}
              onClose={() => setShowChatEditorEmojiPicker(false)}
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
            onLoadMore={loadMoreHistory}
            hasMore={hasMoreMessages}
            isFetchingMore={isFetchingMoreMessages}
            onReply={(msg) => setReplyingTo({ id: msg.id, author: msg.author, content: msg.content })}
            onDelete={canDeleteMessages ? handleDeleteClick : undefined}
          />

          {/* Members Sidebar Panel removed from inner container to span full height */}
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
          onlineUsers={allUsers}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSelectGif={handleSelectGif}
          setMessageText={setMessageText}
          onOpenEmojiPicker={() => setShowChatEditorEmojiPicker(true)}
        />
      </div>

      {/* Members Sidebar Panel placed here to have the same height as the entire chat interface */}
      {showMembersList && (
        <div className="hidden md:flex w-60 flex-shrink-0 border-l border-border bg-surface-900/30 flex-col animate-slideLeft">
          <div className="h-[57px] border-b border-border flex items-center justify-between px-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Online Members
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
  );
}
