import { Search, Filter } from "lucide-react";

const roleFilters = [
  "All",
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Tech Lead",
  "Events Coordinator",
  "Member",
  "Alumni",
] as const;

interface DirectoryFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
}

export function DirectoryFilters({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
}: DirectoryFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6 animate-fadeIn">
      {/* Search Bar */}
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-1 bg-surface-900/35 border border-border/60 rounded-xl p-1 overflow-x-auto max-w-full no-scrollbar">
        <Filter className="w-4 h-4 text-text-muted mx-2 flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          {roleFilters.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border duration-200 cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-primary/20 shadow-sm"
                  : "text-text-muted hover:text-text-primary border-transparent hover:bg-surface-800"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
