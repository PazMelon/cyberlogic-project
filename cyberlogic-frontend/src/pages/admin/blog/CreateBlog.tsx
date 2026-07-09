import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { fetchBlogById, createBlog, updateBlog } from "../../../utils/api";
import { useDialog } from "../../../utils/useDialog";
import CMSBlogBuilder, { generateId } from "../../../components/ui/CMSBlogBuilder";
import { BlogHeader } from "./BlogHeader";
import type { CMSBlogState } from "../../../components/ui/CMSBlogBuilder";

export function CreateBlog() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showAlert } = useDialog();
  const editId = id ? Number(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize the state using the CMS Blog Builder schema
  const [editorState, setEditorState] = useState<CMSBlogState>({
    title: "",
    subtitle: "",
    excerpt: "",
    content: "", // intro text
    author: user?.name || "System Admin",
    authorAvatar: user?.avatar,
    userId: user?.id,
    category: "Tech",
    image: "", // cover image
    readTime: "5 min",
    featured: false,
    status: "published",
    tags: [],
    sections: [
      { type: "text", id: generateId(), html: "" }
    ]
  });

  // Load existing data if in Edit Mode
  useEffect(() => {
    async function loadData() {
      if (!editId) return;
      setIsLoading(true);
      try {
        const match = await fetchBlogById(editId);
        setEditorState({
          title: match.title || "",
          subtitle: match.subtitle || "",
          excerpt: match.excerpt || "",
          content: match.content || "",
          author: match.author || user?.name || "System Admin",
          authorAvatar: match.authorAvatar || (match as any).author_avatar || user?.avatar,
          userId: match.userId || (match as any).user_id || user?.id,
          category: match.category || "Tech",
          image: match.image || "",
          readTime: match.readTime || "5 min",
          featured: match.featured || false,
          status: match.status || "published",
          tags: match.tags || [],
          sections: match.sections || [{ type: "text", id: generateId(), html: "" }]
        });
      } catch (err) {
        console.error("Failed to load blog post details:", err);
        showAlert({
          title: "Load Failed",
          message: "Failed to load blog details from database.",
          type: "error",
        });
        navigate("/admin/blogs");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [editId, navigate, user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorState.title.trim() || !editorState.excerpt.trim()) return;

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: editorState.title,
        subtitle: editorState.subtitle || undefined,
        excerpt: editorState.excerpt,
        content: editorState.content || "",
        category: editorState.category as "Tech" | "Tutorial" | "News" | "Lifestyle" | "General" | "Academic",
        author: editorState.author || user?.name || "System Admin",
        user_id: editorState.userId,
        featured: editorState.featured || false,
        status: (editorState.status as "published" | "draft") || "published",
        sections: editorState.sections,
        tags: editorState.tags || [],
        image: editorState.image || undefined,
        readTime: editorState.readTime || "5 min"
      };

      if (editId) {
        await updateBlog(editId, payload);
      } else {
        await createBlog(payload);
      }

      // Redirect back to blogs management directory
      navigate("/admin/blogs");
    } catch (err: any) {
      console.error("Failed to save blog post:", err);
      showAlert({
        title: "Save Failed",
        message: err.message || "Failed to save blog post to database.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BlogHeader
        title={editId ? "Edit Blog Post" : "Create Blog Post"}
        description={editId ? "Modify and update published details" : "Distraction-free publishing using the CMS Blog Builder"}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading data from secure database...</p>
        </div>
      ) : (
        <CMSBlogBuilder
          state={editorState}
          onChange={setEditorState}
          categories={["Tech", "Tutorial", "News", "Lifestyle", "General", "Academic"]}
          onSave={handleSave}
          onCancel={() => navigate("/admin/blogs")}
          saving={isSubmitting}
          saveLabel={editId ? "Update Blog" : "Publish Blog"}
          titleLabel={editId ? "Edit Blog Info" : "New Blog Info"}
          isSuperAdmin={user?.role === "superadmin"}
        />
      )}
    </div>
  );
}
