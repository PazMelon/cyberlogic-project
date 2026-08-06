import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  fetchCyberboardBoardAssets,
  addCyberboardBoardLinkAsset,
  uploadCyberboardBoardFileAsset,
  deleteCyberboardBoardAsset,
  getAvatarUrl,
  type CyberboardBoardAsset,
} from "../../utils/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { BottomSheet } from "../ui/BottomSheet";

interface BoardMediaVaultModalProps {
  boardId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectCard?: (cardId: number) => void;
  onToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export default function BoardMediaVaultModal({
  boardId,
  isOpen,
  onClose,
  onSelectCard,
  onToast,
}: BoardMediaVaultModalProps) {
  const { subscribe } = useWebSocket();
  const [activeTab, setActiveTab] = useState<"card_assets" | "general_assets">("card_assets");
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

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
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
    setIsSubmitting(true);
    try {
      const created = await uploadCyberboardBoardFileAsset(
        boardId,
        selectedFile,
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

  if (!isOpen) return null;

  const renderContent = () => (
    <div className="flex flex-col h-full bg-surface-900 text-text-primary overflow-hidden">
      {/* Vault Header */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-3 bg-surface-950/60 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-text-primary truncate">
              Board Media & Links Vault
            </h2>
            <p className="text-[11px] text-text-muted truncate">
              Extracted task resources & general board assets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
          title="Close Vault"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Vault Navigation Tabs & Action Controls */}
      <div className="px-4 py-2.5 border-b border-border/60 bg-surface-950/30 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("card_assets")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "card_assets"
                ? "bg-primary text-surface-950 font-bold"
                : "bg-surface-800 text-text-muted hover:text-text-primary"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Card Resources ({cardAssets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("general_assets")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "general_assets"
                ? "bg-primary text-surface-950 font-bold"
                : "bg-surface-800 text-text-muted hover:text-text-primary"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>General Board Vault ({generalAssets.length})</span>
          </button>
        </div>

        {activeTab === "general_assets" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm("link")}
              className="px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Link</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm("upload")}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload File</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Link / Upload File Form Modals */}
      {showAddForm === "link" && (
        <form onSubmit={handleAddLinkSubmit} className="p-4 bg-surface-950/80 border-b border-border/80 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>Add General Board Link</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(null)}
              className="text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Link Title *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
            />
            <input
              type="url"
              placeholder="URL (https://...) *"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(null)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim() || !newUrl.trim()}
              className="px-4 py-1.5 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Link"}
            </button>
          </div>
        </form>
      )}

      {showAddForm === "upload" && (
        <form onSubmit={handleFileUploadSubmit} className="p-4 bg-surface-950/80 border-b border-border/80 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload General File / Image</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(null)}
              className="text-text-muted hover:text-text-primary"
            >
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
            <input
              type="text"
              placeholder="Title (Optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(null)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 text-surface-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50"
            >
              {isSubmitting ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </form>
      )}

      {/* Main Asset Grid / List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading vault assets...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadAssets()}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : activeTab === "card_assets" ? (
          cardAssets.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-text-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-text-secondary">No task links or attachments found yet.</p>
              <p className="text-[11px] text-text-muted">Add attachments or web links inside task cards to see them harvested here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cardAssets.map((asset) => {
                const isImage = /\.(gif|jpe?g|png|webp|svg)/i.test(asset.url);
                return (
                  <div
                    key={asset.id}
                    className="p-3 rounded-2xl bg-surface-800/60 border border-border/60 hover:bg-surface-800 transition-all flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isImage ? (
                        <div className="w-10 h-10 rounded-xl bg-surface-950 border border-border/60 overflow-hidden flex-shrink-0">
                          <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                          <Link2 className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors" title={asset.title}>
                          {asset.title}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          Card: <span className="text-text-secondary font-semibold">{asset.card_title}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <span className="text-[10px] text-text-muted truncate">By {asset.user_name}</span>
                      <div className="flex items-center gap-1">
                        {asset.card_id && onSelectCard && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCard(asset.card_id!);
                              onClose();
                            }}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : generalAssets.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <FolderKanban className="w-8 h-8 text-text-muted mx-auto opacity-50" />
            <p className="text-xs font-semibold text-text-secondary">No general board media or links added yet.</p>
            <p className="text-[11px] text-text-muted">Click "Add Link" or "Upload File" above to attach board-level resources.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generalAssets.map((asset) => {
              const isImage = asset.type === "image" || /\.(gif|jpe?g|png|webp|svg)/i.test(asset.url);
              const authorAvatar = getAvatarUrl(asset.user?.avatar || asset.user?.avatar_path, asset.user?.first_name || "User");
              return (
                <div
                  key={asset.id}
                  className="p-3 rounded-2xl bg-surface-800/60 border border-border/60 hover:bg-surface-800 transition-all flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {isImage ? (
                      <div className="w-10 h-10 rounded-xl bg-surface-950 border border-border/60 overflow-hidden flex-shrink-0">
                        <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                        {asset.type === "link" ? <Link2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text-primary truncate group-hover:text-emerald-400 transition-colors" title={asset.title}>
                        {asset.title}
                      </p>
                      {asset.description && (
                        <p className="text-[11px] text-text-muted line-clamp-1" title={asset.description}>
                          {asset.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={authorAvatar} alt="User" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                      <span className="text-[10px] text-text-muted truncate">
                        {asset.user ? `${asset.user.first_name || ""} ${asset.user.last_name || ""}`.trim() || asset.user.username : "Member"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
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
                        title="Open Asset"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} contentPaddingClass="p-0">
        <div className="h-[80vh]">{renderContent()}</div>
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-3xl max-w-4xl w-full h-[650px] max-h-[90vh] shadow-2xl overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
