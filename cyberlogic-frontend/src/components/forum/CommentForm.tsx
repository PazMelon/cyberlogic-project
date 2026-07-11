import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "../ui";
import { fetchUsers, type DbUser } from "../../utils/api";

function getCaretCoordinates(textarea: HTMLTextAreaElement, position: number) {
  const div = document.createElement("div");
  const style = window.getComputedStyle(textarea);
  const properties = [
    "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
    "borderWidth", "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontSizeAdjust",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "textDecoration",
    "letterSpacing", "wordSpacing", "tabSize", "MozTabSize", "whiteSpace", "wordBreak", "wordWrap"
  ];
  properties.forEach(prop => {
    (div.style as any)[prop] = (style as any)[prop];
  });
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  document.body.appendChild(div);
  const text = textarea.value.substring(0, position);
  div.textContent = text;
  const span = document.createElement("span");
  span.textContent = textarea.value.substring(position) || ".";
  div.appendChild(span);
  const coordinates = {
    top: span.offsetTop + parseInt(style.borderTopWidth || "0") - textarea.scrollTop,
    left: span.offsetLeft + parseInt(style.borderLeftWidth || "0") - textarea.scrollLeft
  };
  document.body.removeChild(div);
  return coordinates;
}

interface CommentFormProps {
  onSubmit: (content: string, isSpoiler?: boolean, isRedacted?: boolean) => void | Promise<void>;
  placeholder?: string;
  buttonText?: string;
  autoFocus?: boolean;
  initialValue?: string;
  onCancel?: () => void;
}

export function CommentForm({
  onSubmit,
  placeholder = "What are your thoughts?",
  buttonText = "Post Comment",
  autoFocus = false,
  initialValue = "",
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mentions autocomplete states
  const [users, setUsers] = useState<DbUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    fetchUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.error("Failed to load users for mentions", err));
  }, []);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    const selectionStart = e.target.selectionStart;

    const lastAtIdx = val.lastIndexOf("@", selectionStart - 1);
    if (lastAtIdx !== -1) {
      const charBeforeAt = lastAtIdx > 0 ? val[lastAtIdx - 1] : " ";
      const textAfterAt = val.substring(lastAtIdx + 1, selectionStart);

      if (
        (charBeforeAt === " " || charBeforeAt === "\n") &&
        !textAfterAt.includes(" ")
      ) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIdx);
        setActiveMentionIndex(0);

        if (textareaRef.current) {
          const coords = getCaretCoordinates(textareaRef.current, lastAtIdx);
          setMentionCoords(coords);
        }
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMentionUser = (username: string) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;
    const beforeMention = content.substring(0, mentionStartIndex);
    const afterMention = content.substring(textareaRef.current.selectionStart);

    const newText = `${beforeMention}@${username} ${afterMention}`;
    setContent(newText);
    setShowMentions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = beforeMention.length + username.length + 2; // @ + space
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const groupMentions = [
    { id: "group-everyone", first_name: "Everyone", last_name: "(All Members)", username: "everyone", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=everyone" },
    { id: "group-officers", first_name: "Officers", last_name: "(Admins)", username: "officers", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=officers" },
    { id: "group-firstyear", first_name: "1st Year", last_name: "Students", username: "firstyear", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=firstyear" },
    { id: "group-secondyear", first_name: "2nd Year", last_name: "Students", username: "secondyear", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=secondyear" },
    { id: "group-thirdyear", first_name: "3rd Year", last_name: "Students", username: "thirdyear", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=thirdyear" },
    { id: "group-fourthyear", first_name: "4th Year", last_name: "Students", username: "fourthyear", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=fourthyear" },
    { id: "group-fifthyear", first_name: "5th Year", last_name: "Students", username: "fifthyear", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=fifthyear" },
    { id: "group-graduate", first_name: "Graduates", last_name: "", username: "graduate", avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=graduate" }
  ];

  const filteredGroups = groupMentions.filter((group) =>
    `${group.first_name} ${group.last_name}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    group.username.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredUsers = [
    ...filteredGroups,
    ...(users || [])
      .filter((u) => u.status === "approved")
      .filter((u) => {
        const q = mentionQuery.toLowerCase();
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        const username = (u.username || "").toLowerCase();
        return fullName.includes(q) || username.includes(q);
      })
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selectedUser = filteredUsers[activeMentionIndex];
        const uName = selectedUser.username || `${selectedUser.first_name}${selectedUser.last_name}`.toLowerCase();
        selectMentionUser(uName);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content, false, false);
      setContent("");
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 relative">
      <textarea
        ref={textareaRef}
        rows={3}
        value={content}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
      />

      {/* Autocomplete Popover */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: `${mentionCoords.top + 24}px`,
            left: `${mentionCoords.left}px`,
          }}
          className="w-64 bg-surface-900 border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn"
        >
          <div className="px-3 py-1.5 bg-surface-950 border-b border-border text-[9px] uppercase tracking-wider font-bold text-text-muted">
            Mention Users
          </div>
          <div className="max-h-40 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredUsers.map((user, idx) => {
              const uName = user.username || `${user.first_name}${user.last_name}`.toLowerCase();
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectMentionUser(uName)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    idx === activeMentionIndex
                      ? "bg-primary/20 text-primary"
                      : "text-text-secondary hover:bg-surface-800 hover:text-text-primary"
                  }`}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.first_name}`}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{`${user.first_name} ${user.last_name}`}</span>
                    <span className="text-[10px] text-text-muted ml-2">@{uName}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 ml-auto">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors rounded-lg bg-surface-900/40 border border-border"
          >
            Cancel
          </button>
        )}
        <Button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          variant="primary"
          className="px-4 py-2 text-xs"
          icon={<Send className="w-3 h-3" />}
        >
          {isSubmitting ? "Submitting..." : buttonText}
        </Button>
      </div>
    </form>
  );
}
