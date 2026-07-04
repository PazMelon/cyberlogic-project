import { Megaphone, Pin } from "lucide-react";
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
  const categoryVariants: Record<string, "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral"> = {
    General: "info",
    Events: "accent",
    Academic: "success",
  };

  const selectedVariant = categoryVariants[announcement.category] || "neutral";

  if (layout === "compact") {
    return (
      <div className="p-2 rounded-lg hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="w-3 h-3 text-primary" />
          <h3 className="text-sm font-medium text-text-primary truncate flex-1">{announcement.title}</h3>
        </div>
        <p className="text-xs text-text-muted line-clamp-1 ml-5">{announcement.excerpt}</p>
      </div>
    );
  }

  // Animation delay classes
  const delayClasses = index === 0 ? "animate-fade-in-up" : index === 1 ? "animate-fade-in-up delay-100" : "animate-fade-in-up delay-200";

  return (
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
        <div className="flex items-center gap-3">
          <img
            src={announcement.authorAvatar}
            alt={announcement.author}
            className="w-7 h-7 rounded-full bg-surface-700 object-cover"
          />
          <span className="text-xs font-medium text-text-secondary">{announcement.author}</span>
        </div>
        <time className="text-xs text-text-muted">{announcement.date}</time>
      </div>
    </Card>
  );
}
