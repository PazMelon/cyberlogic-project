import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Plus,
  ChevronRight,
  Kanban,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  fetchCyberboardBoards,
  createCyberboardBoard,
  deleteCyberboardBoard,
  type CyberboardBoard,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useDragScroll } from "../utils/scroll";
import { useSEO } from "../utils/useSEO";
import CreateBoardModal from "../components/cyberboard/CreateBoardModal";
import ConfirmModal from "../components/cyberboard/ConfirmModal";

import { Toast } from "../components/ui";

export default function CyberBoard() {
  useSEO({
    title: "CyberBoard — Activity Planner",
    description: "Collaborative activity board and idea submission planner for Cyberlogic club members.",
    keywords: ["CyberBoard", "activity planner", "ideas", "Trello", "Kanban", "Cyberlogic Club"],
  });

  const { user, isAdmin } = useAuth();
  const [boards, setBoards] = useState<CyberboardBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesScrollRef = useDragScroll();

  const categories = ["All", "Active", "Archived"] as const;

  const loadBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCyberboardBoards();
      setBoards(data);
    } catch (err: any) {
      console.error("Failed to load boards:", err);
      setError("Unable to load activity boards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "CyberBoard | Cyberlogic";
    loadBoards();
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateBoard = async (data: {
    title: string;
    description?: string;
    cover_color?: string;
  }) => {
    const newBoard = await createCyberboardBoard(data);
    setBoards((prev) => [newBoard, ...prev]);
    showToast("Board created successfully!");
  };

  const handleDeleteBoard = (boardId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setConfirmModal({
      isOpen: true,
      title: "Delete Board?",
      message: "Are you sure you want to delete this board and all its cards? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteCyberboardBoard(boardId);
          setBoards((prev) => prev.filter((b) => b.id !== boardId));
          showToast("Board deleted successfully.");
        } catch (err: any) {
          showToast(err.message || "Failed to delete board.");
        }
      },
    });
  };

  const filteredBoards = boards.filter((board) => {
    const matchesTab =
      activeTab === "all" || (user && board.created_by === user.id);

    const matchesSearch =
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "Active" && !board.is_archived) ||
      (activeCategory === "Archived" && board.is_archived);

    return matchesTab && matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            CyberBoard Feed
          </h1>
          <p className="text-sm mt-1 text-text-muted">
            Collaborative activity planners and suggestion boards submitted by Cyberlogic members and officers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Activity Board
        </button>
      </div>

      {/* Navigation Tabs (All Boards vs My Boards) */}
      <div className="flex border-b border-border/50 mb-6 p-0.5 bg-surface-950/40 rounded-xl max-w-[280px]">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-primary/20 text-primary border border-primary/20 shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          All Boards
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "my"
              ? "bg-primary/20 text-primary border border-primary/20 shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          My Boards
        </button>
      </div>

      {/* Search Bar + Category Pills */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity boards..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div
          ref={categoriesScrollRef}
          className="flex items-center gap-1.5 bg-surface-900/35 border border-border/60 rounded-xl p-1 overflow-x-auto max-w-full no-scrollbar"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-surface-950 shadow-xs font-semibold"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-error/10 border border-error/20 text-sm text-error text-center font-medium">
          {error}
        </div>
      )}

      {/* Boards Grid Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-surface-900/60 border border-border/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface-900/40 border border-dashed border-border/60 rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-800 border border-border flex items-center justify-center mx-auto text-text-muted">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">
              No activity boards found
            </h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {activeTab === "my"
                ? "You haven't created any boards yet."
                : "No matching activity boards found. Try adjusting your search query."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-xs transition-all hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Activity Board</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => {
            const canDelete = board.created_by === user?.id || isAdmin;

            return (
              <Link
                key={board.id}
                to={`/app/cyberboard/${board.id}`}
                className="group relative bg-surface-900 border border-border/60 hover:border-primary/50 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 overflow-hidden"
              >
                {/* Board Accent Color Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
                  style={{ backgroundColor: board.cover_color || "#06b6d4" }}
                />

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        <Kanban className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                        {board.title}
                      </h2>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBoard(board.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all cursor-pointer flex-shrink-0"
                        title="Delete Board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-sans">
                    {board.description || "No description provided for this board."}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                  {/* Board Creator */}
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={
                        board.creator?.avatar ||
                        "https://api.dicebear.com/9.x/avataaars/svg?seed=creator"
                      }
                      alt={board.creator?.name || "User"}
                      className="w-6 h-6 rounded-full border border-border object-cover flex-shrink-0"
                    />
                    <span className="text-text-muted font-medium truncate max-w-[110px]">
                      {board.creator?.name || "Member"}
                    </span>
                  </div>

                  {/* Card count pill & Link arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-800 text-text-secondary text-[11px] font-semibold border border-border/50">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {board.cards_count || 0} cards
                    </span>

                    <div className="w-7 h-7 rounded-xl bg-surface-800 group-hover:bg-primary group-hover:text-surface-950 text-text-muted flex items-center justify-center transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Create Board Modal */}
      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
