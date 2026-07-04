import { useState, useEffect } from "react";
import { Plus, Search, Pin, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { announcements } from "../../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../../components/Skeleton";
import { Button } from "../../components/ui";
import type { Announcement } from "../../data/mockData";

export default function AnnouncementManagement() {
  const navigate = useNavigate();
  const [announcementList, setAnnouncementList] = useState<Announcement[]>(announcements);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync state with mutable mockData exported list on mount/update
  useEffect(() => {
    setAnnouncementList([...announcements]);
  }, [announcements.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = announcementList.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Academic: "bg-accent/10 text-accent",
    Events: "bg-success/10 text-success",
  };

  const handleDeleteAnnouncement = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      // Delete from both local state and global array
      const updated = announcements.filter((a) => a.id !== id);
      // We can clear and mutate mockData array
      announcements.length = 0;
      announcements.push(...updated);
      setAnnouncementList(updated);
    }
  };

  const handleTogglePin = (id: number) => {
    const updated = announcements.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a));
    announcements.length = 0;
    announcements.push(...updated);
    setAnnouncementList(updated);
  };

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
          className="px-4 py-2.5"
          onClick={() => navigate("/admin/announcements/create")}
        >
          New Announcement
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search announcements..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
        />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Author</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Pinned</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3.5">
                        <div className="space-y-1.5">
                          <SkeletonLine widthClass="w-48" heightClass="h-4" />
                          <SkeletonLine widthClass="w-64" heightClass="h-3" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <SkeletonLine widthClass="w-16" heightClass="h-4" />
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <SkeletonCircle className="w-6 h-6 bg-surface-800" />
                          <SkeletonLine widthClass="w-16" heightClass="h-3.5" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <SkeletonLine widthClass="w-14" heightClass="h-3" />
                      </td>
                      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                        <SkeletonLine widthClass="w-4" heightClass="h-4" className="mx-auto" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex gap-2 justify-end">
                          <SkeletonCircle className="w-7 h-7 bg-surface-800" />
                          <SkeletonCircle className="w-7 h-7 bg-surface-800" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-text-primary truncate max-w-xs">{a.title}</p>
                      <p className="text-xs text-text-muted truncate max-w-xs mt-0.5">{a.excerpt}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[a.category] || "bg-surface-700 text-text-muted"}`}>
                        {a.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <img src={a.authorAvatar} alt={a.author} className="w-6 h-6 rounded-full bg-surface-700 object-cover" />
                        <span className="text-sm text-text-secondary">{a.author}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-text-muted">{a.date}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(a.id)}
                        className={`transition-all hover:scale-110 ${a.pinned ? "text-warning" : "text-text-muted hover:text-warning"}`}
                      >
                        <Pin className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
