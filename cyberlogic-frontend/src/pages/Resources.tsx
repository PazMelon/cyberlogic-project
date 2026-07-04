import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ChevronRight,
  Search,
  Download,
  BookOpen,
  Shield,
  FileText,
  ExternalLink,
  Terminal,
  Activity,
  Code,
} from "lucide-react";
import { resources } from "../data/mockData";

const categories = ["All", "Tutorials", "Documents", "Tools", "Links"] as const;

const iconMap: Record<string, React.ReactNode> = {
  code: <Code className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  "file-text": <FileText className="w-5 h-5" />,
  "external-link": <ExternalLink className="w-5 h-5" />,
  terminal: <Terminal className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
};

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const filtered = resources.filter((r) => {
    const matchesCategory =
      activeCategory === "All" || r.category === activeCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryColors: Record<string, string> = {
    Tutorials: "bg-primary/10 text-primary",
    Documents: "bg-info/10 text-info",
    Tools: "bg-accent/10 text-accent",
    Links: "bg-success/10 text-success",
  };

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
              <span className="text-text-secondary">Resources</span>
            </div>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Resources
          </h1>
          <p className="text-text-muted mt-2">
            Tutorials, documents, tools, and links curated by the Cyberlogic community.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                  activeCategory === cat
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface-800 text-text-muted border-border hover:border-primary/20 hover:text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resource) => (
            <div
              key={resource.id}
              className="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  {iconMap[resource.icon] || <BookOpen className="w-5 h-5" />}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    categoryColors[resource.category] || "bg-surface-700 text-text-secondary"
                  }`}
                >
                  {resource.category}
                </span>
              </div>

              <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                {resource.title}
              </h3>
              <p className="text-sm text-text-muted line-clamp-2 mb-5">
                {resource.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <Download className="w-3.5 h-3.5" /> {resource.downloadCount} downloads
                </span>
                <a
                  href={resource.link}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-light font-medium transition-colors"
                >
                  Access <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No resources found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
