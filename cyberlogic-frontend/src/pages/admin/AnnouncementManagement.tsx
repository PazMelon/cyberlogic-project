import { useState, useEffect } from "react";
import { Plus, Search, Pin, Pencil, Trash2 } from "lucide-react";
import { announcements } from "../../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../../components/Skeleton";

export default function AnnouncementManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Academic: "bg-accent/10 text-accent",
    Events: "bg-success/10 text-success",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Announcements
          </h1>
          <p className="text-sm text-text-muted mt-1">{announcements.length} total announcements</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
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
                        <img src={a.authorAvatar} alt={a.author} className="w-6 h-6 rounded-full bg-surface-700 animate-fadeIn" />
                        <span className="text-sm text-text-secondary">{a.author}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-text-muted">{a.date}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                      {a.pinned && <Pin className="w-4 h-4 text-warning mx-auto" />}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors" title="Delete">
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
