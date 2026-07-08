import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  ChevronRight,
  Search,
  BookOpen,
  Shield,
  FileText,
  ExternalLink,
  Terminal,
  Activity,
  Code,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  fetchResources,
  fetchMyResources,
  createResource,
  voteResource,
  type ResourceMapped,
} from "../utils/api";
import SubmitResourceModal from "../components/resources/SubmitResourceModal";
import { Button } from "../components/ui";

const categories = ["All", "Tutorials", "Documents", "Tools", "Links"] as const;

const iconMap: Record<string, React.ReactNode> = {
  code: <Code className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  "file-text": <FileText className="w-5 h-5" />,
  "external-link": <ExternalLink className="w-5 h-5" />,
  terminal: <Terminal className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  Tutorials: "bg-primary/10 text-primary border-primary/20",
  Documents: "bg-info/10 text-info border-info/20",
  Tools: "bg-accent/10 text-accent border-accent/20",
  Links: "bg-success/10 text-success border-success/20",
};

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [resourcesList, setResourcesList] = useState<ResourceMapped[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const loadResources = async () => {
    try {
      setIsLoading(true);
      if (activeTab === "my" && isPortal) {
        const myData = await fetchMyResources();
        setResourcesList(myData);
      } else {
        const data = await fetchResources({
          category: activeCategory,
          q: searchQuery,
        });
        setResourcesList(data);
      }
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [activeCategory, searchQuery, activeTab]);

  const handleVote = async (id: number, value: number) => {
    try {
      const result = await voteResource(id, value);
      setResourcesList((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, voteScore: result.voteScore, userVote: result.userVote }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to vote on resource:", err);
    }
  };

  const handleSubmitResource = async (formData: FormData) => {
    try {
      await createResource(formData);
      loadResources();
    } catch (err) {
      console.error("Failed to create resource:", err);
      throw err;
    }
  };

  const filtered = resourcesList.filter((r) => {
    // Front-end filter categories specifically when on My Submissions tab
    if (activeTab === "my") {
      const matchesCategory =
        activeCategory === "All" || r.category === activeCategory;
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }
    return true; // Main resources already filtered backend-side
  });

  return (
    <div className={isPortal ? "pb-8" : "pt-24 pb-16"}>
      <div className={isPortal ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
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
        </div>

        {/* Navigation Tabs (Member portal only) */}
        {isPortal && (
          <div className="flex border-b border-border/50 mb-6 p-0.5 bg-surface-950/40 rounded-xl max-w-[280px]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setActiveCategory("All");
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-primary/20 text-primary border border-primary/20 shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              All Resources
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("my");
                setActiveCategory("All");
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "my"
                  ? "bg-primary/20 text-primary border border-primary/20 shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              My Submissions
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 w-full lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                    activeCategory === cat
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-surface-800 text-text-muted border-border hover:border-primary/20 hover:text-text-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isPortal && (
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsSubmitModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                className="px-4 py-2.5 text-xs font-semibold"
              >
                Submit Resource
              </Button>
            )}
          </div>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-surface-800" />
                  <div className="w-16 h-5 rounded bg-surface-800" />
                </div>
                <div className="w-3/4 h-5 rounded bg-surface-800" />
                <div className="w-full h-4 rounded bg-surface-800" />
                <div className="w-full h-4 rounded bg-surface-800" />
                <div className="pt-4 border-t border-border flex justify-between">
                  <div className="w-20 h-4 rounded bg-surface-800" />
                  <div className="w-12 h-4 rounded bg-surface-800" />
                </div>
              </div>
            ))
          ) : (
            filtered.map((resource) => (
              <div
                key={resource.id}
                className="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                      {iconMap[resource.icon] || <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          categoryColors[resource.category] || "bg-surface-700 text-text-secondary"
                        }`}
                      >
                        {resource.category}
                      </span>
                      {activeTab === "my" && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            resource.status === "approved"
                              ? "bg-success/10 text-success border-success/20"
                              : resource.status === "rejected"
                              ? "bg-error/10 text-error border-error/20"
                              : "bg-warning/10 text-warning border-warning/20 animate-pulse"
                          }`}
                        >
                          {resource.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                          {resource.status === "rejected" && <XCircle className="w-3 h-3" />}
                          {resource.status === "pending" && <Clock className="w-3 h-3" />}
                          {resource.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-2 mb-4">
                    {resource.description}
                  </p>

                  {/* Submitter info */}
                  {resource.user && (
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={resource.user.avatar}
                        alt={resource.user.name}
                        className="w-5 h-5 rounded-full object-cover border border-border"
                      />
                      <span className="text-xs text-text-muted">
                        Submitted by <span className="text-text-secondary font-medium">{resource.user.name}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    {/* Voting section */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleVote(resource.id, 1)}
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                          resource.userVote === 1 ? "text-primary bg-primary/10" : "text-text-muted hover:text-text-primary"
                        }`}
                        title="Upvote"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-text-primary min-w-[12px] text-center">
                        {resource.voteScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVote(resource.id, -1)}
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                          resource.userVote === -1 ? "text-error bg-error/10" : "text-text-muted hover:text-text-primary"
                        }`}
                        title="Downvote"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <a
                      href={resource.filePathUrl || resource.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-light font-medium transition-colors cursor-pointer"
                    >
                      {resource.filePathUrl ? "Download" : "Access"} <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No resources found matching your search.</p>
          </div>
        )}
      </div>

      {/* Resource Submission Modal */}
      <SubmitResourceModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitResource}
      />
    </div>
  );
}
