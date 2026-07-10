import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchResourceById, createResource, updateResource } from "../utils/api";
import { useDialog } from "../utils/useDialog";
import CMSBlogBuilder, { generateId } from "../components/ui/CMSBlogBuilder";
import type { CMSBlogState } from "../components/ui/CMSBlogBuilder";

export default function CreateResource() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showAlert } = useDialog();
  const editId = id ? Number(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state tailored for Resource properties using the CMS Builder schema
  const [editorState, setEditorState] = useState<CMSBlogState>({
    title: "",
    subtitle: "",
    excerpt: "",
    content: "", // intro text/description
    author: user?.name || "System Admin",
    authorAvatar: user?.avatar,
    userId: user?.id,
    category: "Tutorials",
    image: "", // cover image URL
    readTime: "5 min",
    featured: false,
    isResource: true,
    resourceLink: "",
    resourceFile: null,
    resourceFilePath: "",
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
        const match = await fetchResourceById(editId);
        setEditorState({
          title: match.title || "",
          subtitle: match.subtitle || "",
          excerpt: match.excerpt || "",
          content: match.description || "",
          author: match.user?.name || user?.name || "System Admin",
          authorAvatar: match.user?.avatar || user?.avatar,
          userId: match.user_id || user?.id,
          category: match.category || "Tutorials",
          image: match.image || "",
          readTime: "5 min",
          featured: false,
          isResource: true,
          resourceLink: match.link || "",
          resourceFile: null,
          resourceFilePath: match.file_path || "",
          sections: match.sections || [{ type: "text", id: generateId(), html: "" }]
        });
      } catch (err) {
        console.error("Failed to load resource details:", err);
        showAlert({
          title: "Load Failed",
          message: "Failed to load resource detail from backend database.",
          type: "error",
        });
        navigate("/app/resources");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [editId, navigate, user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorState.title.trim() || !editorState.excerpt.trim()) {
      showAlert({
        title: "Validation Error",
        message: "Title and excerpt are required.",
        type: "error"
      });
      return;
    }

    if (!editorState.resourceLink?.trim() && !editorState.resourceFile && !editorState.resourceFilePath) {
      showAlert({
        title: "Validation Error",
        message: "Please provide either a resource link URL or upload a file attachment.",
        type: "error"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", editorState.title.trim());
      formData.append("subtitle", editorState.subtitle?.trim() || "");
      formData.append("description", editorState.content || "");
      formData.append("excerpt", editorState.excerpt.trim());
      formData.append("category", editorState.category);
      
      if (editorState.resourceLink?.trim()) {
        formData.append("link", editorState.resourceLink.trim());
      }
      if (editorState.resourceFile) {
        formData.append("file", editorState.resourceFile);
      }
      if (editorState.image) {
        // Since image URL is already uploaded via CMSBlogBuilder's ImageUploadZone, we append it directly
        // But the backend optimize service expects cover image under 'image' request field
        // If image starts with '/storage/resources/' or similar, we send it as is or if it is base64 we send it
        // Actually, backend saves the string directly if it is not a file, so let's pass the relative path or URL
        formData.append("image", editorState.image);
      }

      // Map category to appropriate Lucide icon automatically
      let icon = "file-text";
      if (editorState.category === "Tools") icon = "terminal";
      else if (editorState.category === "Links") icon = "external-link";
      else if (editorState.category === "Tutorials") icon = "code";
      formData.append("icon", icon);

      formData.append("sections", JSON.stringify(editorState.sections));

      if (editId) {
        await updateResource(editId, formData);
      } else {
        await createResource(formData);
      }

      showAlert({
        title: editId ? "Resource Updated" : "Resource Submitted",
        message: editId 
          ? "Your resource changes have been successfully saved." 
          : "Your resource submission has been received and is pending approval.",
        type: "success",
      });

      // Redirect back to resources directory
      navigate("/app/resources");
    } catch (err: any) {
      console.error("Failed to submit resource:", err);
      showAlert({
        title: "Submission Failed",
        message: err.message || "Failed to process resource submission.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/app/resources");
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Loading resource editor...</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-8">
        <div className="space-y-1">
          <Link
            to="/app/resources"
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-4 h-4 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
              {editId ? "Edit Resource" : "Create Resource"}
            </h1>
          </div>
          <p className="text-xs text-text-muted">
            {editId ? "Modify and update resource post details" : "Design and publish custom learning resources using the CMS Builder"}
          </p>
        </div>
      </div>

      {/* CMS Blog Builder tailored for Resource creation */}
      <CMSBlogBuilder
        state={editorState}
        onChange={setEditorState}
        categories={["Tutorials", "Documents", "Tools", "Links"]}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={isSubmitting}
        saveLabel={editId ? "Save Resource Changes" : "Submit Resource Submission"}
        titleLabel="CMS Resource Creator"
      />
    </div>
  );
}
