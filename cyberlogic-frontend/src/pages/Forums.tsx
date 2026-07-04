import { useState } from "react";
import { Link } from "react-router";
import {
  MessageSquare,
  Heart,
  Eye,
  Pin,
  CheckCircle,
  Plus,
  Search,
} from "lucide-react";
import { forumCategories, forumThreads } from "../data/mockData";

export default function Forums() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = forumThreads.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.categoryId === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (categoryId: string): string => {
    const cat = forumCategories.find((c) => c.id === categoryId);
    const colorMap: Record<string, string> = {
      primary: "bg-primary/10 text-primary",
      accent: "bg-accent/10 text-accent",
      success: "bg-success/10 text-success",
      error: "bg-error/10 text-error",
      warning: "bg-warning/10 text-warning",
    };
    return colorMap[cat?.color || "primary"] || "bg-surface-700 text-text-secondary";
  };

  const getCategoryName = (categoryId: string): string => {
    return forumCategories.find((c) => c.id === categoryId)?.name || categoryId;
  };

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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`p-3 rounded-xl border text-center text-xs font-medium transition-all ${
            activeCategory === "all"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-surface-800 text-text-muted hover:border-primary/20"
          }`}
        >
          <div className="text-lg font-bold font-[family-name:var(--font-heading)]">
            {forumThreads.length}
          </div>
          All Threads
        </button>
        {forumCategories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`p-3 rounded-xl border text-center text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-surface-800 text-text-muted hover:border-primary/20"
            }`}
          >
            <div className="text-lg font-bold font-[family-name:var(--font-heading)]">
              {cat.threadCount}
            </div>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {filtered.map((thread) => (
          <Link
            key={thread.id}
            to={`/app/forums/thread/${thread.id}`}
            className="block glass rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <img
                src={thread.authorAvatar}
                alt={thread.author}
                className="w-10 h-10 rounded-full bg-surface-700 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {thread.pinned && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning uppercase">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {thread.solved && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success uppercase">
                      <CheckCircle className="w-3 h-3" /> Solved
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(thread.categoryId)}`}>
                    {getCategoryName(thread.categoryId)}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
                  {thread.title}
                </h3>
                <p className="text-sm text-text-muted line-clamp-1 mb-2">
                  {thread.content}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                  <span className="font-medium text-text-secondary">{thread.author}</span>
                  <span>{thread.lastActivity}</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {thread.replyCount} replies
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {thread.likes}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {thread.views} views
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No threads found.</p>
        </div>
      )}
    </div>
  );
}
