import React from "react";
import { Link2, Image as ImageIcon, FileText, ExternalLink, Copy, Check, Trash2 } from "lucide-react";
import { getAvatarUrl } from "../../../utils/api";
import type { ExtendedCyberboardBoardAsset } from "../shared/cyberboardTypes";
import ProviderBadge from "../ui/ProviderBadge";
import { formatFileSize, formatDate } from "../shared/cyberboardUtils";

interface MediaAssetCardProps {
  asset: ExtendedCyberboardBoardAsset;
  copiedId: string | number | null;
  onCopyUrl: (asset: ExtendedCyberboardBoardAsset) => void;
  onDeleteAsset: (id: number) => void;
  onSelectCard?: (cardId: number) => void;
}

export const MediaAssetCard: React.FC<MediaAssetCardProps> = ({
  asset,
  copiedId,
  onCopyUrl,
  onDeleteAsset,
  onSelectCard,
}) => {
  return (
    <div className="p-3.5 rounded-2xl bg-surface-800/80 border border-border/60 hover:border-primary/40 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-900 border border-border/60 flex items-center justify-center flex-shrink-0">
          {asset.type === "image" ? (
            <ImageIcon className="w-5 h-5 text-cyan-400" />
          ) : asset.type === "link" ? (
            <Link2 className="w-5 h-5 text-primary" />
          ) : (
            <FileText className="w-5 h-5 text-purple-400" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ProviderBadge provider={asset.provider} />
            {asset.is_card_attachment && asset.card_id && (
              <button
                type="button"
                onClick={() => onSelectCard && onSelectCard(asset.card_id!)}
                className="px-2 py-0.5 rounded-full bg-surface-900 text-text-muted hover:text-primary text-[10px] font-bold border border-border/60 transition-colors"
              >
                Card #{asset.card_id}
              </button>
            )}
          </div>

          <h5 className="text-xs font-bold text-text-primary truncate" title={asset.title}>
            {asset.title}
          </h5>

          {asset.description && (
            <p className="text-[11px] text-text-muted line-clamp-1">{asset.description}</p>
          )}

          <div className="flex items-center gap-2 text-[10px] text-text-muted pt-0.5">
            {asset.original_size ? <span>{formatFileSize(asset.original_size)}</span> : null}
            <span>• {formatDate(asset.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
        <div className="flex items-center gap-1 text-text-muted">
          {asset.uploader && (
            <div className="flex items-center gap-1">
              <img
                src={getAvatarUrl(asset.uploader.avatar, asset.uploader.name)}
                alt={asset.uploader.name}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="truncate max-w-[100px]">{asset.uploader.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCopyUrl(asset)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
            title="Copy URL"
          >
            {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
            title="Open Link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {!asset.is_card_attachment && (
            <button
              type="button"
              onClick={() => onDeleteAsset(Number(asset.id))}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all cursor-pointer"
              title="Delete Asset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaAssetCard;
