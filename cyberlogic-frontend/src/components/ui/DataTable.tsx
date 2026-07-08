import React, { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, Filter } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: keyof T; // fallback sort key if accessor is a render function
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  label: string;
  field: string; // The property key of the data object to filter on
  options: FilterOption[];
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  filterGroups?: FilterGroup[]; // Dynamic filter pills at the top
  searchPlaceholder?: string;
  searchField?: keyof T | ((row: T) => string); // field to search in
  emptyStateText?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filterGroups = [],
  searchPlaceholder = "Search records...",
  searchField,
  emptyStateText = "No records found.",
  className = ""
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track active filter value for each group field
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filterGroups.forEach(g => {
      initial[g.field] = "All";
    });
    return initial;
  });

  // Track sorting parameters
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable) return;
    
    // Determine sort key
    const key = column.sortKey || (typeof column.accessor === "string" ? (column.accessor as keyof T) : null);
    if (!key) return;

    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter and Search dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Process search matching
      if (searchQuery.trim() !== "") {
        let matchStr = "";
        if (typeof searchField === "function") {
          matchStr = searchField(row);
        } else if (searchField && row[searchField] !== undefined) {
          matchStr = String(row[searchField]);
        } else {
          // Fallback: search all primitive string fields
          matchStr = Object.values(row)
            .filter((v) => typeof v === "string" || typeof v === "number")
            .join(" ");
        }
        if (!matchStr.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // 2. Process dynamic filter pills matching
      for (const group of filterGroups) {
        const activeVal = activeFilters[group.field];
        if (activeVal && activeVal !== "All") {
          const rowVal = String(row[group.field] || "").toLowerCase();
          if (rowVal !== activeVal.toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchQuery, searchField, filterGroups, activeFilters]);

  // Sort filtered dataset
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // Handle simple string/number comparisons
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Top Filter and Search Controls Row */}
      <div className="flex flex-col gap-4">
        
        {/* Search Input Box */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Dynamic Filter Pill Groups */}
        {filterGroups.length > 0 && (
          <div className="space-y-2 bg-surface-900/20 p-2 border border-border/40 rounded-2xl">
            {filterGroups.map((group) => {
              const currentValue = activeFilters[group.field] || "All";
              return (
                <div key={group.field} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-surface-900/40 p-2.5 rounded-xl border border-border/50">
                  <span className="font-semibold text-text-secondary w-20 flex items-center gap-1 text-[10px] uppercase tracking-wider select-none flex-shrink-0">
                    <Filter className="w-3.5 h-3.5 text-primary" /> {group.label}:
                  </span>
                  <div className="flex flex-row overflow-x-auto gap-1.5 pb-1 sm:pb-0 no-scrollbar scroll-smooth whitespace-nowrap w-full">
                    <button
                      type="button"
                      onClick={() => handleFilterChange(group.field, "All")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                        currentValue === "All"
                          ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                          : "bg-surface-800 text-text-muted border-border hover:bg-surface-700 hover:text-text-primary"
                      }`}
                    >
                      All
                    </button>
                    {group.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleFilterChange(group.field, opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                          currentValue === opt.value
                            ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                            : "bg-surface-800 text-text-muted border-border hover:bg-surface-700 hover:text-text-primary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Table Layout */}
      <div className="glass rounded-xl overflow-hidden shadow-lg border border-border/80">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-950/30">
                {columns.map((col, idx) => {
                  const isSortable = !!col.sortable;
                  const colKey = col.sortKey || (typeof col.accessor === "string" ? col.accessor : null);
                  const isSortedColumn = colKey && sortKey === colKey;

                  return (
                    <th
                      key={idx}
                      onClick={() => handleSort(col)}
                      className={`px-5 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider select-none ${
                        isSortable ? "cursor-pointer hover:text-text-primary transition-colors" : ""
                      } ${col.className || ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {isSortable && colKey && (
                          <div className="flex flex-col text-text-muted/40">
                            <ChevronUp
                              size={10}
                              className={isSortedColumn && sortDirection === "asc" ? "text-primary" : "-mb-0.5"}
                            />
                            <ChevronDown
                              size={10}
                              className={isSortedColumn && sortDirection === "desc" ? "text-primary" : "-mt-0.5"}
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-xs text-text-muted italic bg-surface-900/10">
                    {emptyStateText}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIdx) => (
                  <tr key={row.id || rowIdx} className="hover:bg-white/[0.02] transition-colors">
                    {columns.map((col, colIdx) => {
                      let cellContent: React.ReactNode;
                      if (typeof col.accessor === "function") {
                        cellContent = col.accessor(row);
                      } else {
                        cellContent = String(row[col.accessor] !== undefined ? row[col.accessor] : "");
                      }

                      return (
                        <td key={colIdx} className={`px-5 py-3.5 ${col.className || ""}`}>
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
