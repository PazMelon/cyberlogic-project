import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import { Calendar, User, Pin } from "lucide-react";
import { fetchAnnouncementById } from "../utils/api";
import type { Announcement } from "../data/mockData";
import { useSEO } from "../utils/useSEO";
import DetailLayout from "../components/common/DetailLayout";

export default function AnnouncementDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCoverImageUrl = () => {
    if (!item) return undefined;
    return item.image ? (item.image.startsWith("http") ? item.image : `${window.location.origin}/storage/${item.image}`) : undefined;
  };

  useSEO({
    title: item ? item.title : "Loading Announcement...",
    description: item ? item.excerpt : undefined,
    keywords: item ? [item.category, "Announcement", "Cyberlogic News"] : undefined,
    image: getCoverImageUrl(),
    type: "article",
  });

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

  const categoryColors: Record<string, string> = {
    General: "bg-info/10 text-info border border-info/20",
    Academic: "bg-success/10 text-success border border-success/20",
    Events: "bg-accent/10 text-accent border border-accent/20",
  };

  const authorAvatar = item ? ((item as any).user?.avatar || item.authorAvatar) : "";
  const authorName = item ? ((item as any).user?.name || item.author) : "";
  const authorUserId = item ? ((item as any).userId || (item as any).user?.id) : undefined;

  const badges = item && (
    <>
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[item.category] || "bg-surface-800 text-text-muted"} border`}>
        {item.category}
      </span>
      {item.pinned && (
        <span className="inline-flex items-center gap-1 text-xs text-warning font-semibold animate-pulse">
          <Pin className="w-3 h-3" /> Pinned
        </span>
      )}
    </>
  );

  const sidebar = item && (
    <>
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
    </>
  );

  const publicHeaderExtra = item && (
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
  );

  return (
    <DetailLayout
      isPortal={isPortal}
      backLink={{
        to: isPortal ? "/app/announcements" : "/announcements",
        label: isPortal ? "Back to Announcements" : "Back to Announcements",
      }}
      badges={badges}
      title={item?.title || ""}
      subtitle={item?.subtitle}
      image={item?.image}
      introText={item?.content}
      sections={item?.sections}
      sidebar={sidebar}
      publicHeaderExtra={publicHeaderExtra}
      loading={loading}
      loadingText="Retrieving announcement details..."
      error={error}
      errorTitle="Announcement Not Found"
    />
  );
}
