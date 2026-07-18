import { useState, useEffect } from "react";
import { 
  Mail, 
  Trash2, 
  Archive, 
  RefreshCw, 
  X, 
  Clock, 
  User, 
  Eye
} from "lucide-react";
import { 
  fetchContactMessages, 
  updateContactMessage, 
  deleteContactMessage, 
  type ContactMessageItem 
} from "../../utils/api";
import { DataTable, type ColumnDef } from "../../components/ui";
import { useDialog } from "../../utils/useDialog";
import { useSEO } from "../../utils/useSEO";

export default function ContactMessages() {
  useSEO({
    title: "Contact Messages Inbox",
    description: "Manage guest and member submissions sent via the Contact Us form.",
  });

  const { showAlert, showConfirm } = useDialog();
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read" | "archived">("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await fetchContactMessages();
      setMessages(data);
    } catch (err: any) {
      console.error("Failed to load contact messages:", err);
      showAlert({
        title: "Load Failed",
        message: err.message || "Failed to retrieve contact messages.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleOpenMessage = async (msg: ContactMessageItem) => {
    setSelectedMessage(msg);
    if (msg.status === "unread") {
      try {
        await updateContactMessage(msg.id, "read");
        setMessages((prev) => 
          prev.map((m) => m.id === msg.id ? { ...m, status: "read" as const } : m)
        );
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    }
  };

  const handleUpdateStatus = async (id: number, status: "unread" | "read" | "archived") => {
    try {
      await updateContactMessage(id, status);
      setMessages((prev) => 
        prev.map((m) => m.id === id ? { ...m, status } : m)
      );
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => prev ? { ...prev, status } : null);
      }
      showAlert({
        title: "Success",
        message: `Message marked as ${status}.`,
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "Action Failed",
        message: err.message || "Failed to update message status.",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Message",
      message: "Are you sure you want to permanently delete this message? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
    });

    if (confirmed) {
      try {
        await deleteContactMessage(id);
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
        showAlert({
          title: "Deleted",
          message: "The message has been deleted.",
          type: "success",
        });
      } catch (err: any) {
        showAlert({
          title: "Delete Failed",
          message: err.message || "Failed to delete the message.",
          type: "error",
        });
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("default", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const contactColumns: ColumnDef<ContactMessageItem>[] = [
    {
      header: "Sender",
      accessor: (msg: ContactMessageItem) => {
        const isUnread = msg.status === "unread";
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isUnread 
                ? "bg-primary/10 border-primary/30 text-primary animate-pulse" 
                : "bg-surface-800 border-border/45 text-text-muted"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">{msg.name}</div>
              <div className="text-xs text-text-muted font-normal">{msg.email}</div>
            </div>
          </div>
        );
      },
      sortable: true,
      sortKey: "name",
    },
    {
      header: "Message",
      accessor: (msg: ContactMessageItem) => (
        <span className="text-text-secondary truncate max-w-xs md:max-w-md block">
          {msg.message}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: (msg: ContactMessageItem) => (
        <span className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(msg.created_at)}
        </span>
      ),
      sortable: true,
      sortKey: "created_at",
    },
    {
      header: "Status",
      accessor: (msg: ContactMessageItem) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
          msg.status === "unread"
            ? "bg-primary/10 text-primary border-primary/20"
            : msg.status === "read"
            ? "bg-success/10 text-success border-success/20"
            : "bg-surface-800 text-text-muted border-border/40"
        }`}>
          {msg.status}
        </span>
      ),
      sortable: true,
      sortKey: "status",
    },
    {
      header: "Actions",
      accessor: (msg: ContactMessageItem) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenMessage(msg)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
            title="Read Message"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {msg.status !== "archived" ? (
            <button
              type="button"
              onClick={() => handleUpdateStatus(msg.id, "archived")}
              className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-white/5 transition-colors cursor-pointer"
              title="Archive Message"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpdateStatus(msg.id, "unread")}
              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
              title="Mark Unread"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(msg.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-white/5 transition-colors cursor-pointer"
            title="Delete Message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  const filteredMessages = messages.filter((msg) => {
    return statusFilter === "all" || msg.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Contact Inbox
          </h1>
          <p className="text-sm text-text-muted mt-1">{messages.length} total messages</p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-surface-950/40 p-0.5 rounded-lg border border-border/50">
          {(["all", "unread", "read", "archived"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? tab === "unread"
                    ? "bg-primary/20 text-primary border border-primary/20"
                    : tab === "read"
                    ? "bg-success/20 text-success border border-success/20"
                    : tab === "archived"
                    ? "bg-surface-700 text-text-muted border border-surface-700"
                    : "bg-primary/20 text-primary border border-primary/20"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading messages...</p>
        </div>
      ) : (
        <DataTable
          data={filteredMessages}
          columns={contactColumns}
          searchPlaceholder="Search messages..."
          emptyStateText="No contact messages found matching the criteria."
          topActions={
            <button
              type="button"
              onClick={loadMessages}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          }
        />
      )}

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setSelectedMessage(null)}
          />
          
          <div className="relative glass rounded-3xl border border-border/80 w-full max-w-lg p-6 sm:p-8 animate-scaleIn max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6 overflow-y-auto pr-1">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Feedback Message</span>
                <h3 className="text-xl font-bold text-text-primary leading-tight font-[family-name:var(--font-heading)]">
                  {selectedMessage.name}
                </h3>
                <a 
                  href={`mailto:${selectedMessage.email}`}
                  className="text-xs text-primary hover:underline font-mono mt-1 inline-block"
                >
                  {selectedMessage.email}
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-surface-900 border border-border/50 text-text-secondary text-sm leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-text-muted border-t border-border/30 pt-4">
                <div className="flex items-center justify-between">
                  <span>Sent on:</span>
                  <span className="font-semibold text-text-secondary">{formatDate(selectedMessage.created_at)}</span>
                </div>
                {selectedMessage.fingerprint && (
                  <div className="flex items-center justify-between">
                    <span>Fingerprint ID:</span>
                    <span className="font-mono text-[10px] text-text-muted truncate max-w-[180px]" title={selectedMessage.fingerprint}>
                      {selectedMessage.fingerprint}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-text-secondary capitalize">{selectedMessage.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4 mt-6">
              {selectedMessage.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedMessage.id, "archived");
                    setSelectedMessage(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800 border border-border hover:border-warning/30 hover:bg-warning/5 text-xs font-semibold text-text-secondary hover:text-warning transition-all cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleDelete(selectedMessage.id);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800 border border-border hover:border-error/30 hover:bg-error/5 text-xs font-semibold text-text-secondary hover:text-error transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
