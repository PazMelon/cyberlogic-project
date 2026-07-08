import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, Loader2, X, AlertCircle } from "lucide-react";
import { globalSearch, type SearchResults } from "../../utils/api";
import SearchResultCard from "./SearchResultCard";
import "./GlobalSearch.css";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    announcements: [],
    forums: [],
    profiles: [],
    blogs: [],
    events: [],
    resources: [],
  });
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
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

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const searchResults = await globalSearch(debouncedQuery, "all");
        setResults(searchResults);
      } catch (err: any) {
        console.error(err);
        setError("Error fetching search results.");
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults({
      announcements: [],
      forums: [],
      profiles: [],
      blogs: [],
      events: [],
      resources: [],
    });
    setIsOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/app/search?q=${encodeURIComponent(query)}&type=all`);
    }
  };

  // Compile a flat list of results from all categories
  const allResultsList = [
    ...results.announcements.map((a) => ({ type: "announcement" as const, id: `ann-${a.id}`, data: a })),
    ...results.forums.map((f) => ({ type: "forum" as const, id: `for-${f.id}`, data: f })),
    ...results.profiles.map((p) => ({ type: "profile" as const, id: `prof-${p.id}`, data: p })),
    ...results.blogs.map((b) => ({ type: "blog" as const, id: `blog-${b.id}`, data: b })),
    ...results.events.map((e) => ({ type: "event" as const, id: `evt-${e.id}`, data: e })),
    ...results.resources.map((r) => ({ type: "resource" as const, id: `res-${r.id}`, data: r })),
  ];

  // Limit search dropdown overlay results to top 10 only
  const top10Results = allResultsList.slice(0, 10);
  const totalCount = allResultsList.length;
  const hasAnyResults = totalCount > 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md w-full z-50">
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Announcements, Forums, Profiles, Blogs, Events, Resources..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Results Dropdown Overlay */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 bg-surface-900 border border-border rounded-2xl shadow-2xl glass-effect-panel max-h-[420px] overflow-hidden flex flex-col z-50 animate-slide-down">
          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col gap-2 py-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 bg-surface-800 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3.5 bg-surface-800 rounded w-1/4" />
                      <div className="h-4 bg-surface-800 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-error gap-2">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : !hasAnyResults ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted gap-2">
                <Search className="w-8 h-8 text-text-muted/50" />
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-1">
                {top10Results.map((item) => (
                  <SearchResultCard
                    key={item.id}
                    type={item.type}
                    data={item.data}
                    onClick={clearSearch}
                  />
                ))}
              </div>
            )}
          </div>

          {/* View All results footer */}
          {!isLoading && hasAnyResults && (
            <div className="border-t border-border p-3 bg-surface-950/50 flex justify-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/app/search?q=${encodeURIComponent(query)}&type=all`);
                }}
                className="text-xs font-semibold text-primary hover:text-primary-light hover:underline transition-colors"
              >
                View all {totalCount} results for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
