import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Download, ExternalLink } from "lucide-react";
import { resources } from "../../data/mockData";
import { Button, DataTable } from "../../components/ui";

export default function ResourceManagement() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const categoryColors: Record<string, string> = {
    Tutorials: "bg-primary/10 text-primary",
    Documents: "bg-info/10 text-info",
    Tools: "bg-accent/10 text-accent",
    Links: "bg-success/10 text-success",
  };

  const resourceColumns = [
    {
      header: "Resource",
      accessor: (r: any) => (
        <div>
          <p className="text-sm font-semibold text-text-primary">{r.title}</p>
          <p className="text-xs text-text-muted truncate max-w-sm mt-0.5">{r.description}</p>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any
    },
    {
      header: "Category",
      accessor: (r: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[r.category] || "bg-surface-700 text-text-muted"} border border-border/20`}>
          {r.category}
        </span>
      ),
      sortable: true,
      sortKey: "category" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Downloads",
      accessor: (r: any) => (
        <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
          <Download className="w-3 h-3 text-primary/70" /> {r.downloadCount}
        </span>
      ),
      sortable: true,
      sortKey: "downloadCount" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Actions",
      accessor: (r: any) => (
        <div className="flex items-center justify-end gap-1">
          <a href={r.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-text-muted hover:text-info hover:bg-white/5 transition-colors cursor-pointer" title="Open">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: "text-right"
    }
  ];

  const resourceFilters = [
    {
      label: "Category",
      field: "category",
      options: [
        { label: "Tutorials", value: "Tutorials" },
        { label: "Documents", value: "Documents" },
        { label: "Tools", value: "Tools" },
        { label: "Links", value: "Links" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Resources
          </h1>
          <p className="text-sm text-text-muted mt-1">{resources.length} total resources</p>
        </div>
        <Button
          type="button"
          variant="admin"
          icon={<Plus className="w-4 h-4" />}
          className="px-4 py-2.5"
        >
          Add Resource
        </Button>
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
