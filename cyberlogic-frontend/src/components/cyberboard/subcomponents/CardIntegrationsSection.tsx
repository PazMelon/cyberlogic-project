import React, { useState } from "react";
import { Link as LinkIcon, GitCommit, ExternalLink, Plus, Layers, ShieldCheck } from "lucide-react";

interface CardIntegrationsSectionProps {
  cardId: number;
}

export const CardIntegrationsSection: React.FC<CardIntegrationsSectionProps> = ({ cardId: _cardId }) => {
  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      type: "github",
      title: "PR #142: Fix Gantt Canvas Obstacle Avoidance",
      subtitle: "Merged 2 hours ago by @melon",
      url: "#",
      badge: "Merged",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    {
      id: 2,
      type: "figma",
      title: "ClickUp Workspace Redesign UI Prototype v2",
      subtitle: "Updated by Designer 1 day ago",
      url: "#",
      badge: "Design",
      badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    setIntegrations((prev) => [
      {
        id: Date.now(),
        type: "link",
        title: newTitle,
        subtitle: "Added just now",
        url: newUrl,
        badge: "External",
        badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      },
      ...prev,
    ]);

    setNewTitle("");
    setNewUrl("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Connected Integrations ({integrations.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Link Item</span>
        </button>
      </div>

      {/* Integration List */}
      <div className="space-y-2.5">
        {integrations.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-2xl bg-surface-800/80 border border-border/70 hover:border-cyan-500/50 hover:bg-surface-800 transition-all flex items-center justify-between gap-3 group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-surface-900 border border-border/80 flex items-center justify-center text-text-primary flex-shrink-0">
                {item.type === "github" ? (
                  <GitCommit className="w-4 h-4 text-purple-400" />
                ) : (
                  <LinkIcon className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary group-hover:text-cyan-400 transition-colors truncate">
                  {item.title}
                </span>
                <span className="text-[10px] text-text-muted truncate">{item.subtitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${item.badgeColor}`}>
                {item.badge}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-cyan-400 transition-colors" />
            </div>
          </a>
        ))}
      </div>

      {/* Add Link Form Modal / Overlay */}
      {showAddModal && (
        <form onSubmit={handleAddIntegration} className="p-3.5 rounded-2xl bg-surface-800/90 border border-border space-y-3 shadow-lg animate-in fade-in duration-150">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
            Link External Tool / PR / Figma Design
          </span>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Title / Description (e.g. GitHub PR #42)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-surface-900 border border-border/80 text-text-primary px-3 py-1.5 rounded-xl text-xs font-semibold focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="url"
              placeholder="URL (https://github.com/...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full bg-surface-900 border border-border/80 text-text-primary px-3 py-1.5 rounded-xl text-xs font-semibold focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle || !newUrl}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 text-xs font-bold transition-all disabled:opacity-40"
            >
              Connect Item
            </button>
          </div>
        </form>
      )}

      {/* Automated Webhooks Info Banner */}
      <div className="p-3.5 rounded-2xl bg-surface-900/60 border border-border/60 flex items-center gap-3 text-xs text-text-muted">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <span>GitHub & Figma Webhook sync enabled for this card. Status updates sync automatically.</span>
      </div>
    </div>
  );
};

export default CardIntegrationsSection;
