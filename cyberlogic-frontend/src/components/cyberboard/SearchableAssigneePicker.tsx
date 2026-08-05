import { useState, useEffect, useRef } from "react";
import { UserCheck, Search, X, Check, Shield, User } from "lucide-react";
import { fetchMentionSuggestions } from "../../utils/api";

interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  avatar?: string;
  role?: string;
}

interface SearchableAssigneePickerProps {
  value?: number | number[] | null;
  onChange: (userIds: number[]) => void;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  boardHostId?: number;
  disabled?: boolean;
}

export default function SearchableAssigneePicker({
  value,
  onChange,
  boardVisibility = "public",
  allowedMembers = [],
  boardHostId,
  disabled = false,
}: SearchableAssigneePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize selected IDs into a clean array
  const selectedIds: number[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  useEffect(() => {
    setIsLoading(true);
    fetchMentionSuggestions()
      .then((users) => {
        if (Array.isArray(users)) {
          setAllUsers(users);
        }
      })
      .catch((err) => console.error("Failed to load members for assignee picker:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scope user list based on Board Visibility permission
  const scopedUsers = allUsers.filter((u) => {
    if (boardVisibility === "private") {
      const isHost = boardHostId ? u.id === boardHostId : false;
      const isAllowed = allowedMembers && Array.isArray(allowedMembers) ? allowedMembers.includes(u.id) : false;
      return isHost || isAllowed;
    }
    return true; // Public boards allow all members
  });

  // Filter scoped users based on search query
  const filteredUsers = scopedUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const username = (u.username || "").toLowerCase();
    return fullName.includes(q) || username.includes(q);
  });

  const selectedUsers = selectedIds
    .map((id) => scopedUsers.find((u) => u.id === id) || allUsers.find((u) => u.id === id))
    .filter(Boolean) as UserOption[];

  const handleToggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Assignee Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 rounded-xl bg-surface-800 border transition-all flex flex-wrap items-center gap-1.5 min-h-[42px] cursor-pointer ${
          isOpen ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/40"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mr-1" />

        {selectedUsers.length > 0 ? (
          selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 text-xs font-bold animate-in fade-in duration-100"
            >
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=06b6d4&color=fff`}
                alt={user.first_name}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
              />
              <span>{user.first_name} {user.last_name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleUser(user.id);
                }}
                className="p-0.5 hover:bg-emerald-500/20 rounded-md text-emerald-300 transition-all cursor-pointer"
                title="Remove Member"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-text-muted italic flex-1">
            Unassigned (Click to search & assign members)
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 pl-1">
          {selectedUsers.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-1 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-all cursor-pointer text-[10px] font-semibold"
              title="Clear All Assignees"
            >
              Clear
            </button>
          )}
          <Search className="w-3.5 h-3.5 text-text-muted" />
        </div>
      </div>

      {/* Permission Scope Notice Badge */}
      {boardVisibility === "private" && (
        <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1 font-medium">
          <Shield className="w-3 h-3" />
          <span>Exclusive Board: Only invited members can be assigned</span>
        </p>
      )}

      {/* Search & Selection Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-900 border border-border/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-72">
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-border/60 bg-surface-850/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or @username..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
            {/* Clear / Unassigned Option */}
            <div
              onClick={() => {
                onChange([]);
                setIsOpen(false);
              }}
              className={`p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                selectedIds.length === 0 ? "bg-primary/10 text-primary font-bold" : "hover:bg-surface-800 text-text-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-800 border border-border flex items-center justify-center text-text-muted">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>Unassigned (No members)</span>
              </div>
              {selectedIds.length === 0 && <Check className="w-4 h-4 text-primary" />}
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-xs text-text-muted italic">Loading members...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                {searchQuery ? `No members match "${searchQuery}"` : "No members available for assignment."}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                        : "hover:bg-surface-800 text-text-primary border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=06b6d4&color=fff`}
                        alt={user.first_name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-semibold">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="text-[10px] text-text-muted truncate">
                          @{user.username || user.first_name}
                        </span>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
