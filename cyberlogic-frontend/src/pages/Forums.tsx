import { useState, useEffect, useRef } from "react";
import { Search, Plus, MessageSquare } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router";
import {
  fetchForumCategories,
  fetchForumThreads
} from "../utils/api";
import type {
  ForumCategoryMapped,
  ForumThreadMapped
} from "../utils/api";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";
import { ForumThreadCard } from "../components/ui";
import { useDragScroll } from "../utils/scroll";

export default function Forums() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get("category") || "all";
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ForumCategoryMapped[]>([]);
  const [threads, setThreads] = useState<ForumThreadMapped[]>([]);
  const categoriesScrollRef = useDragScroll();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Sync state if URL param changes
  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        const catsData = await fetchForumCategories();
        setCategories(catsData);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCats();
  }, []);

  // Load threads
  const loadData = async (initial = true) => {
    try {
      if (initial) {
        setIsLoading(true);
        const res = await fetchForumThreads({ category: categoryParam, q: searchQuery, page: 1, limit: 10 });
        if (res && res.data) {
          setThreads(res.data);
          setHasMore(res.has_more);
          setPage(1);
        } else {
          setThreads(res || []);
          setHasMore(false);
        }
      } else {
        setIsFetchingMore(true);
        const nextPage = page + 1;
        const res = await fetchForumThreads({ category: categoryParam, q: searchQuery, page: nextPage, limit: 10 });
        if (res && res.data) {
          setThreads((prev) => [...prev, ...res.data]);
          setHasMore(res.has_more);
          setPage(nextPage);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [categoryParam, searchQuery]);

  // Observer effect
  useEffect(() => {
    if (!hasMore || isLoading || isFetchingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadData(false);
      }
    }, { threshold: 0.1 });
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [hasMore, isLoading, isFetchingMore, page, categoryParam, searchQuery]);

  // Get total thread count across all categories
  const totalThreadCount = categories.reduce((sum, c) => sum + c.threadCount, 0);

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
          onClick={() => navigate("/app/forums/create")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5 cursor-pointer"
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
        <div ref={categoriesScrollRef} className="flex flex-row overflow-x-auto gap-2 pb-1.5 sm:pb-0 no-scrollbar scroll-smooth whitespace-nowrap w-full">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchParams({});
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border duration-200 cursor-pointer ${
              activeCategory === "all"
                ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-primary/30 shadow-sm shadow-primary/10 scale-[1.02]"
                : "bg-surface-900/40 text-text-muted border-border hover:bg-surface-800 hover:text-text-primary hover:border-primary/20"
            }`}
          >
            All ({totalThreadCount})
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchParams({ category: cat.id });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-primary/30 shadow-sm shadow-primary/10 scale-[1.02]"
                  : "bg-surface-900/40 text-text-muted border-border hover:bg-surface-800 hover:text-text-primary hover:border-primary/20"
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
          <>
            {threads.map((thread) => (
              <ForumThreadCard 
                key={thread.id} 
                thread={thread} 
                showCategory={activeCategory === "all"} 
              />
            ))}
            {hasMore && (
              <div ref={observerRef} className="flex justify-center py-4">
                <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {!isLoading && threads.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-12 max-w-md mx-auto animate-fadeIn space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5 animate-pulse-glow">
            <MessageSquare className="w-8 h-8 animate-pulse text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
              {searchQuery ? "No matching threads" : "Quiet in this category"}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {searchQuery 
                ? `We couldn't find any threads matching "${searchQuery}". Try searching with different keywords.`
                : "No discussions have been started here yet. Be the pioneer and launch the first topic!"
              }
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-surface-800 border border-border text-xs font-semibold text-text-primary hover:bg-surface-700 hover:border-primary/30 transition-all cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/app/forums/create")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Start a Conversation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
