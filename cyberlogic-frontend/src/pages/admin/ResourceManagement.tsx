import { useState, useEffect } from "react";
import { Trash2, Download, ExternalLink, Check, X, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  fetchResources,
  approveResource,
  rejectResource,
  deleteResource,
  type ResourceMapped,
} from "../../utils/api";
import { DataTable } from "../../components/ui";

export default function ResourceManagement() {
  const [resources, setResources] = useState<ResourceMapped[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const data = await fetchResources(params);
      setResources(data);
    } catch (err) {
      console.error("Failed to load resources for admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    try {
      await approveResource(id);
      loadResources();
    } catch (err) {
      console.error("Failed to approve resource:", err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectResource(id);
      loadResources();
    } catch (err) {
      console.error("Failed to reject resource:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteResource(id);
      loadResources();
    } catch (err) {
      console.error("Failed to delete resource:", err);
    }
  };

  const categoryColors: Record<string, string> = {
    Tutorials: "bg-primary/10 text-primary border-primary/20",
    Documents: "bg-info/10 text-info border-info/20",
    Tools: "bg-accent/10 text-accent border-accent/20",
    Links: "bg-success/10 text-success border-success/20",
  };

  const resourceColumns = [
    {
      header: "Resource",
      accessor: (r: ResourceMapped) => (
        <div>
          <p className="text-sm font-semibold text-text-primary">{r.title}</p>
          <p className="text-xs text-text-muted truncate max-w-sm mt-0.5">{r.description}</p>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any,
    },
    {
      header: "Submitter",
      accessor: (r: ResourceMapped) => (
        <div className="flex items-center gap-2">
          {r.user ? (
            <>
              <img src={r.user.avatar} className="w-5 h-5 rounded-full object-cover" alt={r.user.name} />
              <span className="text-xs text-text-primary">{r.user.name}</span>
            </>
          ) : (
            <span className="text-xs text-text-muted">System</span>
          )}
        </div>
      ),
    },
    {
      header: "Category",
      accessor: (r: ResourceMapped) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[r.category] || "bg-surface-700 text-text-muted"} border`}>
          {r.category}
        </span>
      ),
      sortable: true,
      sortKey: "category" as any,
      className: "hidden sm:table-cell",
    },
    {
      header: "Status",
      accessor: (r: ResourceMapped) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            r.status === "approved"
              ? "bg-success/10 text-success border-success/20"
              : r.status === "rejected"
              ? "bg-error/10 text-error border-error/20"
              : "bg-warning/10 text-warning border-warning/20"
          }`}
        >
          {r.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
          {r.status === "rejected" && <XCircle className="w-3 h-3" />}
          {r.status === "pending" && <Clock className="w-3 h-3" />}
          {r.status.toUpperCase()}
        </span>
      ),
      sortable: true,
      sortKey: "status" as any,
    },
    {
      header: "Downloads",
      accessor: (r: ResourceMapped) => (
        <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
          <Download className="w-3 h-3 text-primary/70" /> {r.downloadCount}
        </span>
      ),
      sortable: true,
      sortKey: "downloadCount" as any,
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: (r: ResourceMapped) => (
        <div className="flex items-center justify-end gap-1">
          <a
            href={r.filePathUrl || r.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-text-muted hover:text-info hover:bg-white/5 transition-colors cursor-pointer"
            title="Open"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {r.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors cursor-pointer"
                title="Approve"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReject(r.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                title="Reject"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  const resourceFilters = [
    {
      label: "Category",
      field: "category",
      options: [
        { label: "Tutorials", value: "Tutorials" },
        { label: "Documents", value: "Documents" },
        { label: "Tools", value: "Tools" },
        { label: "Links", value: "Links" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Resource Moderation
          </h1>
          <p className="text-sm text-text-muted mt-1">{resources.length} total resources</p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-surface-950/40 p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-primary/20 text-primary border border-primary/20"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-warning/20 text-warning border border-warning/20"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === "approved"
                ? "bg-success/20 text-success border border-success/20"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === "rejected"
                ? "bg-error/20 text-error border border-error/20"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading resources...</p>
        </div>
      ) : (
        <DataTable
          data={resources}
          columns={resourceColumns}
          filterGroups={resourceFilters}
          searchPlaceholder="Search resources..."
          emptyStateText="No resources found matching the criteria."
        />
      )}
    </div>
  );
}
