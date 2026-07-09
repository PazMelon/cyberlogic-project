import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import { ChevronLeft, Calendar, User, Pin } from "lucide-react";
import { fetchAnnouncementById } from "../utils/api";
import type { Announcement } from "../data/mockData";
import BlogContentRenderer, { resolveCmsUrl } from "../components/common/BlogContentRenderer";
import { FullscreenImageViewer } from "../components/forum/FullscreenImageViewer";

export default function AnnouncementDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const authorAvatar = (item as any).user?.avatar || item.authorAvatar;
  const authorName = (item as any).user?.name || item.author;
  const authorUserId = (item as any).userId || (item as any).user?.id;

  // Gather all images for the fullscreen viewer gallery
  const allImages: string[] = [];
  if (item) {
    if (item.image) {
      allImages.push(resolveCmsUrl(item.image));
    }
    if (item.sections) {
      let sections: any[] = [];
      if (typeof item.sections === "string") {
        try {
          sections = JSON.parse(item.sections);
        } catch {}
      } else if (Array.isArray(item.sections)) {
        sections = item.sections;
      }
      sections.forEach((sec: any) => {
        if (sec.type === "image" && sec.images) {
          sec.images.forEach((img: any) => {
            if (img.url) {
              allImages.push(resolveCmsUrl(img.url));
            }
          });
        }
      });
    }
  }

  const handleImageClick = (url: string) => {
    const idx = allImages.indexOf(url);
    if (idx !== -1) {
      setActiveImageIndex(idx);
      setIsViewerOpen(true);
    }
  };

  if (isPortal) {
    return (
      <div className="pb-12 w-full max-w-6xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          to="/app/announcements"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Announcements
        </Link>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Left Column: Title, cover image, and body content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header / Title block */}
            <div className="glass rounded-2xl p-6 border border-border space-y-4">
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
              <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
                {item.title}
              </h1>
              {item.subtitle && (
                <p className="text-base sm:text-lg text-text-muted leading-relaxed font-light">
                  {item.subtitle}
                </p>
              )}
            </div>

            {/* Cover Image banner */}
            {item.image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border max-h-[400px]">
                <img
                  src={resolveCmsUrl(item.image)}
                  alt={item.title}
                  onClick={() => handleImageClick(resolveCmsUrl(item.image))}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </div>
            )}

            {/* Blog Post Content Body */}
            <div className="glass rounded-2xl p-6 border border-border space-y-6">
              {/* Main intro content */}
              {item.content && (
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
                  {item.content}
                </p>
              )}

              {/* Dynamically Render CMS Blog Sections */}
              {item.sections && item.sections.length > 0 ? (
                <div className="pt-6 border-t border-border/30">
                  <BlogContentRenderer content={item.sections} onImageClick={handleImageClick} />
                </div>
              ) : (
                <div className="text-xs text-text-muted py-2 italic">
                  No further sections provided.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Metadata & Author Panel */}
          <div className="lg:col-span-4">
            <div className="space-y-6 sticky top-20">
              
              {/* Metadata Panel */}
              <div className="glass rounded-2xl border border-border overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-info/40 to-primary/40" />
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Post Information
                  </h3>
                  
                  {authorUserId ? (
                    <Link
                      to={`/app/profile/${authorUserId}`}
                      className="flex items-center gap-3 py-3 border-b border-border/50 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
                      />
                      <div>
                        <p className="text-xs text-text-muted">Author</p>
                        <p className="text-sm font-bold text-text-primary hover:text-primary transition-colors">{authorName}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3 border-b border-border/50">
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
                      />
                      <div>
                        <p className="text-xs text-text-muted">Author</p>
                        <p className="text-sm font-bold text-text-primary">{authorName}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Published: {item.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="w-4 h-4 rounded-full bg-surface-800 flex items-center justify-center text-[9px] font-bold text-accent">5</span>
                      <span>5 min read</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Announcements info card */}
              <div className="glass rounded-xl p-4 border border-border space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Important Note
                </h3>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  All announcements are official notifications from the Cyberlogic executive board. For questions or details, please contact officers in the respective chat channels.
                </p>
              </div>

            </div>
          </div>

        </div>

        {allImages.length > 0 && (
          <FullscreenImageViewer
            images={allImages}
            initialIndex={activeImageIndex}
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back navigation */}
        <Link
          to="/announcements"
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
            {authorUserId ? (
              <Link to={`/app/profile/${authorUserId}`} className="hover:opacity-85 transition-opacity flex-shrink-0">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
                />
              </Link>
            ) : (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-text-muted" />
                {authorUserId ? (
                  <Link to={`/app/profile/${authorUserId}`} className="hover:text-primary transition-colors">
                    {authorName}
                  </Link>
                ) : (
                  authorName
                )}
              </p>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> Published on {item.date}
              </p>
            </div>
          </div>
        </div>

        {/* Cover Image banner */}
        {item.image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border mb-8 max-h-[400px]">
            <img
              src={resolveCmsUrl(item.image)}
              alt={item.title}
              onClick={() => handleImageClick(resolveCmsUrl(item.image))}
              className="w-full h-full object-cover cursor-zoom-in"
            />
          </div>
        )}

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
              <BlogContentRenderer content={item.sections} onImageClick={handleImageClick} />
            </div>
          ) : (
            <div className="text-xs text-text-muted py-6 italic">
              No further sections provided.
            </div>
          )}

        </div>

      </div>
      
      {allImages.length > 0 && (
        <FullscreenImageViewer
          images={allImages}
          initialIndex={activeImageIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
