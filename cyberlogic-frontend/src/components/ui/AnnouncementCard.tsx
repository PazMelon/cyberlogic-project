import { Megaphone, Pin } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { Badge } from "./Badge";
import { Card } from "./Card";

interface Announcement {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: "General" | "Academic" | "Events";
  author: string;
  authorAvatar: string;
  date: string;
  pinned?: boolean;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  layout?: "default" | "compact";
  index?: number;
}

export function AnnouncementCard({
  announcement,
  layout = "default",
  index = 0,
}: AnnouncementCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app") || location.pathname.startsWith("/admin");
  const detailUrl = isPortal ? `/app/announcements/${announcement.id}` : `/announcements/${announcement.id}`;

  const categoryVariants: Record<string, "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral"> = {
    General: "info",
    Events: "accent",
    Academic: "success",
  };

  const selectedVariant = categoryVariants[announcement.category] || "neutral";

  const authorAvatar = (announcement as any).user?.avatar || announcement.authorAvatar;
  const authorName = (announcement as any).user?.name || announcement.author;
  const authorUserId = (announcement as any).userId || (announcement as any).user?.id;

  const handleAuthorClick = (e: React.MouseEvent) => {
    if (authorUserId) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/app/profile/${authorUserId}`);
    }
  };

  if (layout === "compact") {
    return (
      <Link to={detailUrl} className="block group">
        <div className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-3 h-3 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-medium text-text-primary group-hover:text-primary truncate flex-1 transition-colors">{announcement.title}</h3>
          </div>
          <p className="text-xs text-text-muted line-clamp-1 ml-5">{announcement.excerpt}</p>
        </div>
      </Link>
    );
  }

  // Animation delay classes (disabled in portal/admin views to prevent hidden elements bugs)
  const delayClasses = isPortal
    ? ""
    : index === 0 
    ? "reveal-element reveal-fade-in-up" 
    : index === 1 
    ? "reveal-element reveal-fade-in-up reveal-delay-100" 
    : "reveal-element reveal-fade-in-up reveal-delay-200";

  return (
    <Link to={detailUrl} className="block h-full group">
      <Card
        hoverEffect
        glowColor="primary"
        className={`p-6 flex flex-col justify-between h-full group ${delayClasses}`}
      >
        <div>
          {/* Category + Pinned Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={selectedVariant}>{announcement.category}</Badge>
            {announcement.pinned && (
              <span className="inline-flex items-center gap-1 text-xs text-warning">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {announcement.title}
          </h3>
          
          {/* Snippet */}
          <p className="text-sm text-text-muted mb-4 line-clamp-2">{announcement.excerpt}</p>
        </div>

        {/* Author + Date footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div
            onClick={handleAuthorClick}
            className={`flex items-center gap-3 ${authorUserId ? "cursor-pointer hover:opacity-80" : ""}`}
          >
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-7 h-7 rounded-full bg-surface-700 object-cover"
            />
            <span className="text-xs font-medium text-text-secondary">{authorName}</span>
          </div>
          <time className="text-xs text-text-muted">{announcement.date}</time>
        </div>
      </Card>
    </Link>
  );
}
