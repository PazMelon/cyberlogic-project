import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useWebSocket } from "../context/WebSocketContext";
import { apiRequest, useAuth } from "../context/AuthContext";
import type { ChatMessage } from "../components/chat/MessageBubble";
import type { ChatChannel } from "../components/chat/ChannelSidebar";
import type { TypingUser } from "../components/chat/MessageStream";

export function useChat() {
  const { subscribe, sendMessage, onlineUsers, isConnected } = useWebSocket();
  const { user: currentUser, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const channelParam = searchParams.get("channel");
  const messageIdParam = searchParams.get("message_id");

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [unreadStatus, setUnreadStatus] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [readReceipts, setReadReceipts] = useState<{ user_id: number; name: string; avatar: string | null; message_id: number }[]>([]);

  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingMoreMessages, setIsFetchingMoreMessages] = useState(false);
  const [hasNewerMessages, setHasNewerMessages] = useState(false);
  const [isFetchingNewerMessages, setIsFetchingNewerMessages] = useState(false);
  const hasNewerMessagesRef = useRef(false);

  useEffect(() => {
    hasNewerMessagesRef.current = hasNewerMessages;
  }, [hasNewerMessages]);

  const [replyingTo, setReplyingTo] = useState<{ id: number; author: string; content: string } | null>(null);
  const [showChatEditorEmojiPicker, setShowChatEditorEmojiPicker] = useState(false);

  const [channelsLoading, setChannelsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const [jumpToId, setJumpToId] = useState<number | null>(null);
  const [isJumpingToMessage, setIsJumpingToMessage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);

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

  // Show Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

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

          // Compute initial unreads
          const lastRead = JSON.parse(localStorage.getItem("chat_last_read") || "{}");
          const initialUnreads: Record<string, boolean> = {};
          data.forEach(c => {
            if (c.latest_message_id) {
              initialUnreads[c.slug] = c.latest_message_id > (lastRead[c.slug] || 0);
            }
          });
          setUnreadStatus(initialUnreads);

          // Check query parameters first
          const params = new URLSearchParams(window.location.search);
          const chan = params.get("channel");
          if (chan && data.some((c) => c.slug === chan)) {
            setActiveChannel(chan);
          } else if (data.length > 0) {
            const lastRead = JSON.parse(localStorage.getItem("chat_last_read") || "{}");
            const checkUnread = (slug: string) => {
              const chanObj = data.find((c) => c.slug === slug);
              if (!chanObj || !chanObj.latest_message_id) return false;
              return chanObj.latest_message_id > (lastRead[slug] || 0);
            };

            if (checkUnread("welcome")) {
              setActiveChannel("welcome");
            } else if (checkUnread("announcements")) {
              setActiveChannel("announcements");
            } else if (checkUnread("rules")) {
              setActiveChannel("rules");
            } else if (data.some((c) => c.slug === "general")) {
              setActiveChannel("general");
            } else {
              setActiveChannel(data[0].slug);
            }
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

  // Listen for realtime channel creations (DMs and custom group chats)
  useEffect(() => {
    if (isConnected) {
      const unsubscribe = subscribe("presence", (payload: any, type: string) => {
        if (type === "channel_created" && payload) {
          const newChan: ChatChannel = payload;
          setChannels((prev) => {
            if (prev.some((c) => c.id === newChan.id)) return prev;
            return [...prev, newChan];
          });
        } else if (type === "channel_deleted" && payload) {
          const deletedSlug = payload.slug;
          setChannels((prev) => prev.filter((c) => c.slug !== deletedSlug));
          if (activeChannel === deletedSlug) {
            setActiveChannel("welcome");
          }
        }
      });
      return () => unsubscribe();
    }
  }, [isConnected, subscribe, activeChannel]);

  // Subscribe to all channels dynamically to track unreads and updates
  useEffect(() => {
    if (channelsLoading || channels.length === 0) return;

    const unsubscribes = channels.map((chan) => {
      const wsChannel = `chat:${chan.slug}`;
      return subscribe(wsChannel, (payload: any, type: string) => {
        if (type === "message") {
          // If the message is not in the active channel, set unread indicator
          if (activeChannel !== payload.channelId) {
            setUnreadStatus((prev) => ({
              ...prev,
              [payload.channelId]: true,
            }));
            
            // Also update the latest_message_id on the channel object in state so it is kept fresh
            setChannels((prevChans) =>
              prevChans.map((c) =>
                c.slug === payload.channelId
                  ? { ...c, latest_message_id: payload.id }
                  : c
              )
            );
          }
        } else if (type === "channel_updated" && payload) {
          const updatedChan: ChatChannel = payload;
          setChannels((prevChans) =>
            prevChans.map((c) => (c.id === updatedChan.id ? updatedChan : c))
          );
        }
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [channels, channelsLoading, activeChannel, subscribe]);

  // Clear unreads when active channel changes
  useEffect(() => {
    if (activeChannel) {
      setUnreadStatus((prev) => {
        if (prev[activeChannel]) {
          const updated = { ...prev };
          delete updated[activeChannel];
          return updated;
        }
        return prev;
      });
    }
  }, [activeChannel]);

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

  // Load message history and subscribe to realtime channel when active channel changes
  useEffect(() => {
    if (!activeChannel) return;

    setTypingUsers([]);
    typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    typingTimeoutsRef.current.clear();

    if (isLocalTypingRef.current) {
      isLocalTypingRef.current = false;
      sendMessage("typing", `chat:${activeChannel}`, { isTyping: false });
    }
    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = null;
    }

    const sendReadReceipt = async (messageId: number) => {
      try {
        await apiRequest(`/api/chat/channels/${activeChannel}/read`, {
          method: "POST",
          body: JSON.stringify({ message_id: messageId }),
        });
      } catch (err) {
        console.error("Failed to send read receipt:", err);
      }
    };

    // Load history
    async function loadHistory() {
      try {
        setMessagesLoading(true);
        setHasMoreMessages(true);
        setHasNewerMessages(false);
        const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages`);
        if (res.ok) {
          const resData = await res.json();
          const data: ChatMessage[] = resData.messages || [];
          const receipts = resData.read_receipts || [];
          setMessages(data);
          setReadReceipts(receipts);
          if (data.length < 50) {
            setHasMoreMessages(false);
          }

          if (data.length > 0) {
            const latestMsg = data[data.length - 1];
            if (latestMsg) {
              const lastRead = JSON.parse(localStorage.getItem("chat_last_read") || "{}");
              lastRead[activeChannel] = latestMsg.id;
              localStorage.setItem("chat_last_read", JSON.stringify(lastRead));
              sendReadReceipt(latestMsg.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setMessagesLoading(false);
      }
    }
    loadHistory();

    const wsChannel = `chat:${activeChannel}`;
    const unsubscribe = subscribe(wsChannel, (payload: any, type: string) => {
      if (type === "message") {
        if (hasNewerMessagesRef.current) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;

          if (activeChannel === payload.channelId) {
            const lastRead = JSON.parse(localStorage.getItem("chat_last_read") || "{}");
            lastRead[activeChannel] = payload.id;
            localStorage.setItem("chat_last_read", JSON.stringify(lastRead));
            sendReadReceipt(payload.id);
          }

          return [...prev, { ...payload, animate: "animate-message-arrive" }];
        });
      } else if (type === "message_seen") {
        const { user_id, name, avatar, message_id } = payload;
        setReadReceipts((prev) => {
          const filtered = prev.filter((r) => r.user_id !== user_id);
          return [...filtered, { user_id, name, avatar, message_id }];
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
      } else if (type === "message_edited") {
        const { messageId, content, author, authorAvatar, authorId, authorUsername } = payload;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content,
                  author,
                  authorAvatar,
                  authorId,
                  authorUsername,
                  isMe: currentUser && Number(authorId) === Number(currentUser.id) ? true : false,
                }
              : msg
          )
        );
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
        const resData = await res.json();
        const data: ChatMessage[] = resData.messages || [];
        const receipts = resData.read_receipts || [];
        setReadReceipts(receipts);
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

  // Jump to reply parent message
  async function jumpToMessage(parentId: number) {
    const el = document.getElementById(`message-${parentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950", "rounded-2xl", "duration-500");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950");
      }, 2000);
      return;
    }

    triggerToast("Jumping to message...");
    setIsJumpingToMessage(true);

    try {
      const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages?around_id=${parentId}`);
      if (res.ok) {
        const resData = await res.json();
        const data: ChatMessage[] = resData.messages || [];
        if (data.length > 0) {
          setMessages(data);
          setHasNewerMessages(true);
          setHasMoreMessages(true);
          setJumpToId(parentId);

          setTimeout(() => {
            const targetEl = document.getElementById(`message-${parentId}`);
            if (targetEl) {
              targetEl.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950", "rounded-2xl", "duration-500");
              setTimeout(() => {
                targetEl.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-surface-950");
              }, 2000);
            }
          }, 100);
        } else {
          triggerToast("Message could not be found.");
        }
      }
    } catch (err) {
      console.error("Failed to jump to reply message:", err);
    } finally {
      setIsJumpingToMessage(false);
    }
  }

  // Jump back to the present
  async function jumpToPresent() {
    setHasNewerMessages(false);
    setIsFetchingNewerMessages(false);
    setIsJumpingToMessage(true);
    setHasMoreMessages(true);
    try {
      const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages`);
      if (res.ok) {
        const resData = await res.json();
        const data: ChatMessage[] = resData.messages || [];
        setMessages(data);
        if (data.length < 50) {
          setHasMoreMessages(false);
        }
        setTimeout(() => {
          const container = document.querySelector(".flex-1.overflow-y-auto");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {
      console.error("Failed to jump to present:", err);
    } finally {
      setIsJumpingToMessage(false);
    }
  }

  // Load newer history
  async function loadNewerHistory() {
    if (isFetchingNewerMessages || !hasNewerMessages || messages.length === 0) return;
    try {
      setIsFetchingNewerMessages(true);
      const latestId = messages[messages.length - 1].id;
      const res = await apiRequest(`/api/chat/channels/${activeChannel}/messages?after_id=${latestId}`);
      if (res.ok) {
        const resData = await res.json();
        const data: ChatMessage[] = resData.messages || [];
        if (data.length === 0) {
          setHasNewerMessages(false);
        } else {
          setMessages((prev) => [...prev, ...data]);
          if (data.length < 50) {
            setHasNewerMessages(false);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load newer history:", err);
    } finally {
      setIsFetchingNewerMessages(false);
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

  const handleToggleEmoji = (messageId: number, emoji: string) => {
    if (!activeChannel || !isConnected) return;
    sendMessage("reaction", `chat:${activeChannel}`, {
      messageId,
      emoji,
    });
  };

  const handleDeleteClick = (msg: ChatMessage) => {
    setDeletingMessage(msg);
  };

  const handleConfirmDelete = (reason: string) => {
    if (!deletingMessage || !reason.trim() || !activeChannel) return;

    sendMessage("delete_message", `chat:${activeChannel}`, {
      messageId: deletingMessage.id,
      reason: reason.trim(),
    });

    setDeletingMessage(null);
  };

  const handleEditMessage = (messageId: number, newContent: string) => {
    if (!activeChannel) return;
    sendMessage("edit_message", `chat:${activeChannel}`, {
      messageId,
      newContent,
    });
  };

  const canDeleteMessages = hasPermission("manage_chat");

  const startDm = async (recipientId: number) => {
    try {
      const res = await apiRequest("/api/chat/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      if (res.ok) {
        const newChan = await res.json();
        setChannels((prev) => {
          if (prev.some((c) => c.slug === newChan.slug)) return prev;
          return [...prev, newChan];
        });
        setActiveChannel(newChan.slug);
      }
    } catch (err) {
      console.error("Failed to start DM:", err);
    }
  };

  const createGroupChat = async (name: string, userIds: number[]) => {
    try {
      const res = await apiRequest("/api/chat/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, user_ids: userIds }),
      });
      if (res.ok) {
        const newChan = await res.json();
        setChannels((prev) => {
          if (prev.some((c) => c.slug === newChan.slug)) return prev;
          return [...prev, newChan];
        });
        setActiveChannel(newChan.slug);
      }
    } catch (err) {
      console.error("Failed to create group chat:", err);
    }
  };

  const addMembersToActiveChannel = async (userIds: number[]) => {
    if (!activeChannel) return;
    try {
      const res = await apiRequest(`/api/chat/channels/${activeChannel}/add-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: userIds }),
      });
      if (res.ok) {
        const updatedChan = await res.json();
        setChannels((prev) => {
          const index = prev.findIndex((c) => c.id === updatedChan.id);
          if (index !== -1) {
            const copy = [...prev];
            copy[index] = updatedChan;
            return copy;
          }
          return [...prev, updatedChan];
        });
        if (updatedChan.slug !== activeChannel) {
          setActiveChannel(updatedChan.slug);
        }
      }
    } catch (err) {
      console.error("Failed to add members:", err);
    }
  };

  const leaveActiveChannel = async () => {
    if (!activeChannel) return;
    try {
      const res = await apiRequest(`/api/chat/channels/${activeChannel}/leave`, {
        method: "POST",
      });
      if (res.ok) {
        setChannels((prev) => prev.filter((c) => c.slug !== activeChannel));
        setActiveChannel("welcome");
      }
    } catch (err) {
      console.error("Failed to leave channel:", err);
    }
  };

  return {
    isConnected,
    currentUser,
    allUsers,
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    messageText,
    setMessageText,
    readReceipts,
    hasMoreMessages,
    isFetchingMoreMessages,
    hasNewerMessages,
    isFetchingNewerMessages,
    replyingTo,
    setReplyingTo,
    showChatEditorEmojiPicker,
    setShowChatEditorEmojiPicker,
    channelsLoading,
    messagesLoading,
    typingUsers,
    jumpToId,
    setJumpToId,
    isJumpingToMessage,
    toastMessage,
    triggerToast,
    activeChannelData,
    hasWritePermission,
    canDeleteMessages,
    handleInputChange,
    handleSendMessage,
    handleSelectGif,
    handleToggleEmoji,
    handleConfirmDelete,
    handleEditMessage,
    loadMoreHistory,
    loadNewerHistory,
    jumpToMessage,
    jumpToPresent,
    onlineUsers,
    deletingMessage,
    setDeletingMessage,
    handleDeleteClick,
    unreadStatus,
    startDm,
    createGroupChat,
    addMembersToActiveChannel,
    leaveActiveChannel,
  };
}
