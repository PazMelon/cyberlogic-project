import { useState, useEffect } from "react";
import {
  Pin,
  CheckCircle,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  FolderPlus,
  X,
  Pencil,
  ArrowUp,
  ArrowDown,
  EyeOff,
  HelpCircle,
  Shield,
  AlertTriangle,
  Lock,
  Globe
} from "lucide-react";
import { Button, Card, DataTable } from "../../components/ui";
import { apiRequest } from "../../context/AuthContext";
import { 
  createForumCategory, 
  updateForumCategory, 
  deleteForumCategory, 
  reorderForumCategories,
  type DbForumCategory 
} from "../../utils/api";

const availableColors = [
  { value: "primary", label: "Amber (Primary)" },
  { value: "accent", label: "Purple (Accent)" },
  { value: "success", label: "Green (Success)" },
  { value: "error", label: "Red (Error)" },
  { value: "warning", label: "Orange (Warning)" }
];

const availableIcons = [
  { value: "MessageSquare", label: "Chat" },
  { value: "Shield", label: "Shield / Security" },
  { value: "HelpCircle", label: "Help / Q&A" },
  { value: "Lock", label: "Lock" },
  { value: "Globe", label: "Globe" }
];

export default function ForumModeration() {
  const [threadList, setThreadList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<DbForumCategory[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Category Manager Collapse State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbForumCategory | null>(null);

  // Category Form Fields
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catColor, setCatColor] = useState("primary");
  const [catType, setCatType] = useState<"discussion" | "support">("discussion");
  const [catIcon, setCatIcon] = useState("MessageSquare");
  const [catIsVisible, setCatIsVisible] = useState(true);
  const [catAllowSolved, setCatAllowSolved] = useState(true);
  const [catRules, setCatRules] = useState("");
  const [catError, setCatError] = useState("");

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await apiRequest("/api/forum/categories");
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (err) {
      console.error("Failed to load forum categories:", err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const res = await apiRequest("/api/forum/threads");
      if (res.ok) {
        const data = await res.json();
        // The API returns threads directly or nested under data depending on pagination
        const threads = Array.isArray(data) ? data : data.data || [];
        setThreadList(threads);
      }
    } catch (err) {
      console.error("Failed to load forum threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadThreads();
  }, []);

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

  // Category type trigger to default allow_solved value
  const handleTypeChange = (type: "discussion" | "support") => {
    setCatType(type);
    setCatAllowSolved(type === "support");
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatDesc("");
    setCatColor("primary");
    setCatType("discussion");
    setCatIcon("MessageSquare");
    setCatIsVisible(true);
    setCatAllowSolved(false);
    setCatRules("");
    setCatError("");
    setShowCategoryForm(true);
  };

  const handleOpenEditCategory = (cat: DbForumCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setCatColor(cat.color);
    setCatType(cat.type);
    setCatIcon(cat.icon || "MessageSquare");
    setCatIsVisible(cat.is_visible);
    setCatAllowSolved(cat.allow_solved);
    setCatRules(cat.rules || "");
    setCatError("");
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setCatError("");
      const payload = {
        name: catName,
        description: catDesc,
        color: catColor,
        type: catType,
        icon: catIcon,
        is_visible: catIsVisible,
        allow_solved: catAllowSolved,
        rules: catRules,
      };

      if (editingCategory) {
        await updateForumCategory(editingCategory.id, payload);
      } else {
        await createForumCategory(payload);
      }

      setCatName("");
      setCatDesc("");
      setCatRules("");
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      setCatError(err.message || "Failed to process category request.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure you want to delete this category? All posts in it will be recategorized as General Discussion.")) {
      try {
        await deleteForumCategory(id);
        loadCategories();
        loadThreads(); // Reload threads to reflect re-categorization
      } catch (err: any) {
        alert(err.message || "Failed to delete category.");
      }
    }
  };

  const handleMoveCategory = async (index: number, direction: "up" | "down") => {
    const newCategories = [...categoriesList];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    // Swap elements
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Save ordering in state instantly
    setCategoriesList(newCategories);

    try {
      const ids = newCategories.map((c) => c.id);
      await reorderForumCategories(ids);
    } catch (err: any) {
      console.error("Failed to persist category order:", err);
      loadCategories(); // Rollback to server state
    }
  };

  // Thread Operations
  const handleTogglePin = async (id: number) => {
    try {
      const res = await apiRequest(`/api/forum/threads/${id}/pin`, { method: "PUT" });
      if (res.ok) {
        setThreadList(prev => prev.map(t => t.id === id ? { ...t, is_pinned: !t.is_pinned } : t));
      }
    } catch (err) {
      console.error("Failed to pin/unpin thread:", err);
    }
  };

  const handleToggleSolved = async (id: number) => {
    try {
      const res = await apiRequest(`/api/forum/threads/${id}/solve`, { method: "PUT" });
      if (res.ok) {
        setThreadList(prev => prev.map(t => t.id === id ? { ...t, is_solved: !t.is_solved } : t));
      }
    } catch (err) {
      console.error("Failed to solve/unsolve thread:", err);
    }
  };

  const handleToggleClosed = async (id: number) => {
    try {
      const res = await apiRequest(`/api/forum/threads/${id}/close`, { method: "PUT" });
      if (res.ok) {
        setThreadList(prev => prev.map(t => t.id === id ? { ...t, is_closed: !t.is_closed } : t));
      }
    } catch (err) {
      console.error("Failed to close/open thread:", err);
    }
  };

  const handleDeleteThread = async (id: number) => {
    if (confirm("Are you sure you want to delete this thread? This cannot be undone.")) {
      try {
        const res = await apiRequest(`/api/forum/threads/${id}`, { method: "DELETE" });
        if (res.ok) {
          setThreadList(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete thread:", err);
      }
    }
  };

  const forumColumns = [
    {
      header: "Thread",
      accessor: (thread: any) => (
        <div className="flex items-center gap-3">
          <img src={thread.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"} alt={thread.user?.name} className="w-8 h-8 rounded-full bg-surface-700 flex-shrink-0 object-cover border border-border/60" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate max-w-xs">{thread.title}</p>
            <p className="text-xs text-text-muted">{thread.user?.name || "Anonymous"} · {new Date(thread.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any
    },
    {
      header: "Category",
      accessor: (thread: any) => {
        const category = thread.category;
        return category ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getCategoryColor(category.color)} border border-border/20`}>
            {category.name}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted">Uncategorized</span>
        );
      },
      className: "hidden sm:table-cell"
    },
    {
      header: "Stats",
      accessor: (thread: any) => (
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1 font-medium"><MessageSquare className="w-3.5 h-3.5 text-primary/70" /> {thread.commentCount ?? 0}</span>
          <span className="flex items-center gap-1 font-medium"><Heart className="w-3.5 h-3.5 text-accent/70" /> {thread.voteScore ?? 0}</span>
          <span className="flex items-center gap-1 font-medium"><Eye className="w-3.5 h-3.5 text-info/70" /> {thread.views ?? 0}</span>
        </div>
      ),
      className: "hidden md:table-cell"
    },
    {
      header: "Status",
      accessor: (thread: any) => (
        <div className="flex items-center justify-center gap-2">
          {thread.is_pinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning" title="Pinned">
              <Pin className="w-3 h-3 fill-warning" />
            </span>
          )}
          {thread.is_solved && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success" title="Solved">
              <CheckCircle className="w-3 h-3" />
            </span>
          )}
          {thread.is_closed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-muted" title="Closed">
              <Lock className="w-3 h-3" />
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
              thread.is_pinned ? "text-warning hover:bg-warning/5" : "text-text-muted hover:text-warning hover:bg-white/5"
            }`}
            title={thread.is_pinned ? "Unpin Thread" : "Pin Thread"}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          {thread.category?.allow_solved && (
            <button
              type="button"
              onClick={() => handleToggleSolved(thread.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                thread.is_solved ? "text-success hover:bg-success/5" : "text-text-muted hover:text-success hover:bg-white/5"
              }`}
              title={thread.is_solved ? "Mark Unsolved" : "Mark Solved"}
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleToggleClosed(thread.id)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              thread.is_closed ? "text-primary hover:bg-primary/5" : "text-text-muted hover:text-primary hover:bg-white/5"
            }`}
            title={thread.is_closed ? "Unlock Thread" : "Lock Thread"}
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteThread(thread.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
            title="Delete Thread"
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
      field: "category.slug",
      options: categoriesList.map((cat) => ({
        label: cat.name,
        value: cat.slug
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
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="admin"
            icon={showCategoryForm ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            className="px-4 py-2.5 cursor-pointer"
            onClick={() => {
              if (!showCategoryForm) {
                handleOpenCreateCategory();
              } else {
                setShowCategoryForm(false);
              }
            }}
          >
            {showCategoryForm ? "Close Manager" : "Manage Categories"}
          </Button>
        </div>
      </div>

      {/* Category Management Block */}
      {showCategoryForm && (
        <Card className="p-6 border border-border bg-surface-900 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Forum Categories Registry
              </h2>
              <p className="text-xs text-text-muted">Create or modify forum sections, type attributes, rules, and visibility</p>
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
            {/* Create / Edit Category Form */}
            <form onSubmit={handleCategorySubmit} className="lg:col-span-1 space-y-4 border-r border-border/30 pr-6">
              {catError && (
                <div className="p-2.5 rounded-lg bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{catError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Capture The Flag"
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Theme Color *</label>
                  <select
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none"
                  >
                    {availableColors.map((color) => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Lucide Icon *</label>
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Category Type</label>
                <select
                  value={catType}
                  onChange={(e) => handleTypeChange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none"
                >
                  <option value="discussion">Discussion (General posts)</option>
                  <option value="support">Support (Enables solved threads & answers)</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4 py-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={catIsVisible}
                    onChange={(e) => setCatIsVisible(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0 w-3.5 h-3.5"
                  />
                  Visible to Public
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={catAllowSolved}
                    onChange={(e) => setCatAllowSolved(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0 w-3.5 h-3.5"
                  />
                  Allow Solved Threads
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Description</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  placeholder="Summarize the category focus..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Posting Rules / Guidelines (Optional)</label>
                <textarea
                  value={catRules}
                  onChange={(e) => setCatRules(e.target.value)}
                  rows={2}
                  placeholder="Guidelines shown when posting in this category..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              <div className="flex gap-2">
                {editingCategory && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="w-1/2 py-2 cursor-pointer text-xs"
                    onClick={handleOpenCreateCategory}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" variant="admin" className={`${editingCategory ? 'w-1/2' : 'w-full'} py-2 cursor-pointer text-xs`}>
                  {editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>

            {/* Active Categories list with reordering */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>Active Categories ({categoriesList.length})</span>
                <span className="text-[10px] normal-case font-normal text-text-muted">Use arrows to sort sorting order</span>
              </h3>
              
              {isLoadingCategories ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                  {categoriesList.map((cat, index) => {
                    const IconComp = cat.icon === "Shield" ? Shield 
                      : cat.icon === "HelpCircle" ? HelpCircle 
                      : cat.icon === "Lock" ? Lock 
                      : cat.icon === "Globe" ? Globe 
                      : MessageSquare;

                    return (
                      <div key={cat.id} className="p-3 rounded-xl bg-surface-950/40 border border-border/80 flex items-center justify-between gap-3 hover:border-border transition-all">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg bg-surface-800 text-text-primary flex-shrink-0 ${getCategoryColor(cat.color).split(' ')[1]}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                              {cat.name}
                              {cat.type === "support" && (
                                <span className="text-[9px] bg-success/10 text-success border border-success/20 px-1 py-0.5 rounded uppercase font-bold">
                                  Support
                                </span>
                              )}
                              {!cat.is_visible && (
                                <span className="text-[9px] bg-error/10 text-error border border-error/20 px-1 py-0.5 rounded uppercase font-bold flex items-center gap-0.5">
                                  <EyeOff className="w-2.5 h-2.5" /> Hidden
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-md">{cat.description || "No description provided."}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveCategory(index, "up")}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categoriesList.length - 1}
                            onClick={() => handleMoveCategory(index, "down")}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1 rounded text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {cat.slug !== "general" && (
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {isLoadingThreads ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading forum threads...</p>
        </div>
      ) : (
        <DataTable
          data={threadList}
          columns={forumColumns}
          filterGroups={forumFilters}
          searchPlaceholder="Search forum threads..."
          emptyStateText="No forum threads found matching the criteria."
        />
      )}
    </div>
  );
}
