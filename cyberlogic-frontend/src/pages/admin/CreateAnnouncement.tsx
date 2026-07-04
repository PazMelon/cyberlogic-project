import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { FileText, Layers, Plus, Trash, ArrowLeft } from "lucide-react";
import { announcements } from "../../data/mockData";
import { Button, Card } from "../../components/ui";
import type { Announcement, BlogSection } from "../../data/mockData";

interface FormSection {
  id: string;
  heading: string;
  body: string;
  layout: "single" | "carousel" | "bento" | "masonry" | "split" | "showcase" | "none";
  imageCsv: string;
}

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<"General" | "Academic" | "Events">("General");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  
  // Blog Sections State
  const [sections, setSections] = useState<FormSection[]>([]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `section-${Date.now()}-${Math.random()}`,
        heading: "",
        body: "",
        layout: "none",
        imageCsv: "",
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSectionField = (id: string, field: keyof FormSection, value: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      // Map FormSections to BlogSections for data submission
      const mappedSections: BlogSection[] = sections.map((s) => {
        let images: string[] = s.imageCsv
          .split(",")
          .map((img) => img.trim())
          .filter(Boolean);

        // Auto-seed images if layout is specified but no links are provided
        if (images.length === 0 && s.layout !== "none") {
          if (s.layout === "single" || s.layout === "split") {
            images = ["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60"];
          } else if (s.layout === "bento") {
            images = [
              "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60",
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60",
              "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600&auto=format&fit=crop&q=60"
            ];
          } else if (s.layout === "carousel" || s.layout === "showcase" || s.layout === "masonry") {
            images = [
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60",
              "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60",
              "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=60",
              "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60"
            ];
          }
        }

        return {
          id: s.id,
          heading: s.heading || undefined,
          body: s.body || undefined,
          layout: s.layout,
          images: images.length > 0 ? images : undefined,
        };
      });

      const newAnnouncement: Announcement = {
        id: Date.now(),
        title,
        subtitle: subtitle || undefined,
        excerpt,
        content: content || "",
        category,
        author: "System Admin",
        authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        pinned,
        sections: mappedSections,
      };

      // Unshift directly into the mockData exported list
      announcements.unshift(newAnnouncement);
      setIsSubmitting(false);

      // Redirect back to announcements management
      navigate("/admin/announcements");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/announcements"
          className="p-2 rounded-xl bg-surface-800 border border-border/80 text-text-muted hover:text-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary animate-pulse" /> Create Announcement
          </h1>
          <p className="text-sm text-text-muted mt-1">Lightweight CMS Editor & Rich Article Builder</p>
        </div>
      </div>

      <Card className="p-6 border border-border bg-surface-900/40 relative animate-fadeIn">
        <form onSubmit={handleCreateAnnouncement} className="space-y-6">
          
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Announcement Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyber Security Pentesting Assembly"
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Subtitle / Tagline</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Learn the methodologies of red team engagements"
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Grid: Category & Pinned Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all"
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Events">Events</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                id="pinned-checkbox-dedicated"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-border text-amber-500 bg-surface-800 focus:ring-amber-500/40 focus:ring-2 focus:ring-offset-0 focus:outline-none [color-scheme:dark]"
              />
              <label htmlFor="pinned-checkbox-dedicated" className="text-xs font-semibold text-text-secondary cursor-pointer select-none">
                Pin announcement to top of feeds
              </label>
            </div>
          </div>

          {/* Excerpt Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Short Summary / Feed Excerpt *</label>
            <input
              type="text"
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief 1-sentence synopsis displayed on cards..."
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Main Content Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Introduction Text Content</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Main introduction paragraph displayed under the header..."
              className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all resize-none"
            />
          </div>

          {/* DRAFT CMS SECTIONS BUILDER */}
          <div className="space-y-4 border-t border-border pt-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Layout Sections ({sections.length})
              </h3>
              <Button
                type="button"
                variant="secondary"
                onClick={addSection}
                className="px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section Block
              </Button>
            </div>

            {sections.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-text-muted bg-surface-950/20">
                No additional blog sections configured. (Text intro only)
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((sec, idx) => (
                  <Card key={sec.id} className="p-4 border border-border bg-surface-900/30 relative space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Section Block #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSection(sec.id)}
                        className="p-1 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all"
                        title="Delete Block"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Header Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8 space-y-1">
                        <label className="text-[10px] font-semibold text-text-muted">Section Heading (Optional)</label>
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => updateSectionField(sec.id, "heading", e.target.value)}
                          placeholder="e.g. Lab Configurations"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/30 transition-all"
                        />
                      </div>
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] font-semibold text-text-muted">Media Template Layout</label>
                        <select
                          value={sec.layout}
                          onChange={(e) => updateSectionField(sec.id, "layout", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-amber-500/30 transition-all"
                        >
                          <option value="none">Text Only (No Media)</option>
                          <option value="single">Single Image</option>
                          <option value="carousel">Gallery Carousel</option>
                          <option value="bento">Bento Grid (3 Images)</option>
                          <option value="masonry">Asymmetric Masonry</option>
                          <option value="split">Split Layout (Text/Img)</option>
                          <option value="showcase">Thumbnail Showcase</option>
                        </select>
                      </div>
                    </div>

                    {/* Section Body Textarea */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-text-muted">Section Paragraph Body Content</label>
                      <textarea
                        rows={2.5}
                        value={sec.body}
                        onChange={(e) => updateSectionField(sec.id, "body", e.target.value)}
                        placeholder="Describe details for this specific block..."
                        className="w-full p-2.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/30 transition-all resize-none"
                      />
                    </div>

                    {/* Image Input (shown only if layout is not "none") */}
                    {sec.layout !== "none" && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[10px] font-semibold text-text-muted flex items-center justify-between">
                          <span>Image Source Seeds / URLs (Comma-separated)</span>
                          <span className="text-[9px] text-text-muted italic">Leave empty to auto-seed beautiful mockups</span>
                        </label>
                        <input
                          type="text"
                          value={sec.imageCsv}
                          onChange={(e) => updateSectionField(sec.id, "imageCsv", e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/30 transition-all"
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Form Footer Action Toolbar */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/admin/announcements")}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="admin"
              isLoading={isSubmitting}
              className="px-5 py-2"
            >
              Publish Announcement
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}
