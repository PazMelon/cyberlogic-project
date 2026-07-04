import { useState } from "react";
import {
  Pin,
  CheckCircle,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  FolderPlus,
  X,
} from "lucide-react";
import { forumThreads, forumCategories } from "../../data/mockData";
import { Button, Card, DataTable } from "../../components/ui";

export default function ForumModeration() {
  const [threadList, setThreadList] = useState(forumThreads);
  const [categoriesList, setCategoriesList] = useState(forumCategories);

  // Category Manager Collapse State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState<"primary" | "accent" | "success" | "error" | "warning">("primary");
  const [newCatDesc, setNewCatDesc] = useState("");

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

  const forumColumns = [
    {
      header: "Thread",
      accessor: (thread: any) => (
        <div className="flex items-center gap-3">
          <img src={thread.authorAvatar} alt={thread.author} className="w-8 h-8 rounded-full bg-surface-700 flex-shrink-0 object-cover border border-border/60" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate max-w-xs">{thread.title}</p>
            <p className="text-xs text-text-muted">{thread.author} · {thread.lastActivity}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any
    },
    {
      header: "Category",
      accessor: (thread: any) => {
        const category = categoriesList.find((c) => c.id === thread.categoryId);
        return category ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getCategoryColor(category.color)} border border-border/20`}>
            {category.name}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted">Uncategorized</span>
        );
      },
      sortable: true,
      sortKey: "categoryId" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Stats",
      accessor: (thread: any) => (
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1 font-medium"><MessageSquare className="w-3 h-3 text-primary/70" /> {thread.replyCount}</span>
          <span className="flex items-center gap-1 font-medium"><Heart className="w-3 h-3 text-accent/70" /> {thread.likes}</span>
          <span className="flex items-center gap-1 font-medium"><Eye className="w-3 h-3 text-info/70" /> {thread.views}</span>
        </div>
      ),
      className: "hidden md:table-cell"
    },
    {
      header: "Status",
      accessor: (thread: any) => (
        <div className="flex items-center justify-center gap-2">
          {thread.pinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning">
              <Pin className="w-3 h-3 fill-warning" /> Pinned
            </span>
          )}
          {thread.solved && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
              <CheckCircle className="w-3 h-3" /> Solved
            </span>
          )}
        </div>
      ),
      className: "text-center hidden sm:table-cell"
    },
    {
      header: "Actions",
      accessor: (thread: any) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleTogglePin(thread.id)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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

  const forumFilters = [
    {
      label: "Category",
      field: "categoryId",
      options: categoriesList.map((cat) => ({
        label: cat.name,
        value: cat.id
      }))
    }
  ];

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
          className="px-4 py-2.5 cursor-pointer"
          onClick={() => setShowCategoryForm(!showCategoryForm)}
        >
          {showCategoryForm ? "Close Manager" : "Manage Categories"}
        </Button>
      </div>

      {/* Category Management Block */}
      {showCategoryForm && (
        <Card className="p-6 border border-border/80 bg-surface-900/40 animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Forum Categories Registry
              </h2>
              <p className="text-xs text-text-muted">Create or modify forum sections and tags</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryForm(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} className="lg:col-span-1 space-y-4 border-r border-border/30 pr-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Capture The Flag"
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Theme Color *</label>
                <select
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none"
                >
                  <option value="primary">Amber (Primary)</option>
                  <option value="accent">Purple (Accent)</option>
                  <option value="success">Green (Success)</option>
                  <option value="error">Red (Error)</option>
                  <option value="warning">Orange (Warning)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Description</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows={2}
                  placeholder="Summarize the category focus..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                />
              </div>

              <Button type="submit" variant="admin" className="w-full py-2 cursor-pointer">
                Create Category
              </Button>
            </form>

            {/* Active Categories list */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Categories Registry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                {categoriesList.map((cat) => (
                  <div key={cat.id} className="p-3 rounded-xl bg-surface-950/40 border border-border/80 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getCategoryColor(cat.color)}`}>
                        {cat.name}
                      </span>
                      <p className="text-[11px] text-text-muted mt-1 truncate">{cat.description}</p>
                    </div>
                    {cat.id !== "general" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
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

      <DataTable
        data={threadList}
        columns={forumColumns}
        filterGroups={forumFilters}
        searchPlaceholder="Search forum threads..."
        emptyStateText="No forum threads found matching the criteria."
      />
    </div>
  );
}
