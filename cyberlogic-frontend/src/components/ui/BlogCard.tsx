
import { Link, useLocation, useNavigate } from "react-router";
import { Star, Clock } from "lucide-react";
import { Badge } from "./Badge";
import { Card } from "./Card";
import type { BlogPost } from "../../data/mockData";

interface BlogCardProps {
  blog: BlogPost;
  index?: number;
}

export function BlogCard({ blog, index = 0 }: BlogCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");
  const detailUrl = isPortal ? `/app/blogs/${blog.id}` : `/blogs/${blog.id}`;

  const categoryVariants: Record<string, "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral"> = {
    Tech: "primary",
    Tutorial: "accent",
    News: "success",
    Lifestyle: "warning",
    General: "info",
    Academic: "neutral", // will fallback to neutral, but styling applies
  };

  const selectedVariant = categoryVariants[blog.category] || "neutral";

  // Animation delay classes
  const delayClasses = index === 0 
    ? "animate-fade-in-up" 
    : index === 1 
    ? "animate-fade-in-up delay-100" 
    : "animate-fade-in-up delay-200";

  // Fallback image seed parser
  const resolveCoverImage = (url?: string) => {
    if (!url) {
      return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60";
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60&sig=${encodeURIComponent(url)}`;
  };

  const authorAvatar = (blog as any).user?.avatar || blog.authorAvatar;
  const authorName = (blog as any).user?.name || blog.author;
  const authorUserId = (blog as any).userId || (blog as any).user?.id;

  const handleAuthorClick = (e: React.MouseEvent) => {
    if (authorUserId) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/app/profile/${authorUserId}`);
    }
  };

  return (
    <Link to={detailUrl} className="block h-full group">
      <Card
        hoverEffect
        glowColor="primary"
        className={`flex flex-col justify-between h-full group overflow-hidden border border-border/80 bg-surface-900/40 ${delayClasses}`}
      >
        <div>
          {/* Card Cover Image with overlay */}
          <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border bg-surface-950/20">
            <img
              src={resolveCoverImage(blog.image)}
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {blog.featured && (
              <div className="absolute top-3 left-3 bg-amber-500/90 text-surface-950 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                <Star className="w-3 h-3 fill-surface-950" /> Featured
              </div>
            )}
            {blog.readTime && (
              <div className="absolute bottom-3 right-3 bg-surface-950/70 text-text-primary text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm border border-border/40">
                <Clock className="w-3 h-3 text-primary" /> {blog.readTime}
              </div>
            )}
          </div>

          <div className="p-5">
            {/* Category */}
            <div className="mb-3">
              <Badge variant={selectedVariant}>{blog.category}</Badge>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2 font-[family-name:var(--font-heading)]">
              {blog.title}
            </h3>

            {/* Excerpt */}
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4">
              {blog.excerpt}
            </p>

            {/* Tags preview */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {blog.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-medium text-text-muted/80 bg-surface-800 border border-border/60 px-1.5 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
                {blog.tags.length > 3 && (
                  <span className="text-[9px] font-medium text-text-muted bg-surface-800/50 px-1.5 py-0.5 rounded-md">
                    +{blog.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info: Author + Publish Date */}
        <div className="px-5 pb-5 pt-3 border-t border-border/40 flex items-center justify-between">
          <div
            onClick={handleAuthorClick}
            className={`flex items-center gap-2 ${authorUserId ? "cursor-pointer hover:opacity-80" : ""}`}
          >
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-6 h-6 rounded-full bg-surface-700 object-cover border border-border/60"
            />
            <span className="text-[11px] font-medium text-text-secondary">{authorName}</span>
          </div>
          <time className="text-[10px] text-text-muted">{blog.date}</time>
        </div>
      </Card>
    </Link>
  );
}
