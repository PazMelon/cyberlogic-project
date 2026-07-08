import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import { ChevronLeft, Calendar, Clock, Star, Tag, User } from "lucide-react";
import { fetchBlogById } from "../utils/api";
import type { BlogPost } from "../data/mockData";
import BlogContentRenderer from "../components/common/BlogContentRenderer";

export default function BlogDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Retrieving blog details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-primary">Blog Post Not Found</h2>
        <p className="text-xs text-text-muted mt-1">{error}</p>
        <Link
          to={isPortal ? "/app/blogs" : "/blogs"}
          className="text-primary hover:underline text-sm mt-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to blog feed
        </Link>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Tech: "bg-primary/10 text-primary border-primary/20",
    Tutorial: "bg-accent/10 text-accent border-accent/20",
    News: "bg-success/10 text-success border-success/20",
    Lifestyle: "bg-warning/10 text-warning border-warning/20",
    General: "bg-info/10 text-info border-info/20",
    Academic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  // Fallback image seed parser
  const resolveCoverImage = (url?: string) => {
    if (!url) {
      return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80";
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80&sig=${encodeURIComponent(url)}`;
  };

  if (isPortal) {
    return (
      <div className="pb-12 w-full max-w-6xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          to="/app/blogs"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Blogs
        </Link>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Left Column: Title, cover image, and body content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header / Title block */}
            <div className="glass rounded-2xl p-6 border border-border space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[item.category] || "bg-surface-800 text-text-muted"} border`}>
                  {item.category}
                </span>
                {item.featured && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> Featured Post
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
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border max-h-[400px]">
              <img
                src={resolveCoverImage(item.image)}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Blog Post Content Body */}
            <div className="glass rounded-2xl p-6 border border-border space-y-6">
              {/* Main excerpt intro content */}
              {item.excerpt && (
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/50 pl-4 py-1">
                  {item.excerpt}
                </p>
              )}

              {/* Dynamically Render CMS Blog Sections */}
              {item.sections && item.sections.length > 0 ? (
                <div className="pt-6 border-t border-border/30 prose prose-invert max-w-none">
                  <BlogContentRenderer content={item.sections} />
                </div>
              ) : (
                <div className="text-xs text-text-muted py-2 italic">
                  No further sections provided.
                </div>
              )}
            </div>

            {/* Tags Footer */}
            {item.tags && item.tags.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-border">
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
            )}

          </div>

          {/* Right Column: Sticky Metadata & Author Panel */}
          <div className="lg:col-span-4">
            <div className="space-y-6 sticky top-20">
              
              {/* Metadata Panel */}
              <div className="glass rounded-2xl border border-border overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary/40 to-accent/40" />
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Post Information
                  </h3>
                  
                  <div className="flex items-center gap-3 py-3 border-b border-border/50">
                    <img
                      src={item.authorAvatar}
                      alt={item.author}
                      className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
                    />
                    <div>
                      <p className="text-xs text-text-muted">Author</p>
                      <p className="text-sm font-bold text-text-primary">{item.author}</p>
                    </div>
                  </div>

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

            </div>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back navigation */}
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to blog feed
        </Link>

        {/* Hero Header */}
        <div className="space-y-4 mb-8 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[item.category] || "bg-surface-800 text-text-muted"} border`}>
              {item.category}
            </span>
            {item.featured && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> Featured Post
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
        </div>

        {/* Cover Image banner */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-border mb-8 max-h-[400px]">
          <img
            src={resolveCoverImage(item.image)}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Blog Post Content Body */}
        <div className="space-y-8 animate-fadeIn">
          
          {/* Main excerpt intro content */}
          {item.excerpt && (
            <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/50 pl-4 py-1">
              {item.excerpt}
            </p>
          )}

          {/* Dynamically Render CMS Blog Sections */}
          {item.sections && item.sections.length > 0 ? (
            <div className="pt-6 border-t border-border/30 prose prose-invert max-w-none">
              <BlogContentRenderer content={item.sections} />
            </div>
          ) : (
            <div className="text-xs text-text-muted py-6 italic">
              No further sections provided.
            </div>
          )}

          {/* Tags Footer */}
          {item.tags && item.tags.length > 0 && (
            <div className="pt-8 border-t border-border/40">
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
          )}

        </div>

      </div>
    </div>
  );
}
