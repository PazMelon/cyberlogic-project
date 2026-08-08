import React, { useState } from "react";
import { MessageSquare, BarChart2, History, Link as LinkIcon, ChevronsRight, ChevronsLeft } from "lucide-react";
import CardCommentsSection from "./CardCommentsSection";
import CardAuditLogDrawer from "./CardAuditLogDrawer";
import CardProgressNotesSection from "./CardProgressNotesSection";
import CardToolsLinksSection from "./CardToolsLinksSection";
import type { CyberboardCardActivity } from "../../../utils/api";

interface CardDetailSidePanelProps {
  card: any;
  comments: any[];
  newComment: string;
  setNewComment: (val: string | ((prev: string) => string)) => void;
  isSubmitting: boolean;
  visibleCommentsCount: number;
  setVisibleCommentsCount: React.Dispatch<React.SetStateAction<number>>;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  currentUserId?: number;
  boardHostId?: number;
  cardUserId?: number;
  cardAssignedUsers?: any[];
  isAdmin?: boolean;
  canEditCard: boolean;
  onSubmitComment: (e: React.FormEvent) => void;
  onDeleteComment: (commentId: number) => Promise<void>;
  activities?: CyberboardCardActivity[];
  formatDateTime: (dateStr?: string | null) => string;
  isUploadingImage: boolean;
  uploadStatusText: string;
  activeCarouselIndex: number;
  setActiveCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
  setFullscreenImageIndex: (idx: number | null) => void;
  copiedAttachmentId: string | null;
  setCopiedAttachmentId: (id: string | null) => void;
  checklist?: any[];
  onToggleChecklistItem?: (itemId: string) => void;
  progressComments?: any[];
  onAddComment?: (cardId: number, content: string) => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowAddLinkModal: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

export const CardDetailSidePanel: React.FC<CardDetailSidePanelProps> = ({
  card,
  comments,
  newComment,
  setNewComment,
  isSubmitting,
  visibleCommentsCount,
  setVisibleCommentsCount,
  boardVisibility,
  allowedMembers,
  currentUserId,
  boardHostId,
  cardUserId,
  cardAssignedUsers,
  isAdmin,
  canEditCard,
  onSubmitComment,
  onDeleteComment,
  activities = [],
  formatDateTime,
  isUploadingImage,
  uploadStatusText,
  activeCarouselIndex,
  setActiveCarouselIndex,
  setFullscreenImageIndex,
  copiedAttachmentId,
  setCopiedAttachmentId,
  checklist = [],
  onToggleChecklistItem,
  progressComments = [],
  onAddComment,
  onImageUpload,
  onShowAddLinkModal,
  onRemoveAttachment,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"activity" | "progress" | "audit_logs" | "tools">("activity");

  const attachmentsCount = (card.attachments || []).length;
  const completionRate = card.completion_percentage || 0;

  const handleTabClick = (tab: "activity" | "progress" | "audit_logs" | "tools") => {
    if (!isPanelOpen) {
      setActiveTab(tab);
      setIsPanelOpen(true);
    } else if (activeTab === tab) {
      setIsPanelOpen(false);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex h-full flex-shrink-0 relative">
      {/* Middle ClickUp Vertical Side Buttons Toolbar (Hidden on mobile, visible on sm/md/lg viewports) */}
      <div className="hidden sm:flex w-10 sm:w-11 bg-surface-950/90 border-l border-r border-border/80 flex-col items-center py-2.5 gap-2.5 flex-shrink-0 z-10 select-none">
        {/* Top Button: Expand / Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer mb-0.5"
          title={isPanelOpen ? "Collapse Side Panel" : "Expand Side Panel"}
        >
          {isPanelOpen ? (
            <ChevronsRight className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronsLeft className="w-4 h-4 text-text-muted hover:text-cyan-400" />
          )}
        </button>

        <div className="w-6 h-px bg-border/60 my-0.5" />

        {/* Activity Tab Button (Message bubble icon) */}
        <button
          type="button"
          onClick={() => handleTabClick("activity")}
          className={`relative p-2 rounded-xl transition-all cursor-pointer group ${
            isPanelOpen && activeTab === "activity"
              ? "bg-cyan-500 text-surface-950 shadow-md ring-2 ring-cyan-400/40"
              : "text-text-muted hover:text-text-primary hover:bg-surface-800"
          }`}
          title="Activity & Discussion"
        >
          <MessageSquare className="w-4 h-4" />
          {comments.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-cyan-400 text-[8px] font-black text-surface-950 shadow-xs">
              {comments.length}
            </span>
          )}
        </button>

        {/* Progress & Notes Tab Button */}
        <button
          type="button"
          onClick={() => handleTabClick("progress")}
          className={`relative p-2 rounded-xl transition-all cursor-pointer group ${
            isPanelOpen && activeTab === "progress"
              ? "bg-cyan-500 text-surface-950 shadow-md ring-2 ring-cyan-400/40"
              : "text-text-muted hover:text-text-primary hover:bg-surface-800"
          }`}
          title="Progress Tracking & Assignee Notes"
        >
          <BarChart2 className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-blue-500 text-[8px] font-black text-white shadow-xs">
            {completionRate}%
          </span>
        </button>

        {/* Audit Logs Tab Button */}
        <button
          type="button"
          onClick={() => handleTabClick("audit_logs")}
          className={`relative p-2 rounded-xl transition-all cursor-pointer group ${
            isPanelOpen && activeTab === "audit_logs"
              ? "bg-cyan-500 text-surface-950 shadow-md ring-2 ring-cyan-400/40"
              : "text-text-muted hover:text-text-primary hover:bg-surface-800"
          }`}
          title="Audit Logs History"
        >
          <History className="w-4 h-4" />
          {activities.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-surface-700 border border-border text-[8px] font-black text-text-muted">
              {activities.length}
            </span>
          )}
        </button>

        {/* Tools & Links Tab Button */}
        <button
          type="button"
          onClick={() => handleTabClick("tools")}
          className={`relative p-2 rounded-xl transition-all cursor-pointer group ${
            isPanelOpen && activeTab === "tools"
              ? "bg-cyan-500 text-surface-950 shadow-md ring-2 ring-cyan-400/40"
              : "text-text-muted hover:text-text-primary hover:bg-surface-800"
          }`}
          title="Tools, Links & Files Hub"
        >
          <LinkIcon className="w-4 h-4" />
          {attachmentsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-purple-500 text-[8px] font-black text-white shadow-xs">
              {attachmentsCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Right Split Drawer View */}
      <div
        className={`bg-surface-900/95 transition-all duration-300 ease-in-out flex flex-col h-full overflow-hidden ${
          isPanelOpen ? "w-full sm:w-[380px] md:w-[410px] lg:w-[440px] opacity-100 border-r border-border/70" : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Drawer Content Views */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeTab === "activity" && (
            <div className="h-full flex flex-col overflow-hidden">
              <CardCommentsSection
                comments={comments}
                newComment={newComment}
                setNewComment={setNewComment}
                isSubmitting={isSubmitting}
                visibleCommentsCount={visibleCommentsCount}
                setVisibleCommentsCount={setVisibleCommentsCount}
                boardVisibility={boardVisibility}
                allowedMembers={allowedMembers}
                currentUserId={currentUserId}
                boardHostId={boardHostId}
                cardUserId={cardUserId}
                cardAssignedUsers={cardAssignedUsers}
                isAdmin={isAdmin}
                onSubmitComment={onSubmitComment}
                onDeleteComment={onDeleteComment}
              />
            </div>
          )}

          {activeTab === "progress" && (
            <div className="h-full overflow-y-auto scrollbar-thin">
              <CardProgressNotesSection
                cardId={card.id}
                completionPercentage={completionRate}
                assignedUsers={card.assigned_users || []}
                currentUserId={currentUserId}
                boardHostId={boardHostId}
                cardUserId={cardUserId}
                isAdmin={isAdmin}
                checklist={checklist}
                onToggleChecklistItem={onToggleChecklistItem}
                progressComments={progressComments}
                onAddComment={onAddComment}
              />
            </div>
          )}

          {activeTab === "audit_logs" && (
            <div className="h-full flex flex-col overflow-hidden">
              <CardAuditLogDrawer
                activities={activities}
                formatDateTime={formatDateTime}
              />
            </div>
          )}

          {activeTab === "tools" && (
            <div className="h-full overflow-y-auto scrollbar-thin">
              <CardToolsLinksSection
                card={card}
                canEditCard={canEditCard}
                isUploadingImage={isUploadingImage}
                uploadStatusText={uploadStatusText}
                activeCarouselIndex={activeCarouselIndex}
                setActiveCarouselIndex={setActiveCarouselIndex}
                setFullscreenImageIndex={setFullscreenImageIndex}
                copiedAttachmentId={copiedAttachmentId}
                setCopiedAttachmentId={setCopiedAttachmentId}
                onImageUpload={onImageUpload}
                onShowAddLinkModal={onShowAddLinkModal}
                onRemoveAttachment={onRemoveAttachment}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDetailSidePanel;
