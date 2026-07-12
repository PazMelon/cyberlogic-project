import { useState, useEffect } from "react";
import { Check, Trash2, Clock, AlertTriangle, User } from "lucide-react";
import { Button, DataTable, PromptDialog } from "../../components/ui";
import { apiRequest, useAuth } from "../../context/AuthContext";
import { useDialog } from "../../utils/useDialog";
import { useSEO } from "../../utils/useSEO";

interface FlaggedMessage {
  id: number;
  content: string;
  flagged_reason: string;
  moderation_status: string;
  channel_name: string;
  channel_slug: string;
  created_at: string;
  author_name: string;
  author_email: string;
  author_avatar: string | null;
  author_role: string;
}

export default function FreedomWallModeration() {
  useSEO({
    title: "Message Moderation",
    description: "Review flagged chat messages and manage community posts.",
  });

  const { showAlert, showConfirm } = useDialog();
  const { user: currentUser } = useAuth();
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingMessageId, setRejectingMessageId] = useState<number | null>(null);

  const isSuperAdmin = currentUser?.role === "superadmin";

  const loadFlaggedMessages = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest("/api/admin/chat/flagged");
      if (res.ok) {
        const data = await res.json();
        setFlaggedMessages(data);
      } else {
        showAlert({
          title: "Error Loading",
          message: "Failed to load flagged messages from server.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error loading flagged messages:", err);
      showAlert({
        title: "Connection Error",
        message: "An error occurred while loading flagged messages.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlaggedMessages();
  }, []);

  const handleApprove = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Approve Message?",
      message: "This will dismiss the AI flag and publish the message. Are you sure?",
      type: "info",
    });
    if (!confirmed) return;

    try {
      const res = await apiRequest(`/api/admin/chat/messages/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        showAlert({
          title: "Message Approved",
          message: "Message approved and published successfully.",
          type: "success",
        });
        loadFlaggedMessages();
      } else {
        showAlert({
          title: "Action Failed",
          message: "Failed to approve message.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error approving message:", err);
      showAlert({
        title: "Error occurred",
        message: "An error occurred while approving the message.",
        type: "error",
      });
    }
  };

  const handleReject = (id: number) => {
    setRejectingMessageId(id);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingMessageId) return;
    const id = rejectingMessageId;
    setRejectingMessageId(null);

    try {
      const res = await apiRequest(`/api/admin/chat/messages/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) {
        showAlert({
          title: "Message Rejected",
          message: "Message rejected and deleted.",
          type: "success",
        });
        loadFlaggedMessages();
      } else {
        showAlert({
          title: "Action Failed",
          message: "Failed to reject message.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error rejecting message:", err);
      showAlert({
        title: "Error occurred",
        message: "An error occurred while rejecting the message.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Flagged Content",
      accessor: (row: FlaggedMessage) => (
        <div className="max-w-md">
          <p className="text-sm font-medium text-text-primary bg-surface-950/40 p-3 rounded-xl border border-border/30 whitespace-pre-wrap break-words italic">
            "{row.content}"
          </p>
        </div>
      ),
    },
    {
      header: "AI Flag Reason",
      accessor: (row: FlaggedMessage) => (
        <div className="flex items-center gap-1.5 text-xs text-error font-semibold uppercase tracking-wider bg-error/10 border border-error/25 px-2.5 py-1 rounded-full w-fit">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{row.flagged_reason}</span>
        </div>
      ),
      sortable: true,
      sortKey: "flagged_reason" as keyof FlaggedMessage,
    },
    {
      header: "Author Details",
      accessor: (row: FlaggedMessage) => {
        if (!isSuperAdmin) {
          return (
            <div className="flex items-center gap-2 text-xs text-text-muted italic bg-white/5 px-2.5 py-1 rounded-full border border-border/35 w-fit">
              <User className="w-3.5 h-3.5" />
              <span>Anonymous (Restricted)</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <img
              src={row.author_avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
              alt={row.author_name}
              className="w-9 h-9 rounded-full object-cover border border-border bg-surface-800"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">{row.author_name}</span>
              <span className="text-[10px] text-text-muted truncate max-w-[150px]">{row.author_email}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-500/80 mt-0.5">
                {row.author_role}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Flagged At",
      accessor: (row: FlaggedMessage) => (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <span>{new Date(row.created_at).toLocaleString()}</span>
        </div>
      ),
      sortable: true,
      sortKey: "created_at" as keyof FlaggedMessage,
    },
    {
      header: "Actions",
      accessor: (row: FlaggedMessage) => (
        <div className="flex items-center gap-2">
          <Button
            variant="success"
            className="px-3 py-1.5 cursor-pointer"
            icon={<Check className="w-3.5 h-3.5" />}
            onClick={() => handleApprove(row.id)}
          >
            <span>Approve</span>
          </Button>
          <Button
            variant="danger"
            className="px-3 py-1.5 cursor-pointer"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => handleReject(row.id)}
          >
            <span>Reject</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Message Moderation
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {flaggedMessages.length} flagged messages pending review · {isSuperAdmin ? "Superadmin View (Author Visible)" : "Officer View (Author Hidden)"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading flagged messages...</p>
        </div>
      ) : (
        <DataTable
          data={flaggedMessages}
          columns={columns}
          searchPlaceholder="Search flagged messages content or reason..."
          searchField={(row: FlaggedMessage) => row.content + " " + row.flagged_reason}
          emptyStateText="No flagged messages pending review."
        />
      )}

      <PromptDialog
        isOpen={rejectingMessageId !== null}
        title="Reject & Delete Message"
        message="Please provide a reason for rejecting/deleting this message. This will permanently hide and soft-delete it."
        placeholder="Enter rejection reason..."
        confirmText="Reject Message"
        onConfirm={handleConfirmReject}
        onClose={() => setRejectingMessageId(null)}
      />
    </div>
  );
}
