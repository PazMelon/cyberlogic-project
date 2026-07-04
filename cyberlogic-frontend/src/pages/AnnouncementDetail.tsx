import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import { ChevronLeft, Calendar, User, Pin } from "lucide-react";
import { fetchAnnouncementById } from "../utils/api";
import type { Announcement } from "../data/mockData";
import BlogContentRenderer from "../components/common/BlogContentRenderer";

export default function AnnouncementDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        const data = await fetchAnnouncementById(Number(id));
        setItem(data);
      } catch (err: any) {
        console.error("Failed to load details:", err);
        setError(err.message || "Failed to load announcement.");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Retrieving announcement details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-primary">Announcement Not Found</h2>
        <p className="text-xs text-text-muted mt-1">{error}</p>
        <Link
          to={isPortal ? "/app/announcements" : "/announcements"}
          className="text-primary hover:underline text-sm mt-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to list
        </Link>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    General: "bg-info/10 text-info border border-info/20",
    Academic: "bg-success/10 text-success border border-success/20",
    Events: "bg-accent/10 text-accent border border-accent/20",
  };

  return (
    <div className={isPortal ? "pb-12" : "pt-24 pb-16"}>
      <div className={isPortal ? "max-w-4xl" : "max-w-4xl mx-auto px-4 sm:px-6"}>
        
        {/* Back navigation */}
        <Link
          to={isPortal ? "/app/announcements" : "/announcements"}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Announcements
        </Link>

        {/* Hero Header */}
        <div className="space-y-4 mb-8 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[item.category]}`}>
              {item.category}
            </span>
            {item.pinned && (
              <span className="inline-flex items-center gap-1 text-xs text-warning font-semibold animate-pulse">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
            {item.title}
          </h1>

          {item.subtitle && (
            <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-light">
              {item.subtitle}
            </p>
          )}

          {/* Author Card & Date info */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/60">
            <img
              src={item.authorAvatar}
              alt={item.author}
              className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-text-muted" /> {item.author}
              </p>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> Published on {item.date}
              </p>
            </div>
          </div>
        </div>

        {/* Blog Post Content Body */}
        <div className="space-y-8 animate-fadeIn">
          
          {/* Main intro content */}
          {item.content && (
            <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
              {item.content}
            </p>
          )}

          {/* Dynamically Render CMS Blog Sections */}
          {item.sections && item.sections.length > 0 ? (
            <div className="pt-6 border-t border-border/30">
              <BlogContentRenderer content={item.sections} />
            </div>
          ) : (
            <div className="text-xs text-text-muted py-6 italic">
              No further sections provided.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
