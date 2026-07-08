import { Search, ChevronDown } from "lucide-react";

const roleFilters = ["All", "President", "Vice President", "Secretary", "Treasurer", "Tech Lead", "Events Coordinator", "Member", "Alumni"] as const;

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
    <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, department, expertise..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>
      <div className="relative">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all appearance-none pr-10 cursor-pointer"
        >
          {roleFilters.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>
    </div>
  );
}
