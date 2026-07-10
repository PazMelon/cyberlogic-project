import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight, Pin, Search, Filter } from "lucide-react";
import { fetchAnnouncements } from "../utils/api";
import type { Announcement } from "../data/mockData";
import { useDragScroll } from "../utils/scroll";
import { useSEO } from "../utils/useSEO";

const categories = ["All", "General", "Academic", "Events"] as const;

export default function Announcements() {
  useSEO({
    title: "Club Announcements",
    description: "Stay informed with the latest news, announcements, recruitment drives, and alerts from the Cyberlogic Club.",
    keywords: ["announcements", "club news", "recruitment", "updates", "cyberlogic notifications"],
  });

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");
  const categoriesScrollRef = useDragScroll();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAnnouncements();
        setItems(data);
      } catch (err) {
        console.error("Failed to load announcements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = items.filter((a) => {
    const matchesCategory =
      activeCategory === "All" || a.category === activeCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
              <span className="text-text-secondary">Announcements</span>
            </div>
          )}
          <h1 className={`${isPortal ? "text-2xl" : "text-3xl lg:text-4xl"} font-bold font-[family-name:var(--font-heading)] text-text-primary`}>
            Announcements
          </h1>
          <p className={`${isPortal ? "text-sm mt-1" : "mt-2"} text-text-muted`}>
            Stay informed with the latest news and updates from Cyberlogic Club.
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
              placeholder="Search announcements..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div ref={categoriesScrollRef} className="flex items-center gap-1 bg-surface-900/35 border border-border/60 rounded-xl p-1 overflow-x-auto max-w-full no-scrollbar">
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

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-xs text-text-muted">Loading announcements from secure database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/80 rounded-2xl">
            <p className="text-sm text-text-secondary italic">No announcements found matching the criteria.</p>
          </div>
        ) : (
          /* Announcements List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {filtered.map((item) => (
              <Link
                key={item.id}
                to={isPortal ? `/app/announcements/${item.id}` : `/announcements/${item.id}`}
                className="block group"
              >
                <article
                  className="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.category === "General"
                            ? "bg-info/10 text-info border border-info/20"
                            : item.category === "Academic"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-accent/10 text-accent border border-accent/20"
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs text-warning font-semibold">
                          <Pin className="w-3.5 h-3.5 fill-warning" /> Pinned
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-sm text-text-muted mt-2 line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border/60">
                    <img
                      src={item.authorAvatar}
                      alt={item.author}
                      className="w-8 h-8 rounded-full bg-surface-700 border border-border"
                    />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {item.author}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {item.date}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
