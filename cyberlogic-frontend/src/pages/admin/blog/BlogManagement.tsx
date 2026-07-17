import { useState, useEffect } from "react";
import { Plus, Star, Pencil, Trash2, Check, X } from "lucide-react";
import { useNavigate } from "react-router";
import { fetchBlogs, deleteBlog, updateBlog, approveBlog, rejectBlog } from "../../../utils/api";
import { Button, DataTable } from "../../../components/ui";
import { useDialog } from "../../../utils/useDialog";
import { BlogStatusBadge } from "./BlogStatusBadge";
import type { BlogPost } from "../../../data/mockData";

export function BlogManagement() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useDialog();
  const [blogList, setBlogList] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleApprove = async (id: number) => {
    try {
      const updated = await approveBlog(id);
      setBlogList(prev => prev.map(b => b.id === id ? updated : b));
      showAlert({
        title: "Approved",
        message: "The blog post has been successfully approved and published.",
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "Approval Failed",
        message: err.message || "Failed to approve blog post.",
        type: "error",
      });
    }
  };

  const handleReject = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Reject Blog Post",
      message: "Are you sure you want to reject this blog post submission?",
      type: "warning",
      confirmText: "Reject",
    });

    if (confirmed) {
      try {
        const updated = await rejectBlog(id);
        setBlogList(prev => prev.map(b => b.id === id ? updated : b));
        showAlert({
          title: "Rejected",
          message: "The blog post submission has been rejected.",
          type: "success",
        });
      } catch (err: any) {
        showAlert({
          title: "Rejection Failed",
          message: err.message || "Failed to reject blog post.",
          type: "error",
        });
      }
    }
  };

  const loadBlogs = async () => {
    try {
      // Pass true to fetch all including drafts
      const data = await fetchBlogs(true);
      setBlogList(data);
    } catch (err) {
      console.error("Failed to load blog posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const categoryColors: Record<string, string> = {
    Tech: "bg-primary/10 text-primary border-primary/20",
    Tutorial: "bg-accent/10 text-accent border-accent/20",
    News: "bg-success/10 text-success border-success/20",
    Lifestyle: "bg-warning/10 text-warning border-warning/20",
    General: "bg-info/10 text-info border-info/20",
    Academic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const handleDeleteBlog = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Blog Post",
      message: "Are you sure you want to delete this blog post?",
      type: "danger",
      confirmText: "Delete",
    });

    if (confirmed) {
      try {
        await deleteBlog(id);
        setBlogList((prev) => prev.filter((b) => b.id !== id));
      } catch (err: any) {
        showAlert({
          title: "Delete Failed",
          message: err.message || "Failed to delete blog post.",
          type: "error",
        });
      }
    }
  };

  const handleToggleFeatured = async (blog: BlogPost) => {
    try {
      await updateBlog(blog.id, {
        ...blog,
        featured: !blog.featured
      });
      setBlogList((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, featured: !b.featured } : b))
      );
    } catch (err: any) {
      showAlert({
        title: "Featured Update Failed",
        message: err.message || "Failed to update featured state.",
        type: "error",
      });
    }
  };

  const blogColumns = [
    {
      header: "Title",
      accessor: (b: BlogPost) => (
        <div>
          <p className="text-sm font-semibold text-text-primary truncate max-w-xs">{b.title}</p>
          <p className="text-xs text-text-muted truncate max-w-xs mt-0.5">{b.excerpt}</p>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any
    },
    {
      header: "Category",
      accessor: (b: BlogPost) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[b.category] || "bg-surface-700 text-text-muted"} border`}>
          {b.category}
        </span>
      ),
      sortable: true,
      sortKey: "category" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Author",
      accessor: (b: BlogPost) => (
        <div className="flex items-center gap-2">
          <img src={b.authorAvatar} alt={b.author} className="w-6 h-6 rounded-full bg-surface-700 object-cover border border-border/60" />
          <span className="text-sm text-text-secondary font-medium">{b.author}</span>
        </div>
      ),
      sortable: true,
      sortKey: "author" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Status",
      accessor: (b: BlogPost) => <BlogStatusBadge status={b.status} />,
      sortable: true,
      sortKey: "status" as any
    },
    {
      header: "Featured",
      accessor: (b: BlogPost) => (
        <button
          type="button"
          onClick={() => handleToggleFeatured(b)}
          className={`transition-all hover:scale-110 cursor-pointer ${b.featured ? "text-warning animate-pulse" : "text-text-muted hover:text-warning"}`}
        >
          <Star className={`w-4 h-4 mx-auto ${b.featured ? "fill-warning text-warning" : ""}`} />
        </button>
      ),
      sortable: true,
      sortKey: "featured" as any,
      className: "text-center hidden sm:table-cell"
    },
    {
      header: "Actions",
      accessor: (b: BlogPost) => (
        <div className="flex items-center justify-end gap-1">
          {b.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(b.id)}
                className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Approve & Publish"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReject(b.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Reject"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => navigate(`/admin/blogs/edit/${b.id}`)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteBlog(b.id)}
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

  const blogFilters = [
    {
      label: "Category",
      field: "category",
      options: [
        { label: "Tech", value: "Tech" },
        { label: "Tutorial", value: "Tutorial" },
        { label: "News", value: "News" },
        { label: "Lifestyle", value: "Lifestyle" },
        { label: "General", value: "General" },
        { label: "Academic", value: "Academic" }
      ]
    },
    {
      label: "Status",
      field: "status",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Pending", value: "pending" },
        { label: "Rejected", value: "rejected" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Blog Posts
          </h1>
          <p className="text-sm text-text-muted mt-1">{blogList.length} total blog posts</p>
        </div>
        <Button
          type="button"
          variant="admin"
          icon={<Plus className="w-4 h-4" />}
          className="px-4 py-2.5 cursor-pointer"
          onClick={() => navigate("/admin/blogs/create")}
        >
          New Blog Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading blog posts from secure database...</p>
        </div>
      ) : (
        <DataTable
          data={blogList}
          columns={blogColumns}
          filterGroups={blogFilters}
          searchPlaceholder="Search blogs..."
          emptyStateText="No blog posts found matching the criteria."
        />
      )}
    </div>
  );
}
