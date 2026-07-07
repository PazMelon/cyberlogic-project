import { useState, useEffect } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  Sparkles, 
  Megaphone, 
  FileText, 
  Laugh, 
  BookOpen, 
  HeartHandshake, 
  HelpCircle, 
  Hash,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button, Card, DataTable } from "../../components/ui";
import { useAuth, apiRequest } from "../../context/AuthContext";
import { 
  createChatChannel, 
  updateChatChannel, 
  deleteChatChannel, 
  reorderChatChannels,
  type DbChatChannel 
} from "../../utils/api";

const availableRoles = ["member", "officer", "admin", "superadmin"];

const availableIcons = [
  { value: "Hash", label: "Hash (#)" },
  { value: "Sparkles", label: "Sparkles (Welcome)" },
  { value: "Megaphone", label: "Megaphone (News)" },
  { value: "FileText", label: "File Text (Rules)" },
  { value: "Laugh", label: "Laugh (Fun)" },
  { value: "BookOpen", label: "Book Open (Study)" },
  { value: "HeartHandshake", label: "Heart Handshake (Support)" },
  { value: "HelpCircle", label: "Help Circle (FAQ)" }
];

const ChannelIcon = ({ iconName, className }: { iconName?: string | null; className?: string }) => {
  switch (iconName) {
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Megaphone":
      return <Megaphone className={className} />;
    case "FileText":
      return <FileText className={className} />;
    case "Laugh":
      return <Laugh className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "HeartHandshake":
      return <HeartHandshake className={className} />;
    case "HelpCircle":
      return <HelpCircle className={className} />;
    default:
      return <Hash className={className} />;
  }
};

export default function ChatManagement() {
  const { user: currentUser } = useAuth();
  const [channels, setChannels] = useState<DbChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<DbChatChannel | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"group" | "dm">("group");
  const [icon, setIcon] = useState("Hash");
  const [grouping, setGrouping] = useState("General");
  const [allowedRoles, setAllowedRoles] = useState<string[]>(availableRoles);
  const [writeRoles, setWriteRoles] = useState<string[]>(availableRoles);
  const [isArchived, setIsArchived] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest("/api/chat/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (err) {
      console.error("Failed to load channels:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleOpenCreate = () => {
    setEditingChannel(null);
    setName("");
    setDescription("");
    setType("group");
    setIcon("Hash");
    setGrouping("General Discussions");
    setAllowedRoles(availableRoles);
    setWriteRoles(availableRoles);
    setIsArchived(false);
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEdit = (channel: DbChatChannel) => {
    setEditingChannel(channel);
    setName(channel.name);
    setDescription(channel.description || "");
    setType(channel.type);
    setIcon(channel.icon || "Hash");
    setGrouping(channel.grouping || "General Discussions");
    setAllowedRoles(channel.allowed_roles || availableRoles);
    setWriteRoles(channel.write_roles || availableRoles);
    setIsArchived(channel.is_archived);
    setErrorMsg("");
    setShowModal(true);
  };

  const handleRoleToggle = (role: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(role)) {
      setList(list.filter((r) => r !== role));
    } else {
      setList([...list, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setErrorMsg("");
      const payload = {
        name,
        description,
        type,
        icon,
        grouping,
        allowed_roles: allowedRoles,
        write_roles: writeRoles,
        is_archived: isArchived,
      };

      if (editingChannel) {
        await updateChatChannel(editingChannel.id, payload);
      } else {
        await createChatChannel(payload);
      }

      setShowModal(false);
      loadChannels();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    }
  };

  const handleDelete = async (id: number) => {
    if (currentUser?.role !== "superadmin") {
      alert("Only the superadmin can delete chat channels.");
      return;
    }

    if (confirm("Are you sure you want to permanently delete this chat channel and all of its messages? This cannot be undone.")) {
      try {
        await deleteChatChannel(id);
        loadChannels();
      } catch (err: any) {
        alert(err.message || "Failed to delete channel.");
      }
    }
  };

  const handleMoveChannel = async (index: number, direction: "up" | "down") => {
    const newChannels = [...channels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newChannels.length) return;

    // Swap elements
    const temp = newChannels[index];
    newChannels[index] = newChannels[targetIndex];
    newChannels[targetIndex] = temp;

    // Set state immediately for smooth UI feedback
    setChannels(newChannels);

    try {
      const ids = newChannels.map((c) => c.id);
      await reorderChatChannels(ids);
    } catch (err: any) {
      console.error("Failed to save channel order:", err);
      loadChannels(); // Rollback to database state
    }
  };

  const channelColumns = [
    {
      header: "Sorting",
      accessor: (_ch: DbChatChannel, index: number) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => handleMoveChannel(index, "up")}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === channels.length - 1}
            onClick={() => handleMoveChannel(index, "down")}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: "w-20"
    },
    {
      header: "Channel",
      accessor: (ch: DbChatChannel) => (
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-surface-800 border border-border/40 text-primary flex-shrink-0 mt-0.5">
            <ChannelIcon iconName={ch.icon} className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              {ch.name}
              {ch.is_archived && (
                <span className="text-[10px] bg-warning/10 border border-warning/20 text-warning px-1.5 py-0.5 rounded font-bold uppercase">
                  Archived
                </span>
              )}
            </p>
            <p className="text-xs text-text-muted truncate max-w-xs mt-0.5">{ch.description || "No description."}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name" as any,
    },
    {
      header: "Group Category",
      accessor: (ch: DbChatChannel) => (
        <span className="text-xs font-semibold text-text-secondary bg-surface-800 border border-border/30 px-2.5 py-1 rounded-lg">
          {ch.grouping}
        </span>
      ),
      sortable: true,
      sortKey: "grouping" as any,
    },
    {
      header: "View Permission",
      accessor: (ch: DbChatChannel) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {ch.allowed_roles ? (
            ch.allowed_roles.map((role) => (
              <span key={role} className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded capitalize">
                {role}
              </span>
            ))
          ) : (
            <span className="text-[9px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded capitalize">
              everyone
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Write Permission",
      accessor: (ch: DbChatChannel) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {ch.write_roles ? (
            ch.write_roles.map((role) => (
              <span key={role} className="text-[9px] font-bold bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded capitalize">
                {role}
              </span>
            ))
          ) : (
            <span className="text-[9px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded capitalize">
              everyone
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (ch: DbChatChannel) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(ch)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
            title="Edit settings"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {currentUser?.role === "superadmin" && (
            <button
              type="button"
              onClick={() => handleDelete(ch.id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
              title="Delete channel"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  const channelFilters = [
    {
      label: "Group Category",
      field: "grouping",
      options: Array.from(new Set(channels.map(ch => ch.grouping || "General"))).map(group => ({
        label: group,
        value: group
      }))
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Chat Channel Management
          </h1>
          <p className="text-sm text-text-muted mt-1">Create or modify chat channels, customize icons, groupings, and permissions</p>
        </div>
        <Button
          type="button"
          variant="admin"
          icon={<Plus className="w-4 h-4" />}
          className="px-4 py-2.5 cursor-pointer"
          onClick={handleOpenCreate}
        >
          Create Channel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading channels...</p>
        </div>
      ) : (
        <DataTable
          data={channels}
          columns={channelColumns}
          filterGroups={channelFilters}
          searchPlaceholder="Search chat channels..."
          emptyStateText="No chat channels configured."
        />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 border border-border bg-surface-900 shadow-2xl relative">
            <h2 className="text-lg font-bold text-text-primary mb-1">
              {editingChannel ? "Edit Chat Channel" : "Create Chat Channel"}
            </h2>
            <p className="text-xs text-text-muted mb-4">
              {editingChannel ? "Modify settings, grouping categories, icons, and access privileges." : "Add a new room, select icons, groupings and set permissions."}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-text-secondary">Channel Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cyber Security"
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-text-secondary">Group Category Name *</label>
                  <input
                    type="text"
                    required
                    value={grouping}
                    onChange={(e) => setGrouping(e.target.value)}
                    placeholder="e.g. Academic & Help"
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of discussion topics..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-text-secondary">Channel Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none"
                  >
                    <option value="group">Group Channel</option>
                    <option value="dm">Direct Messages</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-text-secondary">Sidebar Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none"
                  >
                    {availableIcons.map((i) => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-7 col-span-1 pl-2">
                  <input
                    type="checkbox"
                    id="isArchived"
                    checked={isArchived}
                    onChange={(e) => setIsArchived(e.target.checked)}
                    className="rounded bg-surface-800 border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isArchived" className="text-xs font-semibold text-text-secondary cursor-pointer select-none">
                    Archive Channel
                  </label>
                </div>
              </div>

              {/* Roles checkboxes */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-primary" /> View Permission
                  </label>
                  <div className="space-y-1 bg-surface-950/40 p-2.5 rounded-xl border border-border/40">
                    {availableRoles.map((role) => (
                      <label key={role} className="flex items-center gap-2 text-xs text-text-muted cursor-pointer capitalize">
                        <input
                          type="checkbox"
                          checked={allowedRoles.includes(role)}
                          onChange={() => handleRoleToggle(role, allowedRoles, setAllowedRoles)}
                          className="rounded border-border text-primary focus:ring-0 w-3.5 h-3.5"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-accent" /> Write Permission
                  </label>
                  <div className="space-y-1 bg-surface-950/40 p-2.5 rounded-xl border border-border/40">
                    {availableRoles.map((role) => (
                      <label key={role} className="flex items-center gap-2 text-xs text-text-muted cursor-pointer capitalize">
                        <input
                          type="checkbox"
                          checked={writeRoles.includes(role)}
                          onChange={() => handleRoleToggle(role, writeRoles, setWriteRoles)}
                          className="rounded border-border text-primary focus:ring-0 w-3.5 h-3.5"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-4 py-2 cursor-pointer"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="admin" className="px-4 py-2 cursor-pointer">
                  {editingChannel ? "Save Changes" : "Create Channel"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
