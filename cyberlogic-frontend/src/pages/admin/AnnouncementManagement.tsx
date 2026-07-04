import { useState, useEffect } from "react";
import { Plus, Search, Pin, Pencil, Trash2, X } from "lucide-react";
import { announcements } from "../../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../../components/Skeleton";
import { Button, Card } from "../../components/ui";

export default function AnnouncementManagement() {
  const [announcementList, setAnnouncementList] = useState(announcements);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form Collapse State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"General" | "Academic" | "Events">("General");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

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

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newAnnouncement = {
        id: Date.now(),
        title,
        excerpt,
        content,
        category,
        author: "System Admin",
        authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        pinned,
      };

      setAnnouncementList([newAnnouncement, ...announcementList]);
      setIsSubmitting(false);
      setShowForm(false);

      // Reset Form
      setTitle("");
      setCategory("General");
      setExcerpt("");
      setContent("");
      setPinned(false);
    }, 800);
  };

  const handleDeleteAnnouncement = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setAnnouncementList(announcementList.filter((a) => a.id !== id));
    }
  };

  const handleTogglePin = (id: number) => {
    setAnnouncementList(
      announcementList.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a))
    );
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
          icon={showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          className="px-4 py-2.5"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close Form" : "New Announcement"}
        </Button>
      </div>

      {/* High-Fidelity Collapsible Inline Announcement Creation Form */}
      {showForm && (
        <Card className="p-6 border border-border/80 bg-surface-900/40 relative animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Post New Announcement
              </h2>
              <p className="text-xs text-text-muted">Fill in fields below to publish a notification or drive to the club feed</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Announcement Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Recruitment Drive 2026 Registration Open"
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            {/* Grid: Category & Pinned Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Events">Events</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  id="pinned-checkbox-inline"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-border text-amber-500 bg-surface-800 focus:ring-amber-500/40 focus:ring-2 focus:ring-offset-0 focus:outline-none [color-scheme:dark]"
                />
                <label htmlFor="pinned-checkbox-inline" className="text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  Pin Announcement to top of feeds
                </label>
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Short Summary / Excerpt *</label>
              <input
                type="text"
                required
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief 1-sentence highlight displayed on feeds..."
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            {/* Body Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Full Body Content *</label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe details, link registrations, contact info..."
                className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              />
            </div>

            {/* Buttons Toolbar */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="admin"
                isLoading={isSubmitting}
                className="px-5 py-2"
              >
                Publish
              </Button>
            </div>
          </form>
        </Card>
      )}

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
