import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, AlertCircle } from "lucide-react";
import { globalSearch, type SearchResults as SearchResultsType } from "../utils/api";
import SearchResultCard from "../components/search/SearchResultCard";

const tabs = [
  { id: "all", label: "All Content" },
  { id: "announcements", label: "Announcements" },
  { id: "forums", label: "Forums" },
  { id: "profiles", label: "Members" },
  { id: "blogs", label: "Blogs" },
  { id: "events", label: "Events" },
  { id: "resources", label: "Resources" },
] as const;

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "all";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultsType>({
    announcements: [],
    forums: [],
    profiles: [],
    blogs: [],
    events: [],
    resources: [],
  });

  useEffect(() => {
    if (!q.trim()) {
      setResults({
        announcements: [],
        forums: [],
        profiles: [],
        blogs: [],
        events: [],
        resources: [],
      });
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await globalSearch(q, "all");
        setResults(data);
      } catch (err: any) {
        console.error(err);
        setError("An error occurred while loading search results.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [q]);

  const handleTabChange = (tabId: typeof tabs[number]["id"]) => {
    setSearchParams({ q, type: tabId });
  };

  const getResultsCount = (tabId: typeof tabs[number]["id"]) => {
    if (tabId === "all") {
      return (
        results.announcements.length +
        results.forums.length +
        results.profiles.length +
        results.blogs.length +
        results.events.length +
        results.resources.length
      );
    }
    return results[tabId as keyof SearchResultsType]?.length || 0;
  };

  const hasAnyResults = getResultsCount("all") > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
          Search Results
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Showing results for "{q}"
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 glass rounded-2xl border border-border p-4 space-y-1 bg-surface-900/40">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 mb-3">
            Filter by Category
          </h3>
          {tabs.map((tab) => {
            const count = getResultsCount(tab.id);
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-transparent text-text-muted border-transparent hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  isActive ? "bg-primary/20 text-primary" : "bg-surface-800 text-text-muted"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex gap-4 p-4 bg-surface-800/40 border border-border/50 rounded-2xl animate-pulse">
                  <div className="w-12 h-12 bg-surface-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-surface-800 rounded w-1/4" />
                    <div className="h-5 bg-surface-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass rounded-2xl border border-border p-8 flex flex-col items-center justify-center text-center text-error gap-3">
              <AlertCircle className="w-10 h-10" />
              <h3 className="font-semibold text-lg">Failed to load results</h3>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          ) : !hasAnyResults ? (
            <div className="glass rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center text-text-muted gap-4">
              <Search className="w-12 h-12 text-text-muted/40 animate-pulse" />
              <div>
                <h3 className="font-bold text-lg text-text-primary">No results found</h3>
                <p className="text-sm text-text-muted mt-1">
                  We couldn't find anything matching "{q}" in this category.
                </p>
              </div>
              <button
                onClick={() => setSearchParams({ q: "", type: "all" })}
                className="px-4 py-2 bg-white/5 border border-border hover:bg-white/10 text-sm font-semibold rounded-xl text-text-primary transition-all"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* announcements */}
              {(typeFilter === "all" || typeFilter === "announcements") && results.announcements.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-primary border-b border-border/60 pb-2 mb-2 px-1">
                    Announcements ({results.announcements.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {results.announcements.map((a) => (
                      <SearchResultCard key={a.id} type="announcement" data={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* forums */}
              {(typeFilter === "all" || typeFilter === "forums") && results.forums.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-accent border-b border-border/60 pb-2 mb-2 px-1">
                    Forums ({results.forums.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {results.forums.map((f) => (
                      <SearchResultCard key={f.id} type="forum" data={f} />
                    ))}
                  </div>
                </div>
              )}

              {/* profiles */}
              {(typeFilter === "all" || typeFilter === "profiles") && results.profiles.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-info border-b border-border/60 pb-2 mb-2 px-1">
                    Members ({results.profiles.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {results.profiles.map((p) => (
                      <SearchResultCard key={p.id} type="profile" data={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* blogs */}
              {(typeFilter === "all" || typeFilter === "blogs") && results.blogs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-success border-b border-border/60 pb-2 mb-2 px-1">
                    Blogs ({results.blogs.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {results.blogs.map((b) => (
                      <SearchResultCard key={b.id} type="blog" data={b} />
                    ))}
                  </div>
                </div>
              )}

              {/* events */}
              {(typeFilter === "all" || typeFilter === "events") && results.events.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-warning border-b border-border/60 pb-2 mb-2 px-1">
                    Events ({results.events.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {results.events.map((e) => (
                      <SearchResultCard key={e.id} type="event" data={e} />
                    ))}
                  </div>
                </div>
              )}

              {/* resources */}
              {(typeFilter === "all" || typeFilter === "resources") && results.resources.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-primary-light border-b border-border/60 pb-2 mb-2 px-1">
                    Resources ({results.resources.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {results.resources.map((r) => (
                      <SearchResultCard key={r.id} type="resource" data={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* Category specific empty state */}
              {typeFilter !== "all" && results[typeFilter as keyof SearchResultsType].length === 0 && (
                <div className="glass rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center text-text-muted gap-4">
                  <Search className="w-12 h-12 text-text-muted/40 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">No results in this category</h3>
                    <p className="text-sm text-text-muted mt-1">
                      No results match "{q}" in {tabs.find((t) => t.id === typeFilter)?.label || typeFilter}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
