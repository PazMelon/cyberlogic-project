import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BookOpen, ChevronRight, Download } from "lucide-react";
import { fetchResources } from "../../utils/api";
import type { ResourceMapped } from "../../utils/api";
import { SkeletonBox, SkeletonLine } from "../Skeleton";

export function ResourcesHighlight({ isLoading }: { isLoading: boolean }) {
  const [featured, setFeatured] = useState<ResourceMapped[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchResources();
        setFeatured(data.slice(0, 4));
      } catch (err) {
        console.error("Failed to load landing featured resources:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  const iconMap: Record<string, React.ReactNode> = {
    code: <BookOpen className="w-5 h-5" />,
    shield: <BookOpen className="w-5 h-5" />,
    "file-text": <BookOpen className="w-5 h-5" />,
    "external-link": <BookOpen className="w-5 h-5" />,
    terminal: <BookOpen className="w-5 h-5" />,
    activity: <BookOpen className="w-5 h-5" />,
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-success">
              Learn & Grow
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Featured Resources
            </h2>
          </div>
          <Link
            to="/resources"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-success hover:text-green-400 transition-colors"
          >
            Browse all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {activeLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-2xl p-5 space-y-4 animate-pulse">
                  <SkeletonBox className="w-10 h-10 rounded-lg" />
                  <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                  <SkeletonLine widthClass="w-3/4" heightClass="h-5" />
                  <SkeletonLine widthClass="w-full" heightClass="h-4" />
                  <SkeletonLine widthClass="w-5/6" heightClass="h-4" />
                </div>
              ))}
            </>
          ) : featured.length > 0 ? (
            featured.map((resource) => (
              <div
                key={resource.id}
                className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                    {iconMap[resource.icon] || <BookOpen className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    {resource.category}
                  </span>
                  <h3 className="text-base font-semibold text-text-primary mt-1 mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-2 mb-4">
                    {resource.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/30">
                  <span className="inline-flex items-center gap-1 font-semibold text-[10px]">
                    <Download className="w-3 h-3 text-primary/70" /> {resource.downloadCount}
                  </span>
                  <a
                    href={resource.filePathUrl || resource.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:text-primary-light font-medium transition-colors cursor-pointer"
                  >
                    Access <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 glass rounded-2xl p-8 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-lg mx-auto animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 animate-pulse-glow">
                  <BookOpen className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">No Resources Found</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Check back later for tutorials, tools, documents, and helpful links approved by the club.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
