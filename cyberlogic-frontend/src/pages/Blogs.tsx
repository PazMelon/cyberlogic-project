import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight, Search, Filter } from "lucide-react";
import { fetchBlogs } from "../utils/api";
import { BlogCard } from "../components/ui";
import { SkeletonCard } from "../components/Skeleton";
import type { BlogPost } from "../data/mockData";

export default function Blogs() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const categories = ["All", "Tech", "Tutorial", "News", "Lifestyle", "General", "Academic"] as const;

  useEffect(() => {
    async function loadBlogs() {
      try {
        const data = await fetchBlogs();
        setBlogs(data);
      } catch (err) {
        console.error("Failed to load blogs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      activeCategory === "All" || 
      blog.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={isPortal ? "pb-8" : "pt-24 pb-16"}>
      <div className={isPortal ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {/* Page Header */}
        <div className="mb-10">
          {!isPortal && (
            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-text-secondary">Blog</span>
            </div>
          )}
          <h1 className={`${isPortal ? "text-2xl" : "text-3xl lg:text-4xl"} font-bold font-[family-name:var(--font-heading)] text-text-primary`}>
            Blog Feed
          </h1>
          <p className={`${isPortal ? "text-sm mt-1" : "mt-2"} text-text-muted`}>
            Read coding guides, hardware tips, cyber-security writeups, and academic news published by club officers and members.
          </p>
        </div>

        {/* Search + Categories */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-surface-900/35 border border-border/60 rounded-xl p-1 overflow-x-auto max-w-full no-scrollbar">
            <Filter className="w-4 h-4 text-text-muted mx-2 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border duration-200 cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-primary/20 shadow-sm"
                      : "text-text-muted hover:text-text-primary border-transparent hover:bg-surface-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blogs Display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/80 rounded-2xl">
            <p className="text-sm text-text-secondary italic">No blog posts found matching the criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {filteredBlogs.map((blog, idx) => (
              <BlogCard key={blog.id} blog={blog} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
