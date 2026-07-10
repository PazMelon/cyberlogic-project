import { useRef, useEffect, useState } from "react";
import { Smile, Send, Sparkles, X, CornerUpLeft } from "lucide-react";
import GifLibraryPicker from "./GifLibraryPicker";

export interface MessageInputProps {
  messageText: string;
  placeholder: string;
  disabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  hasWritePermission: boolean;
  onlineUsers?: any[];
  replyingTo?: { id: number; author: string; content: string } | null;
  onCancelReply?: () => void;
  onSelectGif?: (url: string) => void;
  setMessageText?: (text: string) => void;
  onOpenEmojiPicker?: () => void;
}

export default function MessageInput({
  messageText,
  placeholder,
  disabled,
  onSubmit,
  onChange,
  hasWritePermission,
  onlineUsers = [],
  replyingTo = null,
  onCancelReply,
  onSelectGif,
  setMessageText,
  onOpenEmojiPicker,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Mentions Autocomplete States
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  // Auto grow height based on scrollHeight
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [messageText]);

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Detect @ mentions triggers
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;

    // Look backward from the cursor to see if there is an '@'
    const lastAtIdx = value.lastIndexOf("@", selectionStart - 1);
    if (lastAtIdx !== -1) {
      // Check if there is space before @ or it's the start of line
      const charBeforeAt = lastAtIdx > 0 ? value[lastAtIdx - 1] : " ";
      const textAfterAt = value.substring(lastAtIdx + 1, selectionStart);

      // Mentions should only trigger if preceded by space/newline and no space inside query
      if (
        (charBeforeAt === " " || charBeforeAt === "\n") &&
        !textAfterAt.includes(" ")
      ) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIdx);
        setActiveMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMentionUser = (username: string) => {
    if (!setMessageText || mentionStartIndex === -1 || !textareaRef.current) return;
    const value = messageText;
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textareaRef.current.selectionStart);

    const newText = `${beforeMention}@${username} ${afterMention}`;
    setMessageText(newText);
    setShowMentions(false);

    // Reset height and refocus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = beforeMention.length + username.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  // Filter mention suggestions safely
  const filteredUsers = (onlineUsers || []).filter((user) =>
    user && (
      (user.name && user.name.toLowerCase().includes(mentionQuery.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(mentionQuery.toLowerCase()))
    )
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mentions navigation
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex(
          (prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selectedUser = filteredUsers[activeMentionIndex];
        selectMentionUser(selectedUser.username || selectedUser.name.replace(/\s+/g, "").toLowerCase());
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Standard message submit
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      if (messageText.trim() && !disabled) {
        const form = textareaRef.current?.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    if (onSelectGif) {
      onSelectGif(gifUrl);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-surface-900/30 flex-shrink-0 relative">
      {/* Mentions Autocomplete Popover */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-64 bg-surface-900 border border-border rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-1.5 bg-surface-950 border-b border-border text-[9px] uppercase tracking-wider font-bold text-text-muted">
            Mention Users
          </div>
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {filteredUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectMentionUser(user.username || user.name.replace(/\s+/g, "").toLowerCase())}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  idx === activeMentionIndex
                    ? "bg-primary/20 text-primary"
                    : "text-text-secondary hover:bg-surface-800 hover:text-text-primary"
                }`}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-[10px] text-text-muted ml-2">
                    @{user.username || user.name.replace(/\s+/g, "").toLowerCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-xl bg-surface-850 border border-border/80 flex items-center justify-between gap-3 text-xs animate-slideDown">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Replying to <span className="text-primary font-semibold">@{replyingTo.author}</span>
              </p>
              <p className="text-text-secondary truncate max-w-lg">{replyingTo.content}</p>
            </div>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* GIF Picker Popover */}
      {showGifPicker && (
        <GifLibraryPicker
          onSelectGif={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
        />
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 p-2 rounded-xl bg-surface-800 border border-border focus-within:border-primary/50 transition-all"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={messageText}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 py-1 disabled:text-text-muted disabled:cursor-not-allowed resize-none max-h-[120px] overflow-y-auto no-scrollbar"
        />

        {/* Saved GIFs Library Picker Trigger */}
        <button
          type="button"
          onClick={() => setShowGifPicker(!showGifPicker)}
          disabled={!hasWritePermission}
          className={`p-1.5 rounded-lg transition-colors mb-0.5 cursor-pointer ${
            showGifPicker
              ? "text-primary bg-primary/10"
              : "text-text-muted hover:text-text-primary"
          }`}
          title="GIF and Image Library"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenEmojiPicker}
          disabled={!hasWritePermission}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted mb-0.5 cursor-pointer"
          aria-label="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={!messageText.trim() || disabled}
          className="p-2 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white transition-colors mb-0.5"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
