import { useState, useEffect, useRef } from "react";
import { Search, X, Check, Clock } from "lucide-react";
import type { CyberboardCard } from "../../utils/api";

interface SearchableTaskPickerProps {
  value?: number | number[] | null;
  onChange: (val: any) => void;
  cards: CyberboardCard[];
  excludeCardId?: number;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  isMulti?: boolean;
  dropUp?: boolean;
}

export default function SearchableTaskPicker({
  value,
  onChange,
  cards = [],
  excludeCardId,
  placeholder = "Search by title or phase...",
  emptyLabel = "No Predecessors Selected",
  disabled = false,
  isMulti = false,
  dropUp = false,
}: SearchableTaskPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedIds: number[] = Array.isArray(value)
    ? value
    : typeof value === "number"
    ? [value]
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available candidate cards
  const candidateCards = cards.filter((c) => {
    if (excludeCardId && c.id === excludeCardId) return false;
    if (c.is_archived) return false;
    return true;
  });

  const filteredCards = candidateCards.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = (c.title || "").toLowerCase().includes(q);
    const phaseMatch = (c.phase || "").toLowerCase().includes(q);
    return titleMatch || phaseMatch;
  });

  const selectedCards = candidateCards.filter((c) => selectedIds.includes(c.id));

  const handleToggleCard = (cardId: number) => {
    if (isMulti) {
      if (selectedIds.includes(cardId)) {
        const next = selectedIds.filter((id) => id !== cardId);
        onChange(next);
      } else {
        const next = [...selectedIds, cardId];
        onChange(next);
      }
    } else {
      onChange(cardId);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    if (isMulti) {
      onChange([]);
    } else {
      onChange(null);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Selector Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary flex items-center justify-between gap-2 hover:bg-surface-750 focus:border-primary focus:outline-none transition-all cursor-pointer disabled:opacity-50"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none py-0.5">
          <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {selectedCards.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {selectedCards.map((sc) => (
                <span
                  key={`sel-pred-${sc.id}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-700 border border-border/60 text-xs font-semibold text-text-primary flex-shrink-0"
                >
                  <span className="truncate max-w-[120px]">{sc.title}</span>
                  {isMulti && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCard(sc.id);
                      }}
                      className="text-text-muted hover:text-error rounded transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-text-muted italic">{emptyLabel}</span>
          )}
        </div>

        {selectedCards.length > 0 ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-text-muted hover:text-error rounded-md transition-colors flex-shrink-0 cursor-pointer"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">▼</span>
        )}
      </button>

      {/* Searchable Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 bg-surface-900 border border-border rounded-2xl shadow-2xl overflow-hidden py-2 max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-1"
          }`}
        >
          {/* Search Input Bar */}
          <div className="px-3 pb-2 border-b border-border/50 flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-800 border border-border/60 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Options Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/20 py-1 scrollbar-thin">
            {/* Option to clear / No selection */}
            <button
              type="button"
              onClick={() => {
                handleClear();
                if (!isMulti) setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                selectedIds.length === 0 ? "bg-primary/20 text-primary font-bold" : "hover:bg-surface-800 text-text-muted"
              }`}
            >
              <span>{emptyLabel}</span>
              {selectedIds.length === 0 && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>

            {filteredCards.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted italic">
                No matching tasks found
              </div>
            ) : (
              filteredCards.map((cardItem) => {
                const isSelected = selectedIds.includes(cardItem.id);
                return (
                  <button
                    key={`picker-card-${cardItem.id}`}
                    type="button"
                    onClick={() => handleToggleCard(cardItem.id)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 text-primary font-bold"
                        : "hover:bg-surface-800 text-text-primary"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-xs truncate font-medium">{cardItem.title}</div>
                      {cardItem.phase && (
                        <span className="inline-block text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">
                          ⚡ {cardItem.phase}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
