import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
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
  ArrowDown,
  Activity
} from "lucide-react";
import { Button, Card, DataTable } from "../../components/ui";
import { useAuth, apiRequest } from "../../context/AuthContext";
import { useDialog } from "../../utils/useDialog";
import { 
  createChatChannel, 
  updateChatChannel, 
  deleteChatChannel, 
  reorderChatChannels,
  type DbChatChannel 
} from "../../utils/api";

const availableRoles = ["member", "admin", "superadmin"];

const availableIcons = [
  { value: "Hash", label: "Hash (#)" },
  { value: "Sparkles", label: "Sparkles (Welcome)" },
  { value: "Megaphone", label: "Megaphone (News)" },
  { value: "FileText", label: "File Text (Rules)" },
  { value: "Laugh", label: "Laugh (Fun)" },
  { value: "BookOpen", label: "Book Open (Study)" },
  { value: "HeartHandshake", label: "Heart Handshake (Support)" },
  { value: "HelpCircle", label: "Help Circle (FAQ)" },
  { value: "Activity", label: "Activity (System/Logs)" }
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
    case "Activity":
      return <Activity className={className} />;
    default:
      return <Hash className={className} />;
  }
};

export default function ChatManagement() {
  const { user: currentUser } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [channels, setChannels] = useState<DbChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<DbChatChannel | null>(null);

  // Compute unique groupings from existing channels for the select-or-type dropdown
  const defaultGroupings = ["Welcome & Info", "General Discussions", "Academic & Help", "System"];
  const uniqueGroupings = Array.from(
    new Set([
      ...defaultGroupings,
      ...channels.map((ch) => ch.grouping).filter(Boolean),
    ])
  );

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

  // Tabs & Library States
  const [activeTab, setActiveTab] = useState<"channels" | "library">("channels");
  const [library, setLibrary] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCategory, setMediaCategory] = useState("");
  const [searchLibraryQuery, setSearchLibraryQuery] = useState("");

  // Infinite Scroll States
  const [libraryOffset, setLibraryOffset] = useState(0);
  const [libraryHasMore, setLibraryHasMore] = useState(true);
  const [libraryLoadingMore, setLibraryLoadingMore] = useState(false);
  const LIBRARY_LIMIT = 15;
  const observerTargetRef = useRef<HTMLDivElement>(null);

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

  const loadLibrary = async (isInitial = false) => {
    const currentOffset = isInitial ? 0 : libraryOffset;
    try {
      if (isInitial) {
        setLibraryLoading(true);
      } else {
        setLibraryLoadingMore(true);
      }
      const res = await apiRequest(
        `/api/chat/gifs?limit=${LIBRARY_LIMIT}&offset=${currentOffset}&search=${encodeURIComponent(
          searchLibraryQuery
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        if (isInitial) {
          setLibrary(data);
        } else {
          setLibrary((prev) => [...prev, ...data]);
        }
        setLibraryOffset(currentOffset + data.length);
        if (data.length < LIBRARY_LIMIT) {
          setLibraryHasMore(false);
        } else {
          setLibraryHasMore(true);
        }
      }
    } catch (err) {
      console.error("Failed to load library:", err);
    } finally {
      setLibraryLoading(false);
      setLibraryLoadingMore(false);
    }
  };

  const loadMoreLibrary = () => {
    loadLibrary(false);
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (activeTab === "library") {
      setLibraryOffset(0);
      setLibraryHasMore(true);
      loadLibrary(true);
    }
  }, [activeTab, searchLibraryQuery]);

  // Set up Intersection Observer for infinite loading
  useEffect(() => {
    if (activeTab !== "library" || !libraryHasMore || libraryLoading || libraryLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreLibrary();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTargetRef.current) {
      observer.observe(observerTargetRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, libraryHasMore, libraryLoading, libraryLoadingMore, libraryOffset]);

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

  const handleOpenAddMedia = () => {
    setMediaTitle("");
    setMediaUrl("");
    setMediaCategory("Reaction");
    setErrorMsg("");
    setShowLibraryModal(true);
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim() || !mediaUrl.trim()) return;

    try {
      const res = await apiRequest("/api/admin/chat/gifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mediaTitle,
          url: mediaUrl,
          category: mediaCategory.trim() || null,
        }),
      });

      if (res.ok) {
        setShowLibraryModal(false);
        setMediaTitle("");
        setMediaUrl("");
        setMediaCategory("Reaction");
        setLibraryOffset(0);
        setLibraryHasMore(true);
        loadLibrary(true);
        showAlert({
          title: "Success",
          message: "Media link added successfully",
          type: "success",
        });
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to add media link");
      }
    } catch (err) {
      console.error("Error adding media:", err);
      setErrorMsg("Something went wrong");
    }
  };

  const handleDeleteMedia = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Media",
      message: "Are you sure you want to delete this media link from the library? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      const res = await apiRequest(`/api/admin/chat/gifs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadLibrary();
        showAlert({
          title: "Success",
          message: "Media link deleted successfully",
          type: "success",
        });
      } else {
        showAlert({
          title: "Error",
          message: "Failed to delete media link",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      showAlert({
        title: "Error",
        message: "Something went wrong",
        type: "error",
      });
    }
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
      showAlert({
        title: "Access Denied",
        message: "Only the superadmin can delete chat channels.",
        type: "error",
      });
      return;
    }

    const confirmed = await showConfirm({
      title: "Delete Channel",
      message: "Are you sure you want to permanently delete this chat channel and all of its messages? This cannot be undone.",
      type: "danger",
      confirmText: "Delete",
    });

    if (confirmed) {
      try {
        await deleteChatChannel(id);
        loadChannels();
      } catch (err: any) {
        showAlert({
          title: "Delete Failed",
          message: err.message || "Failed to delete channel.",
          type: "error",
        });
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
      accessor: (ch: DbChatChannel) => {
        const index = channels.findIndex((c) => c.id === ch.id);
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => handleMoveChannel(index, "up")}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index < 0 || index === channels.length - 1}
              onClick={() => handleMoveChannel(index, "down")}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
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
              {ch.is_protected && (
                <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 select-none">
                  <Lock className="w-2.5 h-2.5" /> Protected
                </span>
              )}
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
          {ch.is_protected ? (
            <span className="text-[10px] font-bold text-text-muted/50 px-2 py-1 bg-surface-800 border border-border/30 rounded-lg flex items-center gap-1 select-none mr-1">
              <Lock className="w-3 h-3 text-text-muted/30" /> Locked
            </span>
          ) : (
            <>
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
            </>
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

  // No client-side filtering needed as search is executed on the backend now.

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Chat System Administration
          </h1>
          <p className="text-sm text-text-muted mt-1">Configure chat channels, set permissions, and manage the reaction GIF/image library.</p>
        </div>
        {activeTab === "channels" ? (
          <Button
            type="button"
            variant="admin"
            icon={<Plus className="w-4 h-4" />}
            className="px-4 py-2.5 cursor-pointer"
            onClick={handleOpenCreate}
          >
            Create Channel
          </Button>
        ) : (
          <Button
            type="button"
            variant="admin"
            icon={<Plus className="w-4 h-4" />}
            className="px-4 py-2.5 cursor-pointer"
            onClick={handleOpenAddMedia}
          >
            Add Saved Media
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === "channels"
              ? "text-primary border-primary bg-primary/5"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          Chat Channels
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === "library"
              ? "text-primary border-primary bg-primary/5"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          GIF & Image Library
        </button>
      </div>

      {activeTab === "channels" ? (
        isLoading ? (
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
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search GIFs/images by title or category..."
              value={searchLibraryQuery}
              onChange={(e) => setSearchLibraryQuery(e.target.value)}
              className="flex-1 max-w-md px-3.5 py-2.5 rounded-xl bg-surface-900 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {libraryLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-xs text-text-muted">Loading media library...</p>
            </div>
          ) : library.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/40 rounded-2xl bg-surface-900/30">
              <p className="text-sm text-text-muted">No saved media found matching search terms.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {library.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col bg-surface-900 border border-border/60 hover:border-primary/40 rounded-2xl overflow-hidden transition-all shadow-md"
                  >
                    <div className="relative aspect-video w-full bg-surface-950 flex items-center justify-center overflow-hidden border-b border-border/40">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-error/90 hover:bg-error border border-error/25 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                        title="Delete media link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3.5 flex flex-col flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{item.title}</p>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                          {item.category || "General"}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            showAlert({
                              title: "Copied",
                              message: "Direct link copied to clipboard!",
                              type: "info",
                            });
                          }}
                          className="text-[10px] text-text-muted hover:text-text-primary underline cursor-pointer truncate max-w-[100px]"
                        >
                          Copy URL
                        </button>
                      </div>

                      {/* Uploader user info tracing tag */}
                      {item.user ? (
                        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-border/40 min-w-0">
                          <img src={item.user.avatar} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                          <span className="text-[10px] text-text-muted truncate">
                            By {item.user.first_name} {item.user.last_name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-border/40 min-w-0">
                          <div className="w-4 h-4 rounded-full bg-surface-850 flex items-center justify-center text-[7px] font-bold text-text-muted flex-shrink-0 border border-border/30">S</div>
                          <span className="text-[10px] text-text-muted truncate">System Seeded</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Observer target for scroll infinite loading */}
              {libraryHasMore && (
                <div ref={observerTargetRef} className="flex justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
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
                    list="grouping-list"
                    required
                    value={grouping}
                    onChange={(e) => setGrouping(e.target.value)}
                    placeholder="Select grouping or type custom..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  />
                  <datalist id="grouping-list">
                    {uniqueGroupings.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
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
      {/* Saved Media Addition Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 border border-border bg-surface-900 shadow-2xl relative">
            <h2 className="text-lg font-bold text-text-primary mb-1">
              Add Saved Media
            </h2>
            <p className="text-xs text-text-muted mb-4">
              Add a popular GIF or image URL shortcut to make it easily accessible inside the chat.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddMedia} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Media Title *</label>
                <input
                  type="text"
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Excited Celebration"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">GIF/Image URL *</label>
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://media.giphy.com/media/.../giphy.gif"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Category Grouping *</label>
                <select
                  value={mediaCategory}
                  onChange={(e) => setMediaCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                >
                  <option value="Reaction">Reaction</option>
                  <option value="Funny">Funny</option>
                  <option value="Agree">Agree</option>
                  <option value="Shocked">Shocked</option>
                  <option value="Thanks">Thanks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-4 py-2 cursor-pointer"
                  onClick={() => setShowLibraryModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="admin" className="px-4 py-2 cursor-pointer">
                  Save to Library
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
