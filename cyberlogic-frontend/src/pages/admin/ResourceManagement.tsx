import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import { resources } from "../../data/mockData";

export default function ResourceManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    Tutorials: "bg-primary/10 text-primary",
    Documents: "bg-info/10 text-info",
    Tools: "bg-accent/10 text-accent",
    Links: "bg-success/10 text-success",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Resources
          </h1>
          <p className="text-sm text-text-muted mt-1">{resources.length} total resources</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
        />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Resource</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Downloads</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-text-primary">{r.title}</p>
                    <p className="text-xs text-text-muted truncate max-w-sm mt-0.5">{r.description}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[r.category] || "bg-surface-700 text-text-muted"}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Download className="w-3 h-3" /> {r.downloadCount}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-text-muted hover:text-info hover:bg-white/5 transition-colors" title="Open">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
