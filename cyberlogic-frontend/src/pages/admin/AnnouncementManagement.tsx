import { useState, useEffect } from "react";
import { Plus, Pin, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { fetchAnnouncements, deleteAnnouncement, updateAnnouncement } from "../../utils/api";
import { Button, DataTable } from "../../components/ui";
import type { Announcement } from "../../data/mockData";

export default function AnnouncementManagement() {
  const navigate = useNavigate();
  const [announcementList, setAnnouncementList] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnnouncements = async () => {
    try {
      const data = await fetchAnnouncements();
      setAnnouncementList(data);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const categoryColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Academic: "bg-accent/10 text-accent",
    Events: "bg-success/10 text-success",
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteAnnouncement(id);
        setAnnouncementList((prev) => prev.filter((a) => a.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete announcement.");
      }
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await updateAnnouncement(announcement.id, {
        ...announcement,
        pinned: !announcement.pinned
      });
      setAnnouncementList((prev) =>
        prev.map((a) => (a.id === announcement.id ? { ...a, pinned: !a.pinned } : a))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update pinned state.");
    }
  };

  const announcementColumns = [
    {
      header: "Title",
      accessor: (a: Announcement) => (
        <div>
          <p className="text-sm font-semibold text-text-primary truncate max-w-xs">{a.title}</p>
          <p className="text-xs text-text-muted truncate max-w-xs mt-0.5">{a.excerpt}</p>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any
    },
    {
      header: "Category",
      accessor: (a: Announcement) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[a.category] || "bg-surface-700 text-text-muted"} border border-border/20`}>
          {a.category}
        </span>
      ),
      sortable: true,
      sortKey: "category" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Author",
      accessor: (a: Announcement) => (
        <div className="flex items-center gap-2">
          <img src={a.authorAvatar} alt={a.author} className="w-6 h-6 rounded-full bg-surface-700 object-cover border border-border/60" />
          <span className="text-sm text-text-secondary font-medium">{a.author}</span>
        </div>
      ),
      sortable: true,
      sortKey: "author" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Date",
      accessor: (a: Announcement) => <span className="text-xs text-text-muted">{a.date}</span>,
      sortable: true,
      sortKey: "date" as any,
      className: "hidden lg:table-cell"
    },
    {
      header: "Pinned",
      accessor: (a: Announcement) => (
        <button
          type="button"
          onClick={() => handleTogglePin(a)}
          className={`transition-all hover:scale-110 cursor-pointer ${a.pinned ? "text-warning" : "text-text-muted hover:text-warning"}`}
        >
          <Pin className={`w-4 h-4 mx-auto ${a.pinned ? "fill-warning" : ""}`} />
        </button>
      ),
      sortable: true,
      sortKey: "pinned" as any,
      className: "text-center hidden sm:table-cell"
    },
    {
      header: "Actions",
      accessor: (a: Announcement) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/admin/announcements/edit/${a.id}`)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteAnnouncement(a.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: "text-right"
    }
  ];

  const announcementFilters = [
    {
      label: "Category",
      field: "category",
      options: [
        { label: "General", value: "General" },
        { label: "Academic", value: "Academic" },
        { label: "Events", value: "Events" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Announcements
          </h1>
          <p className="text-sm text-text-muted mt-1">{announcementList.length} total announcements</p>
        </div>
        <Button
          type="button"
          variant="admin"
          icon={<Plus className="w-4 h-4" />}
          className="px-4 py-2.5 cursor-pointer"
          onClick={() => navigate("/admin/announcements/create")}
        >
          New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading announcements from secure database...</p>
        </div>
      ) : (
        <DataTable
          data={announcementList}
          columns={announcementColumns}
          filterGroups={announcementFilters}
          searchPlaceholder="Search announcements..."
          emptyStateText="No announcements found matching the criteria."
        />
      )}
    </div>
  );
}
