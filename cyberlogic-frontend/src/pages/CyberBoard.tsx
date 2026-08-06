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
  Pin,
} from "lucide-react";
import {
  fetchCyberboardBoards,
  createCyberboardBoard,
  deleteCyberboardBoard,
  togglePinCyberboardBoard,
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
  const [activeTab, setActiveTab] = useState<"all" | "my" | "shared">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesScrollRef = useDragScroll();

  const categories = [
    "All",
    "Club Related",
    "System",
    "Projects & Tech",
    "Events & Socials",
    "Others",
  ] as const;

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

  const handleCreateBoard = async (data: Partial<CyberboardBoard> & { title: string }) => {
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

  const handleTogglePinBoard = async (boardId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await togglePinCyberboardBoard(boardId);
      setBoards((prev) =>
        prev
          .map((b) => (b.id === boardId ? { ...b, is_pinned: res.is_pinned } : b))
          .sort((a, b) => Number(b.is_pinned || false) - Number(a.is_pinned || false))
      );
      showToast(res.message);
    } catch (err: any) {
      showToast(err.message || "Failed to toggle pin.");
    }
  };

  const getBoardTypeBadge = (type?: string) => {
    switch (type) {
      case "ideas":
        return { label: "💡 Idea Box", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "brainstorming":
        return { label: "🧠 Brainstorming", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "roadmap":
        return { label: "🚀 Roadmap", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "activity":
      default:
        return { label: "📅 Activity Board", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "system":
        return { label: "🛡️ System", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
      case "projects_tech":
        return { label: "💻 Projects & Tech", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "events_social":
        return { label: "🚀 Events & Socials", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "others":
        return { label: "💡 Others", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "club_related":
      default:
        return { label: "🎓 Club Related", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    }
  };

  const filteredBoards = boards.filter((board) => {
    const matchesTab = (() => {
      if (activeTab === "all") {
        return board.visibility !== "private";
      }
      if (activeTab === "my") {
        return user ? board.created_by === user.id : false;
      }
      if (activeTab === "shared") {
        if (!user) return false;
        const isPrivate = board.visibility === "private";
        const isOwner = board.created_by === user.id;
        const allowedMembers = board.allowed_members || [];
        const isAllowedMember = allowedMembers.includes(user.id);
        return isPrivate && !isOwner && isAllowedMember;
      }
      return true;
    })();

    const matchesSearch =
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "System" && board.category === "system") ||
      (activeCategory === "Club Related" && (board.category === "club_related" || !board.category)) ||
      (activeCategory === "Projects & Tech" && board.category === "projects_tech") ||
      (activeCategory === "Events & Socials" && board.category === "events_social") ||
      (activeCategory === "Others" && board.category === "others");

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
            Collaborative project boards, activity planners, and idea submission spaces for Cyberlogic members.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Board
        </button>
      </div>

      {/* Navigation Tabs (All Boards, My Boards, Shared With Me) */}
      <div className="flex border-b border-border/50 mb-6 p-0.5 bg-surface-950/40 rounded-xl max-w-xs sm:max-w-md">
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
        <button
          type="button"
          onClick={() => setActiveTab("shared")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "shared"
              ? "bg-primary/20 text-primary border border-primary/20 shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          Shared With Me
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
            placeholder="Search boards..."
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
              No boards found
            </h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {activeTab === "my"
                ? "You haven't created any boards yet."
                : "No matching boards found. Try adjusting your search query."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-xs transition-all hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Board</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => {
            const canDelete = board.created_by === user?.id || isAdmin;
            const typeBadge = getBoardTypeBadge(board.type);
            const catBadge = getCategoryBadge(board.category);

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
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        <Kanban className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h2 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                          {board.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1">
                          {board.is_pinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                              <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                            </span>
                          )}
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.bg}`}>
                            {catBadge.label}
                          </span>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge.bg}`}>
                            {typeBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePinBoard(board.id, e)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            board.is_pinned
                              ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 opacity-100"
                              : "text-text-muted hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100"
                          }`}
                          title={board.is_pinned ? "Unpin Board" : "Pin Board to Top"}
                        >
                          <Pin className={`w-4 h-4 ${board.is_pinned ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                      )}

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
