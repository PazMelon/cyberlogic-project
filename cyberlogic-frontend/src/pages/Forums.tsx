import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { forumThreads, forumCategories } from "../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";
import { ForumThreadCard } from "../components/ui";

export default function Forums() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync state if URL param changes
  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = forumThreads.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.categoryId === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Forums
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Discuss, share knowledge, and connect with fellow members.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> New Thread
        </button>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchParams({});
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              activeCategory === "all"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-surface-800 text-text-muted hover:border-primary/20"
            }`}
          >
            All ({forumThreads.length})
          </button>
          {forumCategories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchParams({ category: cat.id });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeCategory === cat.id
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-surface-800 text-text-muted hover:border-primary/20"
              }`}
            >
              {cat.name} ({cat.threadCount})
            </button>
          ))}
        </div>
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-xl p-4 sm:p-5 flex items-start gap-4 animate-pulse">
                <SkeletonCircle className="w-10 h-10 bg-surface-800 flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <SkeletonLine widthClass="w-16" heightClass="h-3.5" />
                    <SkeletonLine widthClass="w-20" heightClass="h-3.5" />
                  </div>
                  <SkeletonLine widthClass="w-3/4" heightClass="h-5" />
                  <SkeletonLine widthClass="w-full" heightClass="h-4" />
                  <div className="flex gap-4">
                    <SkeletonLine widthClass="w-24" heightClass="h-3.5" />
                    <SkeletonLine widthClass="w-12" heightClass="h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          filtered.map((thread) => (
            <ForumThreadCard key={thread.id} thread={thread} />
          ))
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No threads found.</p>
        </div>
      )}
    </div>
  );
}
