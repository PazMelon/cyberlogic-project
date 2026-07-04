import { useState } from "react";
import {
  Search,
  Pin,
  CheckCircle,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
} from "lucide-react";
import { forumThreads, forumCategories } from "../../data/mockData";

export default function ForumModeration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = forumThreads.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
          Forum Moderation
        </h1>
        <p className="text-sm text-text-muted mt-1">{forumThreads.length} total threads</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              categoryFilter === "all"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-border bg-surface-800 text-text-muted hover:border-amber-500/20"
            }`}
          >
            All
          </button>
          {forumCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                categoryFilter === cat.id
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-border bg-surface-800 text-text-muted hover:border-amber-500/20"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Thread</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Stats</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((thread) => {
                const category = forumCategories.find((c) => c.id === thread.categoryId);
                return (
                  <tr key={thread.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={thread.authorAvatar} alt={thread.author} className="w-8 h-8 rounded-full bg-surface-700 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate max-w-xs">{thread.title}</p>
                          <p className="text-xs text-text-muted">{thread.author} · {thread.lastActivity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                        {category?.name || thread.categoryId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.replyCount}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {thread.likes}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {thread.views}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        {thread.pinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        {thread.solved && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
                            <CheckCircle className="w-3 h-3" /> Solved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className={`p-1.5 rounded-lg transition-colors ${
                            thread.pinned
                              ? "text-warning hover:text-warning/70 hover:bg-warning/5"
                              : "text-text-muted hover:text-warning hover:bg-warning/5"
                          }`}
                          title={thread.pinned ? "Unpin" : "Pin"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className={`p-1.5 rounded-lg transition-colors ${
                            thread.solved
                              ? "text-success hover:text-success/70 hover:bg-success/5"
                              : "text-text-muted hover:text-success hover:bg-success/5"
                          }`}
                          title={thread.solved ? "Unmark solved" : "Mark solved"}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
