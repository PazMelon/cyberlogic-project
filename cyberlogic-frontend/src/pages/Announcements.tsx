import { Link, useLocation } from "react-router";
import {
  ChevronRight,
  Pin,
  Search,
  Filter,
} from "lucide-react";
import { announcements } from "../data/mockData";
import { useState } from "react";

const categories = ["All", "General", "Academic", "Events"] as const;

export default function Announcements() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const filtered = announcements.filter((a) => {
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
          <h1 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Announcements
          </h1>
          <p className="text-text-muted mt-2">
            Stay informed with the latest news and updates from Cyberlogic Club.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            <Filter className="w-4 h-4 text-text-muted mx-2" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary/15 text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          : item.category === "Events"
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "bg-success/10 text-success border border-success/20"
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-warning">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-muted mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                  <img
                    src={item.authorAvatar}
                    alt={item.author}
                    className="w-7 h-7 rounded-full bg-surface-700 object-cover"
                  />
                  <span className="text-xs font-medium text-text-secondary flex-1">
                    {item.author}
                  </span>
                  <time className="text-xs text-text-muted">{item.date}</time>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">
              No announcements found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
