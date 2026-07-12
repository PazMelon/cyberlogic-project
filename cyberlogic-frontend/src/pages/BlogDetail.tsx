import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import { Calendar, Clock, Star, Tag, User } from "lucide-react";
import { fetchBlogById } from "../utils/api";
import type { BlogPost } from "../data/mockData";
import { useSEO } from "../utils/useSEO";
import DetailLayout from "../components/common/DetailLayout";

export default function BlogDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCoverImageUrl = () => {
    if (!item) return undefined;
    return item.image ? (item.image.startsWith("http") ? item.image : `${window.location.origin}/storage/${item.image}`) : undefined;
  };

  useSEO({
    title: item ? item.title : "Loading Blog...",
    description: item ? item.excerpt : undefined,
    keywords: item ? [item.category, ...(item.tags || []), "Cyberlogic Blog"] : undefined,
    image: getCoverImageUrl(),
    type: "article",
  });

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        const data = await fetchBlogById(Number(id));
        setItem(data);
      } catch (err: any) {
        console.error("Failed to load blog details:", err);
        setError(err.message || "Failed to load blog post.");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  const categoryColors: Record<string, string> = {
    Tech: "bg-primary/10 text-primary border-primary/20",
    Tutorial: "bg-accent/10 text-accent border-accent/20",
    News: "bg-success/10 text-success border-success/20",
    Lifestyle: "bg-warning/10 text-warning border-warning/20",
    General: "bg-info/10 text-info border-info/20",
    Academic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const authorAvatar = item ? ((item as any).user?.avatar || item.authorAvatar) : "";
  const authorName = item ? ((item as any).user?.name || item.author) : "";
  const authorUserId = item ? ((item as any).userId || (item as any).user?.id) : undefined;

  const badges = item && (
    <>
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[item.category] || "bg-surface-800 text-text-muted"} border`}>
        {item.category}
      </span>
      {item.featured && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Star className="w-3.5 h-3.5 fill-amber-400" /> Featured Post
        </span>
      )}
    </>
  );

  const footer = item && item.tags && item.tags.length > 0 && (
    <div className={isPortal ? "glass rounded-2xl p-6 border border-border" : "pt-8 border-t border-border/40"}>
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="w-4 h-4 text-text-muted" />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">Tags:</span>
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium text-text-secondary bg-surface-900 border border-border/80 px-2.5 py-1 rounded-xl"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );

  const sidebar = item && (
    <>
      {/* Metadata Panel */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary/40 to-accent/40" />
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
            {item.readTime && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4 text-accent" />
                <span>{item.readTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blogs info card */}
      <div className="glass rounded-xl p-4 border border-border space-y-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          About Cyberlogic Blogs
        </h3>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Cyberlogic blog posts cover tech updates, tutorials, guides, and student academic highlights written by officers and members.
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
        <p className="text-xs text-text-muted flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Published on {item.date}
          </span>
          {item.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {item.readTime}
            </span>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <DetailLayout
      isPortal={isPortal}
      backLink={{
        to: isPortal ? "/app/blogs" : "/blogs",
        label: isPortal ? "Back to Blogs" : "Back to blog feed",
      }}
      badges={badges}
      title={item?.title || ""}
      subtitle={item?.subtitle}
      image={item?.image}
      introText={item?.excerpt}
      sections={item?.sections}
      sidebar={sidebar}
      footer={footer}
      publicHeaderExtra={publicHeaderExtra}
      loading={loading}
      loadingText="Retrieving blog details..."
      error={error}
      errorTitle="Blog Post Not Found"
    />
  );
}
