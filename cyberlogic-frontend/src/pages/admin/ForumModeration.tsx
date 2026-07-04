import { useState } from "react";
import {
  Search,
  Pin,
  CheckCircle,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  FolderPlus,
  X,
  Plus,
} from "lucide-react";
import { forumThreads, forumCategories } from "../../data/mockData";
import { Button, Card } from "../../components/ui";

export default function ForumModeration() {
  const [threadList, setThreadList] = useState(forumThreads);
  const [categoriesList, setCategoriesList] = useState(forumCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Category Manager Collapse State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState<"primary" | "accent" | "success" | "error" | "warning">("primary");
  const [newCatDesc, setNewCatDesc] = useState("");

  const filtered = threadList.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (colorName: string) => {
    const colorMap: Record<string, string> = {
      primary: "bg-primary/10 text-primary border-primary/20",
      accent: "bg-accent/10 text-accent border-accent/20",
      success: "bg-success/10 text-success border-success/20",
      error: "bg-error/10 text-error border-error/20",
      warning: "bg-warning/10 text-warning border-warning/20",
    };
    return colorMap[colorName] || "bg-surface-700 text-text-secondary border-border/50";
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newId = newCatName.toLowerCase().replace(/\s+/g, "-");
    
    // Check if category already exists
    if (categoriesList.some((cat) => cat.id === newId)) {
      alert("Category name already exists.");
      return;
    }

    const newCat = {
      id: newId,
      name: newCatName,
      color: newCatColor,
      description: newCatDesc || "No description provided.",
      threadCount: 0,
    };

    setCategoriesList([...categoriesList, newCat]);
    
    // Reset Form
    setNewCatName("");
    setNewCatColor("primary");
    setNewCatDesc("");
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm("Are you sure you want to delete this category? All posts in it will be recategorized as General.")) {
      setCategoriesList(categoriesList.filter((cat) => cat.id !== catId));
      
      // Update threads belonging to the deleted category to "general"
      setThreadList(
        threadList.map((t) => (t.categoryId === catId ? { ...t, categoryId: "general" } : t))
      );

      if (categoryFilter === catId) {
        setCategoryFilter("all");
      }
    }
  };

  const handleDeleteThread = (id: number) => {
    if (confirm("Are you sure you want to delete this thread? This cannot be undone.")) {
      setThreadList(threadList.filter((t) => t.id !== id));
    }
  };

  const handleTogglePin = (id: number) => {
    setThreadList(
      threadList.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  };

  const handleToggleSolved = (id: number) => {
    setThreadList(
      threadList.map((t) => (t.id === id ? { ...t, solved: !t.solved } : t))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Forum Moderation
          </h1>
          <p className="text-sm text-text-muted mt-1">{threadList.length} total threads</p>
        </div>
        
        <Button
          type="button"
          variant="admin"
          icon={showCategoryForm ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
          className="px-4 py-2.5"
          onClick={() => setShowCategoryForm(!showCategoryForm)}
        >
          {showCategoryForm ? "Close Categories" : "Manage Categories"}
        </Button>
      </div>

      {/* Category Manager Collapsible Inline Section */}
      {showCategoryForm && (
        <Card className="p-6 border border-border/80 bg-surface-900/40 relative animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Manage Forum Categories
              </h2>
              <p className="text-xs text-text-muted">Create, edit, or delete categories available for member posts</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryForm(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Side: Create New Category Form */}
            <form onSubmit={handleCreateCategory} className="md:col-span-5 space-y-4 border-r border-border/40 pr-0 md:pr-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                New Category
              </h3>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Reverse Engineering"
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Color Tag Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Color Theme *</label>
                <select
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all"
                >
                  <option value="primary">Primary (Cyan)</option>
                  <option value="accent">Accent (Purple)</option>
                  <option value="success">Success (Green)</option>
                  <option value="error">Error (Red)</option>
                  <option value="warning">Warning (Amber)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Description</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Briefly describe what threads should be posted here..."
                  className="w-full p-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="admin"
                className="w-full py-2"
                icon={<Plus className="w-4 h-4" />}
              >
                Add Category
              </Button>
            </form>

            {/* Right Side: Active Categories List */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Active Categories ({categoriesList.length})
              </h3>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {categoriesList.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-border bg-surface-900/30 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getCategoryColor(cat.color)}`}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">id: {cat.id}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-1 leading-tight line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                    
                    {/* Delete Category Button */}
                    {cat.id !== "general" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all flex-shrink-0"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              categoryFilter === "all"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-border bg-surface-800 text-text-muted hover:border-amber-500/20"
            }`}
          >
            All
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                categoryFilter === cat.id
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-border bg-surface-800 text-text-muted hover:border-amber-500/20"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Thread</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Stats</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((thread) => {
                const category = categoriesList.find((c) => c.id === thread.categoryId);
                return (
                  <tr key={thread.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={thread.authorAvatar} alt={thread.author} className="w-8 h-8 rounded-full bg-surface-700 flex-shrink-0 object-cover" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate max-w-xs">{thread.title}</p>
                          <p className="text-xs text-text-muted">{thread.author} · {thread.lastActivity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {category ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getCategoryColor(category.color)}`}>
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.replyCount}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {thread.likes}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {thread.views}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        {thread.pinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        {thread.solved && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
                            <CheckCircle className="w-3 h-3" /> Solved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(thread.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            thread.pinned
                              ? "text-warning hover:text-warning/70 hover:bg-warning/5"
                              : "text-text-muted hover:text-warning hover:bg-warning/5"
                          }`}
                          title={thread.pinned ? "Unpin" : "Pin"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSolved(thread.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            thread.solved
                              ? "text-success hover:text-success/70 hover:bg-success/5"
                              : "text-text-muted hover:text-success hover:bg-success/5"
                          }`}
                          title={thread.solved ? "Unmark solved" : "Mark solved"}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteThread(thread.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
