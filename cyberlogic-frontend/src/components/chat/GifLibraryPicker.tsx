import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Plus, Search, Loader2, Sparkles, Folder, Check } from "lucide-react";
import { apiRequest } from "../../context/AuthContext";

interface SavedGif {
  id: number;
  title: string;
  url: string;
  category: string | null;
}

interface GifLibraryPickerProps {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

export default function GifLibraryPicker({ onSelectGif, onClose }: GifLibraryPickerProps) {
  const [gifs, setGifs] = useState<SavedGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form states to add new GIF
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Reaction");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGifs();
  }, []);

  async function fetchGifs() {
    try {
      setLoading(true);
      const res = await apiRequest("/api/chat/gifs");
      if (res.ok) {
        const data = await res.json();
        setGifs(data);
      }
    } catch (err) {
      console.error("Failed to load GIF library:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleAddGif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const res = await apiRequest("/api/chat/gifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          url: newUrl,
          category: newCategory,
        }),
      });

      if (res.ok) {
        const newGif = await res.json();
        setGifs((prev) => [newGif, ...prev]);
        setNewTitle("");
        setNewUrl("");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowAddForm(false);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add GIF to library.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const filteredGifs = gifs.filter((gif) => {
    return (
      gif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gif.category && gif.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div
      ref={containerRef}
      className="absolute bottom-20 left-4 w-80 sm:w-96 bg-surface-900 border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-fade-in-up"
      style={{ maxHeight: "450px" }}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-surface-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-text-primary">GIF & Image Library</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
            showAddForm
              ? "bg-surface-800 border-border text-text-secondary hover:bg-surface-700"
              : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
          }`}
        >
          {showAddForm ? "Back to GIFs" : <><Plus className="w-3.5 h-3.5" /> Save New Link</>}
        </button>
      </div>

      {showAddForm ? (
        /* Add GIF Form */
        <form onSubmit={handleAddGif} className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
          <p className="text-xs text-text-muted leading-relaxed">
            Add an external GIF/Image URL to the shared library for quick access later.
          </p>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">
              GIF Title / Keyword
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Happy Dance"
              className="w-full text-xs px-3 py-2 rounded-lg bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">
              Direct GIF/Image URL
            </label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="e.g. https://media.giphy.com/.../giphy.gif"
              className="w-full text-xs px-3 py-2 rounded-lg bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="Reaction">Reaction</option>
              <option value="Funny">Funny</option>
              <option value="Agree">Agree</option>
              <option value="Shocked">Shocked</option>
              <option value="Thanks">Thanks</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {error && <div className="text-xs text-error font-medium">{error}</div>}
          {success && (
            <div className="text-xs text-success font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Added successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 mt-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save to Database"}
          </button>
        </form>
      ) : (
        /* GIFs Grid */
        <>
          {/* Search */}
          <div className="p-2.5 bg-surface-950/60 border-b border-border flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search reaction gifs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-surface-900 border border-border/80 text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-y-auto p-3 min-h-[220px]">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-text-muted">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Loading library...</span>
              </div>
            ) : filteredGifs.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-1.5 text-text-muted text-center p-4">
                <ImageIcon className="w-8 h-8 opacity-45 mb-1" />
                <p className="text-xs font-semibold text-text-secondary">No GIFs found</p>
                <p className="text-[10px] leading-relaxed max-w-[200px]">
                  Try searching another keyword or add a new GIF link above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredGifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => {
                      onSelectGif(gif.url);
                      onClose();
                    }}
                    className="group relative flex flex-col rounded-xl overflow-hidden border border-border bg-surface-950 hover:border-primary/50 transition-all text-left shadow-xs cursor-pointer"
                  >
                    <div className="h-24 w-full bg-surface-900 overflow-hidden relative">
                      <img
                        src={gif.url}
                        alt={gif.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute top-1 left-1 text-[9px] bg-black/70 text-text-secondary px-1 py-0.5 rounded backdrop-blur-xs font-bold">
                        {gif.category || "Reaction"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] font-semibold text-text-primary truncate">{gif.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
