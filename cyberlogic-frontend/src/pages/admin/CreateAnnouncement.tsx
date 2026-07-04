import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { announcements } from "../../data/mockData";
import type { Announcement } from "../../data/mockData";
import CMSBlogBuilder, { generateId } from "../../components/ui/CMSBlogBuilder";
import type { CMSBlogState } from "../../components/ui/CMSBlogBuilder";

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the state using the CMS Blog Builder schema
  const [editorState, setEditorState] = useState<CMSBlogState>({
    title: "",
    subtitle: "",
    excerpt: "",
    content: "", // intro text
    author: "System Admin",
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
    if (editId) {
      const match = announcements.find((a) => a.id === editId);
      if (match) {
        setEditorState({
          title: match.title || "",
          subtitle: match.subtitle || "",
          excerpt: match.excerpt || "",
          content: match.content || "",
          author: match.author || "System Admin",
          category: match.category || "General",
          image: "", // Mock Cover Image URL
          readTime: "5 min",
          featured: match.pinned || false,
          sections: match.sections || [{ type: "text", id: generateId(), html: "" }]
        });
      }
    }
  }, [editId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorState.title.trim() || !editorState.excerpt.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      if (editId) {
        // Edit mode: find existing and update fields in mutable mock array
        const idx = announcements.findIndex((a) => a.id === editId);
        if (idx !== -1) {
          announcements[idx] = {
            ...announcements[idx],
            title: editorState.title,
            subtitle: editorState.subtitle || undefined,
            excerpt: editorState.excerpt,
            content: editorState.content || "",
            category: editorState.category as "General" | "Academic" | "Events",
            author: editorState.author || "System Admin",
            pinned: editorState.featured || false,
            sections: editorState.sections
          };
        }
      } else {
        // Create mode: map state and unshift new announcement
        const newAnnouncement: Announcement = {
          id: Date.now(),
          title: editorState.title,
          subtitle: editorState.subtitle || undefined,
          excerpt: editorState.excerpt,
          content: editorState.content || "",
          category: editorState.category as "General" | "Academic" | "Events",
          author: editorState.author || "System Admin",
          authorAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(editorState.author || "admin")}`,
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          pinned: editorState.featured || false,
          sections: editorState.sections
        };
        announcements.unshift(newAnnouncement);
      }

      setIsSubmitting(false);

      // Redirect back to announcements directory
      navigate("/admin/announcements");
    }, 800);
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

      {/* Generic CMS Builder Component */}
      <CMSBlogBuilder
        state={editorState}
        onChange={setEditorState}
        categories={["General", "Academic", "Events"]}
        onSave={handleSave}
        onCancel={() => navigate("/admin/announcements")}
        saving={isSubmitting}
        saveLabel={editId ? "Update Announcement" : "Publish Announcement"}
        titleLabel={editId ? "Edit Announcement Info" : "New Announcement Info"}
      />
    </div>
  );
}
