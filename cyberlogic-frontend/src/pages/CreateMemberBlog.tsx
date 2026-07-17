import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { fetchBlogById, createMemberBlog, updateMemberBlog } from "../utils/api";
import { useDialog } from "../utils/useDialog";
import CMSBlogBuilder, { generateId } from "../components/ui/CMSBlogBuilder";
import { BlogHeader } from "./admin/blog/BlogHeader";
import type { CMSBlogState } from "../components/ui/CMSBlogBuilder";

export default function CreateMemberBlog() {
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
    author: user?.name || "Member",
    authorAvatar: user?.avatar,
    userId: user?.id,
    category: "Tech",
    image: "", // cover image
    readTime: "5 min",
    featured: false,
    status: "pending", // Default to pending approval for members
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

        // Verify ownership
        if (match.userId !== user?.id) {
          showAlert({
            title: "Access Denied",
            message: "You can only edit your own blog posts.",
            type: "error",
          });
          navigate("/app/blogs");
          return;
        }

        // Verify status - published posts cannot be edited by members
        if (match.status === "published") {
          showAlert({
            title: "Action Forbidden",
            message: "Published blog posts cannot be edited. Please contact an administrator.",
            type: "error",
          });
          navigate("/app/blogs");
          return;
        }

        setEditorState({
          title: match.title || "",
          subtitle: match.subtitle || "",
          excerpt: match.excerpt || "",
          content: match.content || "",
          author: match.author || user?.name || "Member",
          authorAvatar: match.authorAvatar || (match as any).author_avatar || user?.avatar,
          userId: match.userId || (match as any).user_id || user?.id,
          category: match.category || "Tech",
          image: match.image || "",
          readTime: match.readTime || "5 min",
          featured: match.featured || false,
          status: match.status || "pending",
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
        navigate("/app/blogs");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [editId, navigate, user?.id, user?.name]);

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
        author: user?.name || "Member",
        status: (editorState.status as "pending" | "draft") || "pending",
        sections: editorState.sections,
        tags: editorState.tags || [],
        image: editorState.image || undefined,
        readTime: editorState.readTime || "5 min"
      };

      if (editId) {
        await updateMemberBlog(editId, payload);
      } else {
        await createMemberBlog(payload);
      }

      // Redirect back to blogs feed
      navigate("/app/blogs");
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
    <div className="space-y-6 pb-12">
      <BlogHeader
        title={editId ? "Edit My Blog Post" : "Submit Blog Post"}
        description={editId ? "Modify and update your draft or pending post" : "Write and submit a blog post for administrator approval"}
        backTo="/app/blogs"
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
          onCancel={() => navigate("/app/blogs")}
          saving={isSubmitting}
          saveLabel={editId ? "Update Submission" : "Submit for Approval"}
          titleLabel={editId ? "Edit Blog Info" : "New Blog Info"}
          isSuperAdmin={false} // members are never superadmins in this context
        />
      )}
    </div>
  );
}
