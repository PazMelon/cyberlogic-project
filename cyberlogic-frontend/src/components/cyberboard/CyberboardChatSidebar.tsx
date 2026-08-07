import { useState, useEffect } from "react";
import {
  X,
  Pin,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MessageStream from "../chat/MessageStream";
import MessageInput from "../chat/MessageInput";
import EmojiSearchPicker from "../chat/EmojiSearchPicker";
import ReactionPicker from "../chat/ReactionPicker";
import DeleteMessageModal from "../chat/DeleteMessageModal";
import type { ChatMessage } from "../chat/MessageBubble";
import {
  fetchCyberboardChatMessages,
  sendCyberboardChatMessage,
  togglePinCyberboardChatMessage,
  deleteCyberboardChatMessage,
  toggleCyberboardChatMessageReaction,
  getAvatarUrl,
  type CyberboardChatMessage,
  type CyberboardBoard,
} from "../../utils/api";

interface CyberboardChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  board: CyberboardBoard;
  allUsers?: any[];
  realtimeChatMessage?: CyberboardChatMessage | null;
  realtimePinnedMessage?: { message_id: number; is_pinned: boolean; message: CyberboardChatMessage } | null;
  realtimeDeletedMessageId?: number | null;
  realtimeReactionMessage?: { message_id: number; reactions: any[] } | null;
}

export default function CyberboardChatSidebar({
  isOpen,
  onClose,
  board,
  allUsers = [],
  realtimeChatMessage,
  realtimePinnedMessage,
  realtimeDeletedMessageId,
  realtimeReactionMessage,
}: CyberboardChatSidebarProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CyberboardChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<CyberboardChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; author: string; content: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<number | null>(null);
  const [activeFullPickerMessageId, setActiveFullPickerMessageId] = useState<number | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);
  const [copiedPinnedId, setCopiedPinnedId] = useState<number | null>(null);
  const [jumpToId, setJumpToId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch initial chat messages and pinned items
  useEffect(() => {
    if (!isOpen || !board.id) return;
    let isMounted = true;
    setLoading(true);

    fetchCyberboardChatMessages(board.id)
      .then((data) => {
        if (!isMounted) return;
        setMessages(data.messages || []);
        setPinnedMessages(data.pinned_messages || []);
      })
      .catch((err) => {
        console.error("Failed to fetch board chat messages:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, board.id]);

  // Handle incoming realtime message
  useEffect(() => {
    if (realtimeChatMessage && realtimeChatMessage.board_id === board.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === realtimeChatMessage.id)) return prev;
        return [...prev, realtimeChatMessage];
      });
    }
  }, [realtimeChatMessage, board.id]);

  // Handle incoming realtime pinned message toggle
  useEffect(() => {
    if (realtimePinnedMessage) {
      const { message_id, is_pinned, message: updatedMsg } = realtimePinnedMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === message_id ? { ...m, is_pinned, ...updatedMsg } : m))
      );
      setPinnedMessages((prev) => {
        if (is_pinned) {
          if (prev.some((p) => p.id === message_id)) return prev;
          return [updatedMsg, ...prev];
        } else {
          return prev.filter((p) => p.id !== message_id);
        }
      });
    }
  }, [realtimePinnedMessage]);

  // Handle incoming realtime deleted message
  useEffect(() => {
    if (realtimeDeletedMessageId) {
      setMessages((prev) => prev.filter((m) => m.id !== realtimeDeletedMessageId));
      setPinnedMessages((prev) => prev.filter((p) => p.id !== realtimeDeletedMessageId));
    }
  }, [realtimeDeletedMessageId]);

  // Handle incoming realtime reaction
  useEffect(() => {
    if (realtimeReactionMessage) {
      const { message_id, reactions } = realtimeReactionMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === message_id ? { ...m, reactions } : m))
      );
      setPinnedMessages((prev) =>
        prev.map((m) => (m.id === message_id ? { ...m, reactions } : m))
      );
    }
  }, [realtimeReactionMessage]);

  if (!isOpen) return null;

  // Convert CyberboardChatMessage to ChatMessage interface for MessageStream
  const chatMessages: ChatMessage[] = messages.map((m) => {
    const authorName = m.user
      ? `${m.user.first_name || ""} ${m.user.last_name || ""}`.trim() || m.user.username || "Member"
      : "Member";
    const rawAvatar = m.user?.avatar || m.user?.avatar_path;
    const authorAvatar = getAvatarUrl(rawAvatar, authorName);

    return {
      id: m.id,
      channelId: `cyberboard-${m.board_id}`,
      author: authorName,
      authorAvatar,
      authorId: m.user_id,
      authorUsername: m.user?.username,
      content: m.content,
      timestamp: m.created_at,
      isMe: user ? Number(m.user_id) === Number(user.id) : false,
      isPinned: !!m.is_pinned,
      reactions: (m.reactions || []).map((r) => ({
        emoji: r.emoji,
        count: r.count,
        users: [],
        reacted: user ? (r.userIds || []).includes(user.id) : false,
        userIds: r.userIds,
      })),
      replyTo: m.reply_to
        ? {
            id: m.reply_to.id,
            author: m.reply_to.user
              ? `${m.reply_to.user.first_name || ""} ${m.reply_to.user.last_name || ""}`.trim()
              : "Member",
            content: m.reply_to.content || "",
          }
        : null,
    };
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !board.id) return;
    const text = messageText.trim();
    const replyId = replyingTo?.id;

    setMessageText("");
    setReplyingTo(null);

    try {
      const newMsg = await sendCyberboardChatMessage(board.id, text, replyId);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err: any) {
      console.error("Failed to send board chat message:", err);
      showToast(err.message || "Failed to send message.");
    }
  };

  const handleSelectGif = async (gifUrl: string) => {
    if (!board.id) return;
    try {
      const newMsg = await sendCyberboardChatMessage(board.id, gifUrl, replyingTo?.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setReplyingTo(null);
    } catch (err: any) {
      showToast(err.message || "Failed to send GIF.");
    }
  };

  const handleTogglePin = async (msgId: number) => {
    try {
      const updated = await togglePinCyberboardChatMessage(msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, is_pinned: updated.is_pinned } : m))
      );
      setPinnedMessages((prev) => {
        if (updated.is_pinned) {
          if (prev.some((p) => p.id === msgId)) return prev;
          return [updated, ...prev];
        } else {
          return prev.filter((p) => p.id !== msgId);
        }
      });
      showToast(updated.is_pinned ? "Message pinned to top!" : "Message unpinned.");
    } catch (err: any) {
      showToast(err.message || "Failed to toggle pin.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMessage) return;
    const idToDelete = deletingMessage.id;
    setDeletingMessage(null);

    try {
      await deleteCyberboardChatMessage(idToDelete);
      setMessages((prev) => prev.filter((m) => m.id !== idToDelete));
      setPinnedMessages((prev) => prev.filter((p) => p.id !== idToDelete));
      showToast("Message deleted.");
    } catch (err: any) {
      showToast(err.message || "Failed to delete message.");
    }
  };

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    try {
      const res = await toggleCyberboardChatMessageReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
      );
    } catch (err: any) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  const handleCopyLinkOrContent = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPinnedId(id);
    setTimeout(() => setCopiedPinnedId(null), 2000);
  };

  const extractFirstLink = (text: string) => {
    const match = text.match(/(https?:\/\/[^\s]+)/g);
    return match ? match[0] : null;
  };

  return (
    <>
      {/* Click-Outside Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[9995] w-full sm:w-96 bg-surface-900 shadow-2xl border-l border-border/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-surface-950 border border-primary/40 text-primary text-xs px-3.5 py-2 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="h-16 px-4 sm:px-5 border-b border-border/80 flex items-center justify-between bg-surface-900/90 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-text-primary truncate">Board Chat</h2>
            <p className="text-[11px] text-text-muted truncate">Realtime team discussion & link pins</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Pinned Messages Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPinnedDrawer((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showPinnedDrawer || pinnedMessages.length > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
            }`}
            title="Toggle Pinned Messages & Links Drawer"
          >
            <Pin className={`w-3.5 h-3.5 ${pinnedMessages.length > 0 ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>Pinned</span>
            {pinnedMessages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {pinnedMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            title="Close Board Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pinned Links & Messages Drawer */}
      {showPinnedDrawer && (
        <div className="border-b border-border/80 bg-surface-950/60 backdrop-blur-md p-3.5 space-y-2.5 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-150 scrollbar-thin">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Pin className="w-3.5 h-3.5 fill-amber-400" />
              <span>Pinned Resources & Messages</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPinnedDrawer(false)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              Close
            </button>
          </div>

          {pinnedMessages.length === 0 ? (
            <p className="text-xs text-text-muted italic text-center py-3 bg-surface-900/40 rounded-xl border border-border/40">
              No pinned messages yet. Click the pin icon on any message to pin important links or notes.
            </p>
          ) : (
            <div className="space-y-2">
              {pinnedMessages.map((p) => {
                const link = extractFirstLink(p.content);
                const pAuthor = p.user
                  ? `${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() || p.user.username || "Member"
                  : "Member";

                return (
                  <div
                    key={`pin-${p.id}`}
                    className="p-2.5 rounded-xl bg-surface-900 border border-border/60 hover:border-primary/40 transition-all text-xs space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
                      <span className="font-semibold text-text-primary truncate">{pAuthor}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md hover:bg-surface-800 text-cyan-400"
                            title="Open Link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyLinkOrContent(link || p.content, p.id)}
                          className="p-1 rounded-md hover:bg-surface-800 text-text-muted hover:text-text-primary"
                          title="Copy Link / Content"
                        >
                          {copiedPinnedId === p.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(p.id)}
                          className="p-1 rounded-md hover:bg-rose-500/10 text-text-muted hover:text-rose-400"
                          title="Unpin Message"
                        >
                          <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </button>
                      </div>
                    </div>

                    <p
                      className="text-xs text-text-secondary line-clamp-3 cursor-pointer hover:text-text-primary transition-colors"
                      onClick={() => setJumpToId(p.id)}
                      title="Click to jump to message in chat"
                    >
                      {p.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Stream Area */}
      <div className="flex-1 min-h-0 relative flex flex-col bg-surface-950/20">
        {/* Emoji picker overlays */}
        {activeFullPickerMessageId !== null && (
          <EmojiSearchPicker
            onSelectEmoji={(emoji) => {
              handleToggleReaction(activeFullPickerMessageId, emoji);
              setActiveFullPickerMessageId(null);
            }}
            onClose={() => setActiveFullPickerMessageId(null)}
          />
        )}

        {showEmojiPicker && (
          <EmojiSearchPicker
            onSelectEmoji={(emoji) => {
              setMessageText((prev) => prev + emoji);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {/* Emoji Reaction Bar Popover Overlay - Centered on Sidebar */}
        {activeReactionPickerMessageId !== null && (() => {
          const targetMsg = chatMessages.find((m) => m.id === activeReactionPickerMessageId);
          return (
            <ReactionPicker
              targetMessageId={activeReactionPickerMessageId}
              reactions={targetMsg?.reactions}
              onReact={(emoji) => {
                handleToggleReaction(activeReactionPickerMessageId, emoji);
                setActiveReactionPickerMessageId(null);
              }}
              onOpenFullPicker={() => {
                const id = activeReactionPickerMessageId;
                setActiveReactionPickerMessageId(null);
                setActiveFullPickerMessageId(id);
              }}
              onClose={() => setActiveReactionPickerMessageId(null)}
              onTogglePin={() => handleTogglePin(activeReactionPickerMessageId)}
              isPinned={targetMsg?.isPinned}
              isSidebar={true}
            />
          );
        })()}

        <MessageStream
          messages={chatMessages}
          messagesLoading={loading}
          typingUsers={[]}
          currentUserId={user?.id}
          activeChannelName={board.title}
          onReact={handleToggleReaction}
          activePickerId={activeReactionPickerMessageId}
          setActivePickerId={setActiveReactionPickerMessageId}
          onOpenFullPicker={setActiveFullPickerMessageId}
          onReply={(msg) => setReplyingTo({ id: msg.id, author: msg.author, content: msg.content })}
          onDelete={(msg) => setDeletingMessage(msg)}
          onPin={(msg) => handleTogglePin(msg.id)}
          onToast={showToast}
          jumpToId={jumpToId}
          onJumpToIdCleared={() => setJumpToId(null)}
        />
      </div>

      {/* Input Toolbar */}
      <div className="flex-shrink-0 border-t border-border/80 bg-surface-900">
        <MessageInput
          messageText={messageText}
          placeholder={`Chat in ${board.title}...`}
          disabled={!user}
          onSubmit={handleSendMessage}
          onChange={(e) => setMessageText(e.target.value)}
          hasWritePermission={true}
          onlineUsers={allUsers}
          isPrivateBoard={board.visibility === "private"}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSelectGif={handleSelectGif}
          setMessageText={setMessageText}
          onOpenEmojiPicker={() => setShowEmojiPicker(true)}
        />
      </div>

      {/* Delete Message Confirmation Modal */}
      <DeleteMessageModal
        isOpen={deletingMessage !== null}
        deletingMessage={deletingMessage}
        onClose={() => setDeletingMessage(null)}
        onConfirm={handleConfirmDelete}
      />
      </div>
    </>
  );
}
