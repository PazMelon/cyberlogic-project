import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchEventById, createEvent, updateEvent } from "../../utils/api";
import { useDialog } from "../../utils/useDialog";
import CMSBlogBuilder, { generateId } from "../../components/ui/CMSBlogBuilder";
import type { CMSBlogState } from "../../components/ui/CMSBlogBuilder";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showAlert } = useDialog();
  const editId = id ? Number(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state tailored for Event properties using the CMS Blog Builder schema
  const [editorState, setEditorState] = useState<CMSBlogState>({
    title: "",
    subtitle: "",
    excerpt: "", // maps to short description
    content: "", // intro text
    author: user?.name || "System Admin",
    authorAvatar: user?.avatar,
    userId: user?.id,
    category: "Workshop", // maps to Event type
    image: "", // cover image
    readTime: "",
    featured: false,
    sections: [
      { type: "text", id: generateId(), html: "" }
    ],
    isEvent: true,
    eventDate: "",
    eventStartTime: "",
    eventEndTime: "",
    eventLocation: "",
    eventCapacity: 50,
    eventMode: "registration_and_attendance",
    attendanceCapacity: undefined,
    registrationStart: undefined,
    registrationEnd: undefined,
    attendanceStart: undefined,
    attendanceEnd: undefined
  });

  // Load existing event data if in Edit Mode
  useEffect(() => {
    async function loadData() {
      if (!editId) return;
      setIsLoading(true);
      try {
        const match = await fetchEventById(editId);
        setEditorState({
          title: match.title || "",
          subtitle: "",
          excerpt: match.description || "",
          content: "",
          author: match.user?.name || user?.name || "System Admin",
          authorAvatar: match.user?.avatar || user?.avatar,
          userId: match.userId || match.user?.id || user?.id,
          category: match.type || "Workshop",
          image: match.image || "",
          readTime: "",
          featured: false,
          sections: match.sections || [{ type: "text", id: generateId(), html: "" }],
          isEvent: true,
          eventDate: match.date || "",
          eventStartTime: match.startTime || "",
          eventEndTime: match.endTime || "",
          eventLocation: match.location || "",
          eventCapacity: match.capacity !== null && match.capacity !== undefined ? match.capacity : undefined,
          eventMode: match.eventMode || "registration_and_attendance",
          attendanceCapacity: match.attendanceCapacity !== null && match.attendanceCapacity !== undefined ? match.attendanceCapacity : undefined,
          registrationStart: match.registrationStart || undefined,
          registrationEnd: match.registrationEnd || undefined,
          attendanceStart: match.attendanceStart || undefined,
          attendanceEnd: match.attendanceEnd || undefined
        });
      } catch (err) {
        console.error("Failed to load event details:", err);
        showAlert({
          title: "Load Failed",
          message: "Failed to load event details from backend database.",
          type: "error",
        });
        navigate("/admin/events");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [editId, navigate, user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editorState.title.trim() || 
      !editorState.excerpt.trim() || 
      !editorState.eventDate || 
      !editorState.eventStartTime || 
      !editorState.eventEndTime || 
      !editorState.eventLocation
    ) {
      showAlert({
        title: "Required Fields",
        message: "Please fill in all required fields marked with *",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: editorState.title,
        description: editorState.excerpt, // maps excerpt to description
        type: editorState.category as "Workshop" | "Seminar" | "Competition" | "Social" | "Meeting",
        date: editorState.eventDate,
        startTime: editorState.eventStartTime,
        endTime: editorState.eventEndTime,
        location: editorState.eventLocation,
        capacity: editorState.eventMode !== 'attendance_only' ? editorState.eventCapacity : undefined,
        image: editorState.image || undefined,
        sections: editorState.sections,
        eventMode: editorState.eventMode,
        attendanceCapacity: editorState.eventMode !== 'registration_only' ? editorState.attendanceCapacity : undefined,
        registrationStart: editorState.eventMode !== 'attendance_only' ? editorState.registrationStart : undefined,
        registrationEnd: editorState.eventMode !== 'attendance_only' ? editorState.registrationEnd : undefined,
        attendanceStart: editorState.eventMode !== 'registration_only' ? editorState.attendanceStart : undefined,
        attendanceEnd: editorState.eventMode !== 'registration_only' ? editorState.attendanceEnd : undefined,
        user_id: editorState.userId
      };

      if (editId) {
        await updateEvent(editId, payload);
      } else {
        await createEvent(payload);
      }

      // Redirect back to events management directory
      navigate("/admin/events");
    } catch (err: any) {
      console.error("Failed to save event:", err);
      showAlert({
        title: "Save Failed",
        message: err.message || "Failed to save event to database.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/events"
          className="p-2 rounded-xl bg-surface-800 border border-border/80 text-text-muted hover:text-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary animate-pulse" /> {editId ? "Edit Event" : "Create Event"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {editId ? "Modify and update published event details" : "Design and publish custom events using the CMS Builder"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading data from secure database...</p>
        </div>
      ) : (
        /* Generic CMS Builder Component configured for Events */
        <CMSBlogBuilder
          state={editorState}
          onChange={setEditorState}
          categories={["Workshop", "Seminar", "Competition", "Social", "Meeting"]}
          onSave={handleSave}
          onCancel={() => navigate("/admin/events")}
          saving={isSubmitting}
          saveLabel={editId ? "Update Event" : "Publish Event"}
          titleLabel={editId ? "Edit Event Info" : "New Event Info"}
          isSuperAdmin={user?.role === "superadmin"}
        />
      )}
    </div>
  );
}
