import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchAnnouncementById, createAnnouncement, updateAnnouncement } from "../../utils/api";
import CMSBlogBuilder, { generateId } from "../../components/ui/CMSBlogBuilder";
import type { CMSBlogState } from "../../components/ui/CMSBlogBuilder";

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
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
    category: "General",
    image: "", // cover image
    readTime: "5 min",
    featured: false,
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
        const match = await fetchAnnouncementById(editId);
        setEditorState({
          title: match.title || "",
          subtitle: match.subtitle || "",
          excerpt: match.excerpt || "",
          content: match.content || "",
          author: match.author || user?.name || "System Admin",
          authorAvatar: match.authorAvatar || (match as any).author_avatar || user?.avatar,
          userId: match.userId || (match as any).user_id || user?.id,
          category: match.category || "General",
          image: match.image || "",
          readTime: "5 min",
          featured: match.pinned || false,
          sections: match.sections || [{ type: "text", id: generateId(), html: "" }]
        });
      } catch (err) {
        console.error("Failed to load announcement details:", err);
        alert("Failed to load announcement detail from backend database.");
        navigate("/admin/announcements");
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
        category: editorState.category as "General" | "Academic" | "Events",
        author: editorState.author || user?.name || "System Admin",
        user_id: editorState.userId,
        pinned: editorState.featured || false,
        sections: editorState.sections,
        image: editorState.image || undefined
      };

      if (editId) {
        await updateAnnouncement(editId, payload);
      } else {
        await createAnnouncement(payload);
      }

      // Redirect back to announcements directory
      navigate("/admin/announcements");
    } catch (err: any) {
      console.error("Failed to save announcement:", err);
      alert(err.message || "Failed to save announcement to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/announcements"
          className="p-2 rounded-xl bg-surface-800 border border-border/80 text-text-muted hover:text-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary animate-pulse" /> {editId ? "Edit Announcement" : "Create Announcement"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {editId ? "Modify and update published details" : "Distraction-free publishing using the CMS Blog Builder"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading data from secure database...</p>
        </div>
      ) : (
        /* Generic CMS Builder Component */
        <CMSBlogBuilder
          state={editorState}
          onChange={setEditorState}
          categories={["General", "Academic", "Events"]}
          onSave={handleSave}
          onCancel={() => navigate("/admin/announcements")}
          saving={isSubmitting}
          saveLabel={editId ? "Update Announcement" : "Publish Announcement"}
          titleLabel={editId ? "Edit Announcement Info" : "New Announcement Info"}
          isSuperAdmin={user?.role === "superadmin"}
        />
      )}
    </div>
  );
}
