import { Link } from "react-router";
import { MessageSquare, Heart, Eye, Pin, CheckCircle } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";

const defaultCategories = [
  { id: "general", name: "General Discussion", color: "primary" },
  { id: "tech-talk", name: "Tech Talk", color: "accent" },
  { id: "help", name: "Help & Support", color: "success" },
  { id: "ctf", name: "CTF Challenges", color: "error" },
  { id: "off-topic", name: "Off-Topic", color: "warning" },
];

interface ForumThread {
  id: number;
  categoryId: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  replyCount: number;
  likes: number;
  views: number;
  createdAt: string;
  lastActivity: string;
  pinned?: boolean;
  solved?: boolean;
}

interface ForumThreadCardProps {
  thread: ForumThread;
  mode?: "full" | "compact";
}

export function ForumThreadCard({ thread, mode = "full" }: ForumThreadCardProps) {
  const category = defaultCategories.find((c) => c.id === thread.categoryId);

  const getCategoryColorVariant = (colorName?: string) => {
    const map: Record<string, "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral"> = {
      primary: "primary",
      accent: "accent",
      success: "success",
      error: "error",
      warning: "warning",
    };
    return map[colorName || ""] || "neutral";
  };

  const badgeVariant = getCategoryColorVariant(category?.color);

  if (mode === "compact") {
    return (
      <Link
        to={`/app/forums/thread/${thread.id}`}
        className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <img
          src={thread.authorAvatar}
          alt={thread.author}
          className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate">
            {thread.title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {thread.author} · {thread.lastActivity}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted flex-shrink-0">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {thread.replyCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3 h-3" /> {thread.likes}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Card hoverEffect glowColor="primary" className="p-4 sm:p-5 group">
      <Link to={`/app/forums/thread/${thread.id}`} className="block">
        <div className="flex items-start gap-4">
          <img
            src={thread.authorAvatar}
            alt={thread.author}
            className="w-10 h-10 rounded-full bg-surface-700 flex-shrink-0 mt-0.5 object-cover"
          />
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {thread.pinned && (
                <Badge variant="warning">
                  <Pin className="w-3 h-3" /> Pinned
                </Badge>
              )}
              {thread.solved && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3" /> Solved
                </Badge>
              )}
              {category && (
                <Badge variant={badgeVariant}>
                  {category.name}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
              {thread.title}
            </h3>
            
            {/* Snippet */}
            <p className="text-sm text-text-muted line-clamp-1 mb-2">
              {thread.content}
            </p>

            {/* Footer metrics */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="font-medium text-text-secondary">{thread.author}</span>
              <span>{thread.lastActivity}</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {thread.replyCount} replies
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3" /> {thread.likes}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <Eye className="w-3 h-3" /> {thread.views} views
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
