import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Link2,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  FolderKanban,
  UploadCloud,
  Sparkles,
  Layers,
  Globe,
  Search,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  fetchCyberboardBoardAssets,
  addCyberboardBoardLinkAsset,
  uploadCyberboardBoardFileAsset,
  deleteCyberboardBoardAsset,
  getAvatarUrl,
  type CyberboardBoardAsset,
} from "../../utils/api";
import { optimizeAndConvertToWebP, dataUrlToFile } from "../../utils/imageOptimizer";
import { useWebSocket } from "../../context/WebSocketContext";
import { BottomSheet } from "../ui/BottomSheet";

interface BoardMediaVaultModalProps {
  boardId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectCard?: (cardId: number) => void;
  onToast?: (msg: string, type: "success" | "error" | "info") => void;
}

type MainVaultTab = "all" | "card_assets" | "general_assets" | "images" | "links" | "files";

export default function BoardMediaVaultModal({
  boardId,
  isOpen,
  onClose,
  onSelectCard,
  onToast,
}: BoardMediaVaultModalProps) {
  const { subscribe } = useWebSocket();
  const [activeTab, setActiveTab] = useState<MainVaultTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cardAssets, setCardAssets] = useState<CyberboardBoardAsset[]>([]);
  const [generalAssets, setGeneralAssets] = useState<CyberboardBoardAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Link / Upload File Form State
  const [showAddForm, setShowAddForm] = useState<"link" | "upload" | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCyberboardBoardAssets(boardId);
      setGeneralAssets(data.general_assets || []);
      setCardAssets(data.card_assets || []);
    } catch (err: any) {
      console.error("Failed to load board vault assets:", err);
      setError(err.message || "Failed to load board media & links.");
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, loadAssets]);

  // Realtime updates via WebSocket
  useEffect(() => {
    if (!isOpen || !boardId) return;
    const unsubscribe = subscribe(`cyberboard:${boardId}`, (_payload: any, type: string) => {
      if (["asset:created", "asset:deleted", "card:created", "card:updated", "card:deleted"].includes(type)) {
        loadAssets();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isOpen, boardId, subscribe, loadAssets]);

  const handleCopyLink = (url: string, id: string | number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    if (onToast) onToast("Link copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDomainFavicon = (urlStr: string) => {
    try {
      const domain = new URL(urlStr).hostname;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    } catch {
      return null;
    }
  };

  const getDomainHost = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return "web link";
    }
  };

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await addCyberboardBoardLinkAsset(boardId, newTitle.trim(), newUrl.trim(), newDescription.trim());
      setGeneralAssets((prev) => [created, ...prev]);
      setShowAddForm(null);
      setNewTitle("");
      setNewUrl("");
      setNewDescription("");
      if (onToast) onToast("Board link added successfully!", "success");
    } catch (err: any) {
      if (onToast) onToast(err.message || "Failed to add link.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // 10MB File Size Validation
    const maxSizeBytes = 10 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      if (onToast) onToast("File size exceeds 10MB limit. Please select a file under 10MB.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let fileToUpload = selectedFile;
      if (selectedFile.type.startsWith("image/") && !selectedFile.type.includes("gif")) {
        try {
          const optRes = await optimizeAndConvertToWebP(selectedFile, 0.82, 1600);
          fileToUpload = dataUrlToFile(optRes.dataUrl, selectedFile.name);
        } catch (optErr) {
          console.warn("Client-side image optimization fallback:", optErr);
        }
      }

      const created = await uploadCyberboardBoardFileAsset(
        boardId,
        fileToUpload,
        newTitle.trim() || undefined,
        newDescription.trim() || undefined
      );
      setGeneralAssets((prev) => [created, ...prev]);
      setShowAddForm(null);
      setNewTitle("");
      setNewDescription("");
      setSelectedFile(null);
      if (onToast) onToast("File uploaded to board vault!", "success");
    } catch (err: any) {
      if (onToast) onToast(err.message || "Failed to upload file.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: number | string) => {
    try {
      await deleteCyberboardBoardAsset(boardId, assetId);
      setGeneralAssets((prev) => prev.filter((a) => a.id !== assetId));
      if (onToast) onToast("Asset deleted from board vault.", "info");
    } catch (err: any) {
      if (onToast) onToast(err.message || "Failed to delete asset.", "error");
    }
  };

  // Combined Raw Assets
  const allCombinedAssets = useMemo(() => {
    return [...generalAssets, ...cardAssets];
  }, [generalAssets, cardAssets]);

  // Asset Count Metrics
  const counts = useMemo(() => {
    const isImg = (a: CyberboardBoardAsset) =>
      a.type === "image" || (a.url && /\.(gif|jpe?g|png|webp|svg)/i.test(a.url));
    const isLnk = (a: CyberboardBoardAsset) => a.type === "link" || a.type === "card_link";

    return {
      all: allCombinedAssets.length,
      card_assets: cardAssets.length,
      general_assets: generalAssets.length,
      images: allCombinedAssets.filter(isImg).length,
      links: allCombinedAssets.filter(isLnk).length,
      files: allCombinedAssets.filter((a) => !isImg(a) && !isLnk(a)).length,
    };
  }, [allCombinedAssets, cardAssets, generalAssets]);

  // Tab Filtering
  const tabFilteredAssets = useMemo(() => {
    const isImg = (a: CyberboardBoardAsset) =>
      a.type === "image" || (a.url && /\.(gif|jpe?g|png|webp|svg)/i.test(a.url));
    const isLnk = (a: CyberboardBoardAsset) => a.type === "link" || a.type === "card_link";

    switch (activeTab) {
      case "card_assets":
        return cardAssets;
      case "general_assets":
        return generalAssets;
      case "images":
        return allCombinedAssets.filter(isImg);
      case "links":
        return allCombinedAssets.filter(isLnk);
      case "files":
        return allCombinedAssets.filter((a) => !isImg(a) && !isLnk(a));
      case "all":
      default:
        return allCombinedAssets;
    }
  }, [activeTab, allCombinedAssets, cardAssets, generalAssets]);

  // Live Search Filtering
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return tabFilteredAssets;
    const q = searchQuery.toLowerCase();
    return tabFilteredAssets.filter(
      (asset) =>
        asset.title.toLowerCase().includes(q) ||
        (asset.description && asset.description.toLowerCase().includes(q)) ||
        (asset.card_title && asset.card_title.toLowerCase().includes(q)) ||
        (asset.url && asset.url.toLowerCase().includes(q))
    );
  }, [tabFilteredAssets, searchQuery]);

  if (!isOpen) return null;

  const navItems = [
    {
      id: "all",
      label: "All Vault Assets",
      subtitle: "Combined cards & general board resources",
      icon: Layers,
      count: counts.all,
    },
    {
      id: "card_assets",
      label: "Card Task Resources",
      subtitle: "Harvested from tasks & comments",
      icon: Link2,
      count: counts.card_assets,
    },
    {
      id: "general_assets",
      label: "General Board Vault",
      subtitle: "Uploaded directly to board",
      icon: UploadCloud,
      count: counts.general_assets,
    },
    {
      id: "images",
      label: "Images & Visuals",
      subtitle: "Gallery grid view",
      icon: ImageIcon,
      count: counts.images,
    },
    {
      id: "links",
      label: "Web Bookmarks",
      subtitle: "Domain favicon cards",
      icon: Globe,
      count: counts.links,
    },
    {
      id: "files",
      label: "Files & Documents",
      subtitle: "PDFs, docs & attachments",
      icon: FileText,
      count: counts.files,
    },
  ] as const;

  const getTabHeaderTitle = () => {
    switch (activeTab) {
      case "card_assets":
        return { title: "Card Task Resources", desc: "All links & attachments harvested from task cards" };
      case "general_assets":
        return { title: "General Board Vault", desc: "Task-unrelated links & files uploaded to board" };
      case "images":
        return { title: "Images & Visual Media", desc: "Visual gallery grid of board pictures & diagrams" };
      case "links":
        return { title: "Web Bookmarks & Links", desc: "Web link vault with domain favicons" };
      case "files":
        return { title: "Files & Documents", desc: "Documents, spreadsheets & attachments" };
      case "all":
      default:
        return { title: "All Vault Assets", desc: "Complete repository of board resources" };
    }
  };

  const headerInfo = getTabHeaderTitle();

  // Helper render for Vault Items List / Grid
  const renderVaultItems = () => {
    if (isLoading) {
      return (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading board vault resources...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center space-y-2">
          <p>{error}</p>
          <button type="button" onClick={() => loadAssets()} className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold cursor-pointer">
            Try Again
          </button>
        </div>
      );
    }
    if (filteredAssets.length === 0) {
      return (
        <div className="py-16 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-text-muted mx-auto opacity-50" />
          <p className="text-xs font-semibold text-text-secondary">No items found matching criteria.</p>
          <p className="text-[11px] text-text-muted">Try clearing search query or uploading a file above.</p>
        </div>
      );
    }

    if (activeTab === "images") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredAssets.map((asset) => {
            const rawAvatar = asset.user?.avatar || asset.user?.avatar_path || (asset as any).user_avatar;
            const authorSeed = asset.user?.first_name || asset.user?.username || asset.user_name || "User";
            const authorAvatar = getAvatarUrl(rawAvatar, authorSeed);
            const displayName = asset.user ? `${asset.user.first_name || ""} ${asset.user.last_name || ""}`.trim() || asset.user.username : asset.user_name || "General";

            return (
              <div
                key={asset.id}
                className="group rounded-2xl bg-surface-800/80 border border-border/60 overflow-hidden flex flex-col hover:border-primary/50 transition-all shadow-md"
              >
                <div className="relative aspect-[4/3] bg-surface-950 overflow-hidden">
                  <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-surface-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-surface-900/90 text-text-primary hover:text-primary transition-colors shadow-lg"
                      title="View Fullsize Image"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(asset.url, asset.id)}
                      className="p-2 rounded-xl bg-surface-900/90 text-text-primary hover:text-primary transition-colors shadow-lg cursor-pointer"
                      title="Copy Image URL"
                    >
                      {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-bold text-text-primary truncate" title={asset.title}>
                    {asset.title}
                  </p>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40 text-[10px] text-text-muted">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <img
                        src={authorAvatar}
                        alt={displayName}
                        className="w-3.5 h-3.5 rounded-full object-cover border border-border/40 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(authorSeed)}`;
                        }}
                      />
                      <span className="truncate">{displayName}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {asset.card_id && onSelectCard && (
                        <button
                          type="button"
                          onClick={() => onSelectCard(asset.card_id!)}
                          className="text-primary hover:underline font-semibold text-[9px] px-1 py-0.5 rounded bg-primary/10 border border-primary/20 truncate"
                          title={`Jump to card: ${asset.card_title}`}
                        >
                          Card View
                        </button>
                      )}

                      {asset.user_id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredAssets.map((asset) => {
          const isImage = asset.type === "image" || (asset.url && /\.(gif|jpe?g|png|webp|svg)/i.test(asset.url));
          const isLink = asset.type === "link" || asset.type === "card_link";
          const domainFavicon = isLink ? getDomainFavicon(asset.url) : null;
          const domainHost = isLink ? getDomainHost(asset.url) : null;
          const rawAvatar = asset.user?.avatar || asset.user?.avatar_path || (asset as any).user_avatar;
          const authorSeed = asset.user?.first_name || asset.user?.username || asset.user_name || "User";
          const authorAvatar = getAvatarUrl(rawAvatar, authorSeed);

          return (
            <div
              key={asset.id}
              className="p-3.5 rounded-2xl bg-surface-800/60 border border-border/60 hover:bg-surface-800 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                {isImage ? (
                  <div className="w-12 h-12 rounded-xl bg-surface-950 border border-border/60 overflow-hidden flex-shrink-0">
                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                  </div>
                ) : isLink ? (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 w-12 h-12">
                    {domainFavicon ? (
                      <img
                        src={domainFavicon}
                        alt={domainHost || "domain"}
                        className="w-6 h-6 rounded-md object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Link2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors" title={asset.title}>
                    {asset.title}
                  </p>

                  {domainHost && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-md bg-surface-950 text-text-muted text-[10px] font-semibold border border-border/40">
                      {domainHost}
                    </span>
                  )}

                  {asset.card_title && (
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      Card: <span className="text-text-secondary font-semibold">{asset.card_title}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={authorAvatar}
                    alt="User"
                    className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(authorSeed)}`;
                    }}
                  />
                  <span className="text-[10px] text-text-muted truncate">
                    {asset.user ? `${asset.user.first_name || ""} ${asset.user.last_name || ""}`.trim() || asset.user.username : asset.user_name || "Member"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {asset.card_id && onSelectCard && (
                    <button
                      type="button"
                      onClick={() => onSelectCard(asset.card_id!)}
                      className="px-2 py-1 rounded-lg bg-surface-700 hover:bg-primary/20 text-text-secondary hover:text-primary text-[10px] font-semibold transition-all cursor-pointer"
                      title="Jump to Card"
                    >
                      View Card
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(asset.url, asset.id)}
                    className="p-1.5 rounded-lg hover:bg-surface-700 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-surface-700 text-text-muted hover:text-text-primary transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {asset.user_id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // MOBILE BOTTOMSHEET LAYOUT (Mirroring BoardSettingsModal Mobile BottomSheet)
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        contentPaddingClass="p-0"
        title="Board Media Vault"
      >
        <div className="flex flex-col h-[82vh]">
          {/* Scrollable Mobile Nav Tabs */}
          <div className="px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-border/60 bg-surface-950/40 flex-shrink-0">
            {navItems.map((item) => {
              const IconC = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={`mob-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-primary text-surface-950 font-bold"
                      : "bg-surface-800 text-text-muted hover:text-text-primary"
                  }`}
                >
                  <IconC className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${
                      isActive ? "bg-surface-950/30 text-surface-950" : "bg-surface-700 text-text-muted"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & CTAs Bar */}
          <div className="p-3 border-b border-border/40 bg-surface-950/20 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(showAddForm === "link" ? null : "link")}
              className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs cursor-pointer"
              title="Add Link"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(showAddForm === "upload" ? null : "upload")}
              className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs cursor-pointer"
              title="Upload File"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
          </div>

          {/* Add Link / File Form (Mobile) */}
          {showAddForm === "link" && (
            <form onSubmit={handleAddLinkSubmit} className="p-3 bg-surface-950/90 border-b border-border/80 space-y-2 animate-in fade-in flex-shrink-0">
              <input
                type="text"
                placeholder="Link Title *"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary"
              />
              <input
                type="url"
                placeholder="URL (https://...) *"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(null)} className="px-3 py-1 text-xs text-text-muted">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-3 py-1 bg-primary text-surface-950 font-bold rounded-xl text-xs">Add</button>
              </div>
            </form>
          )}

          {showAddForm === "upload" && (
            <form onSubmit={handleFileUploadSubmit} className="p-3 bg-surface-950/90 border-b border-border/80 space-y-2 animate-in fade-in flex-shrink-0">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
                className="w-full text-xs text-text-secondary"
              />
              <input
                type="text"
                placeholder="Title (Optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(null)} className="px-3 py-1 text-xs text-text-muted">Cancel</button>
                <button type="submit" disabled={isSubmitting || !selectedFile} className="px-3 py-1 bg-emerald-500 text-surface-950 font-bold rounded-xl text-xs">Upload</button>
              </div>
            </form>
          )}

          {/* Scrollable Content Body (Mobile) */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {renderVaultItems()}
          </div>

          {/* Footer Bar (Mobile) */}
          <div className="px-4 py-2.5 border-t border-border/60 bg-surface-950/60 flex items-center justify-between text-[11px] text-text-muted flex-shrink-0">
            <span>Showing <strong className="text-text-primary">{filteredAssets.length}</strong> items</span>
            <button type="button" onClick={() => loadAssets()} className="text-primary font-semibold flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // DESKTOP MODAL LAYOUT (Mirroring BoardSettingsModal Desktop split container)
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-3xl max-w-5xl w-full h-[720px] max-h-[92vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar Navigation Panel */}
        <div className="w-full md:w-72 bg-surface-900/90 border-b md:border-b-0 md:border-r border-border/80 p-6 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-text-primary">Media & Links Vault</h2>
              <span className="text-text-muted hover:text-text-primary cursor-pointer p-0.5" title="Central Board Vault">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Central repository for card attachments, web bookmarks & general board uploads.
            </p>

            {/* Vertical Sidebar Navigation */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const IconC = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                      isActive
                        ? "bg-surface-800 text-primary border border-border/60 shadow-xs font-bold"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconC className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-text-muted"}`} />
                      <div className="text-left min-w-0">
                        <p className="truncate font-semibold">{item.label}</p>
                        <p className="text-[10px] text-text-muted font-normal truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full flex-shrink-0 ${
                        isActive ? "bg-primary/20 text-primary border border-primary/30" : "bg-surface-800 text-text-muted"
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Stats */}
          <div className="pt-4 border-t border-border/60 hidden md:block">
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>Total Resources</span>
              <span className="font-bold text-text-primary">{counts.all} Items</span>
            </div>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-900">
          {/* Main Content Header */}
          <div className="p-5 border-b border-border/80 bg-surface-950/40 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary truncate">{headerInfo.title}</h3>
              <p className="text-xs text-text-muted truncate">{headerInfo.desc}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddForm("link")}
                className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm("upload")}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload File</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
                title="Close Vault"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Live Search & Filter Bar */}
          <div className="px-5 py-3 border-b border-border/60 bg-surface-950/20 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search assets by title, domain, or card name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => loadAssets()}
              className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
              title="Refresh Vault Assets"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {/* Add Link Form */}
          {showAddForm === "link" && (
            <form onSubmit={handleAddLinkSubmit} className="p-4 bg-surface-950/90 border-b border-border/80 space-y-3 animate-in fade-in flex-shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  <span>Add General Board Link</span>
                </h4>
                <button type="button" onClick={() => setShowAddForm(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Link Title *"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
                <input
                  type="url"
                  placeholder="URL (https://...) *"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddForm(null)} className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted hover:text-text-primary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !newTitle.trim() || !newUrl.trim()} className="px-4 py-1.5 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light disabled:opacity-50">
                  {isSubmitting ? "Adding..." : "Add Link"}
                </button>
              </div>
            </form>
          )}

          {/* Upload File Form (Max 10MB) */}
          {showAddForm === "upload" && (
            <form onSubmit={handleFileUploadSubmit} className="p-4 bg-surface-950/90 border-b border-border/80 space-y-3 animate-in fade-in flex-shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload General File / Image (Max 10MB)</span>
                </h4>
                <button type="button" onClick={() => setShowAddForm(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 cursor-pointer"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Title (Optional)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddForm(null)} className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted hover:text-text-primary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !selectedFile} className="px-4 py-1.5 rounded-xl bg-emerald-500 text-surface-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50">
                  {isSubmitting ? "Compressing & Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {renderVaultItems()}
          </div>

          {/* Content Area Footer */}
          <div className="px-5 py-3 border-t border-border/60 bg-surface-950/40 flex items-center justify-between text-xs text-text-muted flex-shrink-0">
            <span>Showing <strong className="text-text-primary">{filteredAssets.length}</strong> of {counts.all} items</span>
            {searchQuery && (
              <span className="text-[11px] text-primary font-semibold">Filtered by "{searchQuery}"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
