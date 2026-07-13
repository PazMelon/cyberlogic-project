import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Flag, Trash2, Eye, Check, AlertTriangle, Clock, Activity } from "lucide-react";
import { fetchAdminReports, updateReportStatus, deleteReport, type DbReport } from "../../utils/api";
import { Button, Card, Badge, DataTable, type ColumnDef } from "../../components/ui";
import { useDialog } from "../../utils/useDialog";
import { useSEO } from "../../utils/useSEO";

export default function ReportManagement() {
  useSEO({
    title: "Content Reports Moderation",
    description: "Moderate reported forum threads, comments, and project showcases.",
  });

  const { showAlert, showConfirm } = useDialog();
  const [reports, setReports] = useState<DbReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAdminReports();
      setReports(data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      showAlert({
        title: "Error Loading Reports",
        message: err.message || "Failed to retrieve content reports.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAction = async (id: number, action: "remove" | "dismiss") => {
    const actionLabel = action === "remove" ? "Delete Content?" : "Dismiss Report?";
    const actionMsg = action === "remove"
      ? "This will permanently delete the reported content and notify the author. Proceed?"
      : "This will dismiss the user report and keep the content active. Proceed?";

    const confirmed = await showConfirm({
      title: actionLabel,
      message: actionMsg,
      type: action === "remove" ? "danger" : "info",
      confirmText: action === "remove" ? "Remove Content" : "Dismiss Report",
    });

    if (!confirmed) return;

    try {
      const response = await updateReportStatus(id, action);
      if (response.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "resolved", action_taken: action === "remove" ? "removed" : "dismissed" } : r))
        );
        showAlert({
          title: "Report Resolved",
          message: `The report was successfully resolved with action: ${action === "remove" ? "Content Removed" : "Dismissed"}.`,
          type: "success",
        });
      }
    } catch (err: any) {
      console.error("Failed to resolve report:", err);
      showAlert({
        title: "Action Failed",
        message: err.message || "Failed to perform action on report.",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Report Log",
      message: "Are you sure you want to permanently delete this report log from the history?",
      type: "danger",
      confirmText: "Delete Log",
    });

    if (!confirmed) return;

    try {
      const response = await deleteReport(id);
      if (response.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        showAlert({
          title: "Report Log Deleted",
          message: "The report history log was deleted successfully.",
          type: "success",
        });
      }
    } catch (err: any) {
      console.error("Failed to delete report:", err);
      showAlert({
        title: "Deletion Failed",
        message: err.message || "Failed to delete report log.",
        type: "error",
      });
    }
  };

  const columns: ColumnDef<DbReport>[] = [
    {
      header: "Flagged Content Preview",
      accessor: (row) => (
        <div className="max-w-md">
          <p className="text-sm font-medium text-text-primary bg-surface-950/40 p-3 rounded-xl border border-border/30 whitespace-pre-wrap break-words italic">
            "{row.reportable_title}"
          </p>
        </div>
      ),
    },
    {
      header: "Flag details",
      accessor: (row) => (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={
                row.reportable_type === "thread"
                  ? "primary"
                  : row.reportable_type === "comment"
                  ? "accent"
                  : "success"
              }
              className="capitalize text-[10px]"
            >
              {row.reportable_type}
            </Badge>
            <span className="text-xs text-error font-bold tracking-wide uppercase bg-error/10 border border-error/25 px-2 py-0.5 rounded-full w-fit">
              {row.reason}
            </span>
          </div>
          {row.details && (
            <p className="text-[10px] text-text-muted bg-surface-950/20 p-2 rounded-lg border border-border/20 max-w-[200px] leading-snug">
              {row.details}
            </p>
          )}
        </div>
      ),
      sortable: true,
      sortKey: "reason",
    },
    {
      header: "Content Owner",
      accessor: (row) => {
        if (!row.content_owner) {
          return <span className="text-xs text-text-muted italic">Unknown / Deleted</span>;
        }

        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">{row.content_owner.name}</span>
              {row.content_link && row.content_exists ? (
                <Link
                  to={row.content_link}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Eye className="w-3 h-3" /> View content
                </Link>
              ) : (
                <span className="text-[10px] text-text-muted italic mt-0.5">Deleted from DB</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Reported At",
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <span>{new Date(row.created_at).toLocaleString()}</span>
        </div>
      ),
      sortable: true,
      sortKey: "created_at",
    },
    {
      header: "Status / Actions",
      accessor: (row) => {
        if (row.status !== "pending") {
          const isRemoved = row.action_taken === "removed";
          return (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isRemoved
                    ? "bg-error/10 text-error border-error/20"
                    : "bg-success/10 text-success border-success/20"
                }`}
              >
                {isRemoved ? "REMOVED" : "DISMISSED"}
              </span>
              <button
                onClick={() => handleDelete(row.id)}
                className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-border text-text-muted hover:text-error transition-all cursor-pointer"
                title="Delete Report Log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              className="px-3 py-1.5 cursor-pointer text-xs font-semibold"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={() => handleAction(row.id, "dismiss")}
            >
              <span>Dismiss</span>
            </Button>
            <Button
              variant="danger"
              className="px-3 py-1.5 cursor-pointer text-xs font-semibold"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => handleAction(row.id, "remove")}
            >
              <span>Remove</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredReports = reports.filter((report) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return report.status === "pending";
    if (statusFilter === "approved") return report.status === "resolved" && report.action_taken === "dismissed"; // dismissed = approved content
    if (statusFilter === "rejected") return report.status === "resolved" && report.action_taken === "removed"; // removed = rejected content
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Content Reports Moderation
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Review reported forum threads, comments, and project showcases to ensure community compliance.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadReports}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
        >
          <Flag className="w-3.5 h-3.5" /> Refresh List
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface-900/60 border-border/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-heading">
                Pending Reports
              </span>
              <span className="text-2xl font-black text-error mt-1">
                {reports.filter((r) => r.status === "pending").length}
              </span>
              <span className="text-[10px] text-text-muted mt-1.5 font-medium">
                Awaiting moderator reviews
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center text-error border border-error/10">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface-900/60 border-border/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-heading">
                Total Removed
              </span>
              <span className="text-2xl font-black text-text-primary mt-1">
                {reports.filter((r) => r.action_taken === "removed").length}
              </span>
              <span className="text-[10px] text-text-muted mt-1.5 font-medium">
                Flagged items permanently deleted
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary border border-primary/10">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface-900/60 border-border/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-heading">
                Total Dismissed
              </span>
              <span className="text-2xl font-black text-success mt-1">
                {reports.filter((r) => r.action_taken === "dismissed").length}
              </span>
              <span className="text-[10px] text-text-muted mt-1.5 font-medium">
                Flags cleared and content approved
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center text-success border border-success/10">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border gap-2 overflow-x-auto whitespace-nowrap no-scrollbar pb-px">
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            statusFilter === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Pending Review
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("approved")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            statusFilter === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Approved History (Dismissed Reports)
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("rejected")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            statusFilter === "rejected"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Rejected History (Removed Content)
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            statusFilter === "all"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          All Reports
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading content reports...</p>
        </div>
      ) : (
        <DataTable
          data={filteredReports}
          columns={columns}
          searchPlaceholder="Search reports by preview, reason, or details..."
          searchField={(row: DbReport) => row.reportable_title + " " + row.reason + " " + (row.details || "")}
          emptyStateText={`No reports found in ${statusFilter === "pending" ? "pending reviews" : statusFilter === "approved" ? "approved history" : statusFilter === "rejected" ? "rejected history" : "all logs"}.`}
          enablePagination
          defaultItemsPerPage={10}
        />
      )}
    </div>
  );
}
