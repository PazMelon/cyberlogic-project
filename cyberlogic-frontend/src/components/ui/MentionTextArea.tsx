import React, { useState, useEffect, useRef } from "react";
import { fetchUsers, type DbUser } from "../../utils/api";
import { Shield, Users, GraduationCap, User as UserIcon } from "lucide-react";

function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement("div");
  const style = getComputedStyle(element);

  for (const prop of Array.from(style)) {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  }

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.overflow = "hidden";

  div.textContent = element.value.substring(0, position);
  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
  div.appendChild(span);

  document.body.appendChild(div);
  const coordinates = {
    top: span.offsetTop - element.scrollTop,
    left: span.offsetLeft - element.scrollLeft,
  };
  document.body.removeChild(div);

  return coordinates;
}

const GROUP_MENTIONS = [
  {
    id: "group-officers",
    first_name: "Officers",
    last_name: "(Admins & Superadmins)",
    username: "officers",
    role: "Group",
    icon: Shield,
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
  {
    id: "group-everyone",
    first_name: "Everyone",
    last_name: "(All Members)",
    username: "everyone",
    role: "Group",
    icon: Users,
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "group-firstyear",
    first_name: "1st Year",
    last_name: "Students",
    username: "firstyear",
    role: "Group",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "group-secondyear",
    first_name: "2nd Year",
    last_name: "Students",
    username: "secondyear",
    role: "Group",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "group-thirdyear",
    first_name: "3rd Year",
    last_name: "Students",
    username: "thirdyear",
    role: "Group",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "group-fourthyear",
    first_name: "4th Year",
    last_name: "Students",
    username: "fourthyear",
    role: "Group",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "group-fifthyear",
    first_name: "5th Year",
    last_name: "Students",
    username: "fifthyear",
    role: "Group",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "group-graduate",
    first_name: "Graduates",
    last_name: "Alumni",
    username: "graduate",
    role: "Group",
    icon: GraduationCap,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
];

interface MentionTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (val: string) => void;
  containerClassName?: string;
}

export default function MentionTextArea({
  value,
  onValueChange,
  containerClassName = "",
  className = "",
  placeholder = "Type your content... (Use @ to mention individuals or @officers)",
  rows = 3,
  ...props
}: MentionTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize height dynamically for multiline text
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onValueChange(val);
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

  const selectMention = (username: string) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textareaRef.current.selectionStart);

    const newText = `${beforeMention}@${username} ${afterMention}`;
    onValueChange(newText);
    setShowMentions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = beforeMention.length + username.length + 2; // @ + space
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const filteredGroups = GROUP_MENTIONS.filter(
    (g) =>
      `${g.first_name} ${g.last_name}`
        .toLowerCase()
        .includes(mentionQuery.toLowerCase()) ||
      g.username.toLowerCase().includes(mentionQuery.toLowerCase())
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
      }),
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
        setActiveMentionIndex(
          (prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredUsers[activeMentionIndex];
        if (selected && selected.username) {
          selectMention(selected.username);
        }
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }

    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div className={`relative flex-1 min-w-0 w-full ${containerClassName}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
        {...props}
      />

      {/* Mention Autocomplete Dropdown Popup */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: `${mentionCoords.top + 24}px`,
            left: `${Math.min(mentionCoords.left, 240)}px`,
          }}
          className="w-64 bg-surface-900 border border-border rounded-2xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-border/60 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Mention User or Group</span>
            <span className="text-primary font-normal">@</span>
          </div>

          <div className="divide-y divide-border/20">
            {filteredUsers.map((item, idx) => {
              const isGroup = "icon" in item;
              const isSelected = idx === activeMentionIndex;
              const IconComp = isGroup ? item.icon : UserIcon;
              const uName = item.username || "";

              return (
                <button
                  key={item.id || `user-${idx}`}
                  type="button"
                  onClick={() => uName && selectMention(uName)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-surface-800 text-text-primary"
                  }`}
                >
                  {"avatar" in item && item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.username}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0 bg-surface-800 border border-border"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <IconComp className="w-3 h-3" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">
                        {item.first_name} {item.last_name}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        @{item.username}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
