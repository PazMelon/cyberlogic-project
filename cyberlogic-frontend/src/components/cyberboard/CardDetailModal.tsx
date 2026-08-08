import React, { useState, useEffect, useRef } from "react";
import {
  X, Calendar, Trash2, History, Edit3, Check, Link as LinkIcon, Image as ImageIcon,
  Plus, ChevronLeft, ChevronRight, Download, AlertCircle, Clock, MessageSquare, BarChart2, FileText
} from "lucide-react";
import type { CyberboardCard, CyberboardColumn, CyberboardAttachment, CyberboardChecklistItem } from "../../utils/api";
import { uploadCyberboardAttachment } from "../../utils/api";
import { optimizeAndConvertToWebP } from "../../utils/imageOptimizer";
import { BottomSheet } from "../ui/BottomSheet";
import MentionText from "./MentionText";
import CardAuditLogDrawer from "./subcomponents/CardAuditLogDrawer";
import CardEditForm from "./subcomponents/CardEditForm";
import CardDetailSidePanel from "./subcomponents/CardDetailSidePanel";
import CardCommentsSection from "./subcomponents/CardCommentsSection";
import CardProgressNotesSection from "./subcomponents/CardProgressNotesSection";
import CardToolsLinksSection from "./subcomponents/CardToolsLinksSection";
import CardVotingSection from "./subcomponents/CardVotingSection";
import CardSubtasksList from "./subcomponents/CardSubtasksList";
import TaskChecklistSection from "./subcomponents/TaskChecklistSection";
import CompletionConfirmModal from "./subcomponents/CompletionConfirmModal";
import { detectAttachmentProvider, formatDate, formatDateTime } from "./shared/cyberboardUtils";
import { useIsMobile } from "./shared/useIsMobile";

interface CardDetailModalProps {
  card: CyberboardCard | null;
  allBoardCards?: CyberboardCard[];
  boardType?: string;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  boardPhases?: Array<{ name: string; color: string }>;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  columnPermissions?: {
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  };
  isAdmin?: boolean;
  onClose: () => void;
  onVoteToggle: (cardId: number) => void;
  onAddComment: (cardId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onDeleteCard: (cardId: number) => void;
  columns?: CyberboardColumn[];
  onUpdateCard?: (cardId: number, data: Partial<CyberboardCard>) => Promise<void>;
  onNavigateToSubtask?: (subtask: CyberboardCard) => void;
  onShowToast?: (text: string, type?: "error" | "info" | "success") => void;
}

export default function CardDetailModal({
  card,
  allBoardCards = [],
  boardType = "activity",
  boardVisibility = "public",
  allowedMembers = [],
  boardPhases = [],
  currentUserId,
  userRole,
  boardHostId,
  columnPermissions,
  isAdmin,
  onClose,
  onVoteToggle,
  onAddComment,
  onDeleteComment,
  onDeleteCard,
  columns = [],
  onUpdateCard,
  onNavigateToSubtask,
  onShowToast,
}: CardDetailModalProps) {
  const safeBoardPhases = boardPhases || [];

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuditLog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editColorTag, setEditColorTag] = useState<string>("#06b6d4");
  const [editActivityDate, setEditActivityDate] = useState<string>("");
  const [editActivityEndDate, setEditActivityEndDate] = useState<string>("");
  const [editAssignedUserIds, setEditAssignedUserIds] = useState<number[]>([]);
  const [editPhase, setEditPhase] = useState<string>("");
  const [editPredecessorIds, setEditPredecessorIds] = useState<number[]>([]);
  const [editParentId, setEditParentId] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Attachment state
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [copiedAttachmentId, setCopiedAttachmentId] = useState<string | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);

  const isMobile = useIsMobile(640);
  const [mobileTab, setMobileTab] = useState<"details" | "activity" | "progress" | "audit_logs" | "tools">("details");

  // Checklist & Completion Rate state
  const [checklist, setChecklist] = useState<CyberboardChecklistItem[]>([]);
  const [manualCompletionPercentage, setManualCompletionPercentage] = useState<number>(0);

  useEffect(() => {
    if (card) {
      setEditTitle(card.title || "");
      setEditDescription(card.description || "");
      setEditPriority(card.priority || "medium");
      setEditColorTag(card.color_tag || "#06b6d4");
      setEditActivityDate(card.activity_date ? card.activity_date.split("T")[0] : "");
      setEditActivityEndDate(card.activity_end_date ? card.activity_end_date.split("T")[0] : "");
      const initialIds = card.assigned_user_ids && card.assigned_user_ids.length > 0
        ? card.assigned_user_ids
        : card.assigned_user_id
        ? [card.assigned_user_id]
        : [];
      setEditAssignedUserIds(initialIds);
      setEditPhase(card.phase || "");
      const initialPredIds = card.predecessor_ids && card.predecessor_ids.length > 0
        ? card.predecessor_ids
        : card.predecessor_id
        ? [card.predecessor_id]
        : [];
      setEditPredecessorIds(initialPredIds);
      setEditParentId(card.parent_id || null);

      let parsedCl: CyberboardChecklistItem[] = [];
      if (card.checklist) {
        if (typeof card.checklist === "string") {
          try {
            parsedCl = JSON.parse(card.checklist);
          } catch {
            parsedCl = [];
          }
        } else if (Array.isArray(card.checklist)) {
          parsedCl = card.checklist;
        }
      }
      setChecklist(parsedCl);
      setManualCompletionPercentage(card.completion_percentage ?? 0);
    }
  }, [card]);

  const [pendingCompletionModal, setPendingCompletionModal] = useState<{
    targetColumnId: number;
    targetColumnTitle: string;
    payload: Partial<CyberboardCard>;
  } | null>(null);

  const getIncompletePredecessors = (targetCard?: CyberboardCard | null) => {
    if (!targetCard) return [];
    const predIds = (targetCard.predecessor_ids && targetCard.predecessor_ids.length > 0)
      ? targetCard.predecessor_ids
      : (targetCard.predecessor_id ? [targetCard.predecessor_id] : []);

    if (predIds.length === 0 || !allBoardCards || !columns || columns.length === 0) return [];
    const lastColPosition = columns.reduce((max, c) => Math.max(max, c.position ?? 0), 0);

    const incomplete: CyberboardCard[] = [];
    for (const pId of predIds) {
      const pCard = allBoardCards.find((c) => c.id === pId);
      if (pCard) {
        const pCol = columns.find((c) => c.id === pCard.column_id);
        const isPDone = pCol && (
          pCol.status_type === "completed" ||
          pCol.title.toLowerCase().includes("done") ||
          pCol.title.toLowerCase().includes("complete") ||
          (pCol.position !== undefined && pCol.position === lastColPosition && lastColPosition > 0)
        );
        if (!isPDone) {
          incomplete.push(pCard);
        }
      }
    }
    return incomplete;
  };

  const promptCompletionMoveIfTargetColExists = (
    rate: number,
    basePayload: Partial<CyberboardCard>
  ) => {
    // Determine overall completion rate taking subcards into account
    const subcardsList = (card?.sub_cards && card.sub_cards.length > 0)
      ? card.sub_cards
      : (allBoardCards || []).filter((c) => c.parent_id === card?.id && !c.is_archived);

    let overallRate = rate;
    const hasChecklist = !!(card?.checklist && (Array.isArray(card.checklist) ? card.checklist.length > 0 : String(card.checklist).trim().length > 2));
    const hasSubcards = subcardsList.length > 0 && columns && columns.length > 0;

    if (hasSubcards) {
      const lastColPosition = columns.reduce((max, c) => Math.max(max, c.position ?? 0), 0);
      const completedSubcardsCount = subcardsList.filter((sc) => {
        const col = columns.find((c) => c.id === sc.column_id);
        if (!col) return false;
        return (
          col.status_type === "completed" ||
          col.title.toLowerCase().includes("done") ||
          col.title.toLowerCase().includes("completed") ||
          (col.position !== undefined && col.position === lastColPosition && lastColPosition > 0)
        );
      }).length;
      const subcardsRate = (completedSubcardsCount / subcardsList.length) * 100;
      if (hasChecklist) {
        overallRate = Math.round(rate * 0.5 + subcardsRate * 0.5);
      } else {
        overallRate = Math.round(subcardsRate);
      }
    }

    if (overallRate === 100) {
      const incomplete = getIncompletePredecessors(card);
      if (incomplete.length > 0) {
        const predTitles = incomplete.map((c) => `'${c.title}'`).join(", ");
        if (onShowToast) {
          onShowToast(
            `Cannot complete task: Predecessor task${incomplete.length > 1 ? "s" : ""} ${predTitles} ${incomplete.length > 1 ? "are" : "is"} not completed yet!`,
            "error"
          );
        }
        return true;
      }

      if (columns && columns.length > 0) {
        const completedCol = columns.find(
          (c) =>
            c.status_type === "completed" ||
            c.title.toLowerCase().includes("done") ||
            c.title.toLowerCase().includes("completed")
        );
        if (completedCol && card?.column_id !== completedCol.id) {
          setPendingCompletionModal({
            targetColumnId: completedCol.id,
            targetColumnTitle: completedCol.title,
            payload: { ...basePayload, column_id: completedCol.id },
          });
          return true;
        }
      }
    }
    return false;
  };

  const handleConfirmCompletionMove = async () => {
    if (!pendingCompletionModal || !card || !onUpdateCard) return;
    const payload = pendingCompletionModal.payload;
    setPendingCompletionModal(null);
    try {
      await onUpdateCard(card.id, payload);
    } catch (err) {
      console.error("Failed to move card to completed column:", err);
    }
  };

  const handleCancelCompletionMove = async () => {
    if (!pendingCompletionModal || !card || !onUpdateCard) return;
    const { payload } = pendingCompletionModal;
    setPendingCompletionModal(null);
    // Execute payload without column_id change
    const { column_id, ...payloadWithoutCol } = payload;
    try {
      await onUpdateCard(card.id, payloadWithoutCol);
    } catch (err) {
      console.error("Failed to update card completion:", err);
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    const toggledItem = checklist.find((i) => i.id === itemId);
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    const completedCount = updated.filter((item) => item.completed).length;
    const rate = Math.round((completedCount / updated.length) * 100);

    const basePayload: Partial<CyberboardCard> = { checklist: updated, completion_percentage: rate };

    const modalPrompted = promptCompletionMoveIfTargetColExists(rate, basePayload);

    if (!modalPrompted && card && onUpdateCard) {
      try {
        await onUpdateCard(card.id, basePayload);
        if (toggledItem && onAddComment) {
          const itemText = toggledItem.text || (toggledItem as any).title || (toggledItem as any).label || "Checklist item";
          const statusText = !toggledItem.completed ? "Marked as completed" : "Marked as incomplete";
          await onAddComment(card.id, `[PROGRESS_NOTE]: ${statusText}: "${itemText}"`);
        }
      } catch (err) {
        console.error("Failed to update checklist:", err);
      }
    }
  };

  const handleAddChecklistItem = async (text: string) => {
    if (!text.trim()) return;
    const newItem: CyberboardChecklistItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    const completedCount = updated.filter((item) => item.completed).length;
    const rate = Math.round((completedCount / updated.length) * 100);
    const basePayload: Partial<CyberboardCard> = { checklist: updated, completion_percentage: rate };

    const modalPrompted = promptCompletionMoveIfTargetColExists(rate, basePayload);

    if (!modalPrompted && card && onUpdateCard) {
      try {
        await onUpdateCard(card.id, basePayload);
      } catch (err) {
        console.error("Failed to add checklist item:", err);
      }
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    setChecklist(updated);
    const rate = updated.length > 0
      ? Math.round((updated.filter((item) => item.completed).length / updated.length) * 100)
      : manualCompletionPercentage;
    const basePayload: Partial<CyberboardCard> = { checklist: updated, completion_percentage: rate };

    const modalPrompted = promptCompletionMoveIfTargetColExists(rate, basePayload);

    if (!modalPrompted && card && onUpdateCard) {
      try {
        await onUpdateCard(card.id, basePayload);
      } catch (err) {
        console.error("Failed to delete checklist item:", err);
      }
    }
  };

  const handleReorderChecklist = async (updated: CyberboardChecklistItem[]) => {
    setChecklist(updated);
    if (!card || !onUpdateCard) return;
    const completedCount = updated.filter((item) => item.completed).length;
    const rate = updated.length > 0
      ? Math.round((completedCount / updated.length) * 100)
      : manualCompletionPercentage;
    const basePayload: Partial<CyberboardCard> = { checklist: updated, completion_percentage: rate };
    try {
      await onUpdateCard(card.id, basePayload);
    } catch (err) {
      console.error("Failed to reorder checklist items:", err);
    }
  };

  const sliderDebounceTimerRef = useRef<any>(null);

  const handleManualCompletionChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));

    if (clamped === 100) {
      const incomplete = getIncompletePredecessors(card);
      if (incomplete.length > 0) {
        const predTitles = incomplete.map((c) => `'${c.title}'`).join(", ");
        setManualCompletionPercentage(card?.completion_percentage ?? 0);
        if (onShowToast) {
          onShowToast(
            `Cannot set 100% completion: Predecessor task${incomplete.length > 1 ? "s" : ""} ${predTitles} ${incomplete.length > 1 ? "are" : "is"} not completed yet!`,
            "error"
          );
        }
        return;
      }
    }

    setManualCompletionPercentage(clamped);

    if (sliderDebounceTimerRef.current) {
      clearTimeout(sliderDebounceTimerRef.current);
    }

    sliderDebounceTimerRef.current = setTimeout(async () => {
      if (card && onUpdateCard && checklist.length === 0) {
        const basePayload: Partial<CyberboardCard> = { completion_percentage: clamped };
        const modalPrompted = promptCompletionMoveIfTargetColExists(clamped, basePayload);
        if (!modalPrompted) {
          try {
            await onUpdateCard(card.id, basePayload);
          } catch (err) {
            console.error("Failed to update completion percentage:", err);
          }
        }
      }
    }, 400);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !card || !onUpdateCard) return;

    setIsUploadingImage(true);
    setUploadStatusText("Optimizing & Converting to WebP...");

    try {
      const file = files[0];

      // 1. Optimize & Convert to WebP using existing helper!
      const optResult = await optimizeAndConvertToWebP(file);

      setUploadStatusText("Uploading WebP image to server...");

      // 2. Convert base64 dataUrl back to a File blob to send to server
      const res = await fetch(optResult.dataUrl);
      const blob = await res.blob();
      const isGif = file.type === "image/gif";
      const ext = isGif ? "gif" : "webp";
      const webpFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}.${ext}`, {
        type: isGif ? "image/gif" : "image/webp",
      });

      // 3. Upload to Laravel storage via API
      const uploaded = await uploadCyberboardAttachment(webpFile);

      // 4. Append to attachments array
      const newAttachment: CyberboardAttachment = {
        id: "att-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        type: "image",
        title: file.name,
        url: uploaded.url,
        provider: "upload",
        original_size: optResult.originalSize,
        optimized_size: optResult.optimizedSize,
        created_at: new Date().toISOString(),
      };

      const currentAttachments = card.attachments || [];
      const updated = [...currentAttachments, newAttachment];

      await onUpdateCard(card.id, { attachments: updated });
    } catch (err: any) {
      console.error("Failed to upload attachment image:", err);
      alert(err.message || "Failed to upload image attachment.");
    } finally {
      setIsUploadingImage(false);
      setUploadStatusText("");
      if (e.target) e.target.value = "";
    }
  };

  const handleAddLinkSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!linkUrl.trim() || !card || !onUpdateCard) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const provider = detectAttachmentProvider(formattedUrl);
    const providerLabel = provider ? provider.replace("_", " ").toUpperCase() : "";
    const defaultTitle =
      linkTitle.trim() ||
      (provider && provider !== "general"
        ? `${providerLabel} File`
        : formattedUrl);

    const newAttachment: CyberboardAttachment = {
      id: "att-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      type: "link",
      title: defaultTitle,
      url: formattedUrl,
      provider: provider,
      created_at: new Date().toISOString(),
    };

    const currentAttachments = card.attachments || [];
    const updated = [...currentAttachments, newAttachment];

    try {
      await onUpdateCard(card.id, { attachments: updated });
      setLinkUrl("");
      setLinkTitle("");
      setShowAddLinkModal(false);
    } catch (err) {
      console.error("Failed to add link attachment:", err);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!card || !onUpdateCard) return;
    const currentAttachments = card.attachments || [];
    const updated = currentAttachments.filter((att) => att.id !== attachmentId);
    try {
      await onUpdateCard(card.id, { attachments: updated });
    } catch (err) {
      console.error("Failed to remove attachment:", err);
    }
  };

  if (!card) return null;

  // Determine Column-Based Editing Permissions
  const isOwner = card.user_id === currentUserId;
  const isHost = boardHostId === currentUserId;
  const allowedRoles = columnPermissions?.allowed_roles || [];
  const allowedUsers = columnPermissions?.allowed_users || [];
  const hasColumnRestriction = allowedRoles.length > 0 || allowedUsers.length > 0;

  const canEditCard = (() => {
    if (isAdmin || isHost) return true;
    if (!hasColumnRestriction) return true; // No restriction on column, anyone can edit
    const roleAllowed = userRole && allowedRoles.includes(userRole);
    const userAllowed = currentUserId && allowedUsers.includes(currentUserId);
    return !!(roleAllowed || userAllowed);
  })();

  const canDeleteCard = isOwner || isHost || isAdmin;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(card.id, newComment.trim());
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCardEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !onUpdateCard || isSavingEdit) return;

    const computedRate = checklist.length > 0
      ? Math.round((checklist.filter((i) => i.completed).length / checklist.length) * 100)
      : manualCompletionPercentage;

    setIsSavingEdit(true);
    try {
      await onUpdateCard(card.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        assigned_user_id: editAssignedUserIds[0] || null,
        assigned_user_ids: editAssignedUserIds,
        priority: editPriority,
        phase: editPhase || null,
        predecessor_id: editPredecessorIds[0] || null,
        predecessor_ids: editPredecessorIds,
        parent_id: editParentId || null,
        color_tag: editColorTag,
        activity_date: editActivityDate || null,
        activity_end_date: editActivityEndDate || null,
        checklist: checklist.length > 0 ? checklist : null,
        completion_percentage: computedRate,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save card edits:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);

  useEffect(() => {
    setVisibleCommentsCount(10);
  }, [card?.id]);

  const rawComments = card?.comments || [];
  const comments = rawComments.filter(
    (c) => !(c.content && c.content.startsWith("[AUDIT_LOG]:")) && !(c.content && c.content.startsWith("[PROGRESS_NOTE]:"))
  );
  const progressComments = rawComments.filter(
    (c) => c.content && c.content.startsWith("[PROGRESS_NOTE]:")
  );

  const activities = card?.activities || [];
  const showDateSection = boardType !== "ideas" && boardType !== "brainstorming" && (card?.activity_date || card?.activity_end_date);

  // Sidepanel Component for Audit Logs
  const auditLogSidepanel = (
    <CardAuditLogDrawer
      activities={activities}
      formatDateTime={formatDateTime}
    />
  );

  const modalBody = (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Edit Form Mode */}
      {isEditing ? (
        <CardEditForm
          card={card}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editPriority={editPriority}
          setEditPriority={setEditPriority}
          editColorTag={editColorTag}
          setEditColorTag={setEditColorTag}
          editActivityDate={editActivityDate}
          setEditActivityDate={setEditActivityDate}
          editActivityEndDate={editActivityEndDate}
          setEditActivityEndDate={setEditActivityEndDate}
          editAssignedUserIds={editAssignedUserIds}
          setEditAssignedUserIds={setEditAssignedUserIds}
          editPhase={editPhase}
          setEditPhase={setEditPhase}
          editPredecessorIds={editPredecessorIds}
          setEditPredecessorIds={setEditPredecessorIds}
          editParentId={editParentId}
          setEditParentId={setEditParentId}
          isSavingEdit={isSavingEdit}
          boardType={boardType}
          boardVisibility={boardVisibility}
          allowedMembers={allowedMembers}
          boardHostId={boardHostId}
          safeBoardPhases={safeBoardPhases}
          allBoardCards={allBoardCards}
          isMobile={isMobile}
          onCancel={() => setIsEditing(false)}
          onSubmit={handleSaveCardEdits}
        />
      ) : (
        /* View Mode Flow: 2-Column ClickUp Workspace */
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Column: Task Body Content */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
            {/* Description & Details */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider">
                {boardType === "ideas" || boardType === "brainstorming" ? "Description & Concept Details" : "Description & Details"}
              </h4>
              <div className="p-3 rounded-xl bg-surface-800/50 border border-border/50 text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                {card.description ? <MentionText content={card.description} /> : <span className="text-text-muted italic">No detailed description provided.</span>}
              </div>
            </div>

            {/* Media & External Links Vault Preview in Details Tab */}
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
              onImageUpload={handleImageUpload}
              onShowAddLinkModal={() => setShowAddLinkModal(true)}
              onRemoveAttachment={handleRemoveAttachment}
              hideUploadButtons={true}
            />

            {/* Task Checklist Section */}
            <TaskChecklistSection
              checklist={checklist}
              completionPercentage={manualCompletionPercentage}
              subCards={card.sub_cards}
              columns={columns}
              cardColumnId={card.column_id}
              cardId={card.id}
              allBoardCards={allBoardCards}
              onToggleItem={handleToggleChecklistItem}
              onAddItem={handleAddChecklistItem}
              onDeleteItem={handleDeleteChecklistItem}
              onReorderChecklist={handleReorderChecklist}
              onManualCompletionChange={handleManualCompletionChange}
              canEdit={canEditCard}
            />

            {/* Sub-Cards Breakdown List */}
            <CardSubtasksList
              card={card}
              allBoardCards={allBoardCards}
              columns={columns}
              safeBoardPhases={safeBoardPhases}
              canEditCard={canEditCard}
              onNavigateToSubtask={onNavigateToSubtask}
              onShowToast={onShowToast}
            />

            {/* Target Dates & Risk Badges Section */}
            {showDateSection && (() => {
              const todayMs = new Date().setHours(0, 0, 0, 0);
              const dueMs = card.activity_end_date ? new Date(card.activity_end_date).getTime() : 0;
              const cardCol = (columns || []).find((c) => c.id === card.column_id);
              const isCardDone = (card.completion_percentage || 0) >= 100 || (cardCol ? (
                cardCol.status_type === "completed" ||
                cardCol.title.toLowerCase().includes("done") ||
                cardCol.title.toLowerCase().includes("completed")
              ) : false);
              const isOverdue = !isCardDone && dueMs > 0 && dueMs < todayMs;
              const isDueSoon = !isCardDone && !isOverdue && dueMs > 0 && (dueMs - todayMs) <= 86400000;

              return (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-800/40 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-text-primary font-bold uppercase tracking-wider flex-wrap">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>
                      {boardType === "roadmap" ? "Milestone Schedule" : "Event Schedule"}
                    </span>
                    {card.activity_date && card.activity_end_date && card.activity_date === card.activity_end_date && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/60 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <span>◆</span>
                        <span>Milestone</span>
                      </span>
                    )}
                    {isOverdue && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/70 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs animate-pulse">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        Overdue Task
                      </span>
                    )}
                    {isDueSoon && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/70 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Approaching Deadline
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-semibold text-text-primary flex-wrap">
                    {card.activity_date && (
                      <span className="px-2.5 py-1 rounded-lg bg-surface-800 border border-border/60">
                        Start: <strong className="text-cyan-400">{formatDate(card.activity_date)}</strong>
                      </span>
                    )}
                    {card.activity_end_date && (
                      <span className="px-2.5 py-1 rounded-lg bg-surface-800 border border-border/60">
                        Deadline: <strong className="text-rose-300">{formatDate(card.activity_end_date)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Task Dependencies Section: Blocked By (Predecessors) & Blocks (Dependents) */}
            {(() => {
              const predIds = card.predecessor_ids && card.predecessor_ids.length > 0
                ? card.predecessor_ids
                : card.predecessor_id
                ? [card.predecessor_id]
                : [];

              const predecessorCards = allBoardCards.filter((c) => predIds.includes(c.id));
              const dependentCards = allBoardCards.filter(
                (c) =>
                  !c.is_archived &&
                  ((c.predecessor_ids && c.predecessor_ids.includes(card.id)) || c.predecessor_id === card.id)
              );

              if (predecessorCards.length === 0 && dependentCards.length === 0 && !canEditCard) return null;

              return (
                <div className="p-4 rounded-2xl bg-surface-900/80 border border-border/80 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Task Dependencies & Relationships</span>
                    </h4>
                    {canEditCard && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        Edit Links
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Blocked By (Predecessor Tasks) */}
                    <div className="p-3 rounded-xl bg-surface-800/60 border border-border/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Blocked By ({predecessorCards.length})</span>
                        </span>
                      </div>
                      {predecessorCards.length === 0 ? (
                        <p className="text-[11px] text-text-muted italic">No predecessor blockers</p>
                      ) : (
                        <div className="space-y-1.5">
                          {predecessorCards.map((pred) => (
                            <div
                              key={`detail-pred-${pred.id}`}
                              onClick={() => {
                                onClose();
                                setTimeout(() => {
                                  if (onNavigateToSubtask) onNavigateToSubtask(pred);
                                }, 100);
                              }}
                              className="p-2 rounded-lg bg-surface-900 border border-border/60 flex items-center justify-between gap-2 hover:border-cyan-500/50 cursor-pointer transition-all group"
                            >
                              <span className="font-semibold text-text-primary group-hover:text-cyan-400 truncate">
                                {pred.title}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-800 text-[9px] font-bold text-text-muted">
                                #{pred.id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Blocks (Dependent Tasks) */}
                    <div className="p-3 rounded-xl bg-surface-800/60 border border-border/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Blocks ({dependentCards.length})</span>
                        </span>
                      </div>
                      {dependentCards.length === 0 ? (
                        <p className="text-[11px] text-text-muted italic">No dependent tasks blocked by this card</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dependentCards.map((dep) => (
                            <div
                              key={`detail-dep-${dep.id}`}
                              onClick={() => {
                                onClose();
                                setTimeout(() => {
                                  if (onNavigateToSubtask) onNavigateToSubtask(dep);
                                }, 100);
                              }}
                              className="p-2 rounded-lg bg-surface-900 border border-border/60 flex items-center justify-between gap-2 hover:border-cyan-500/50 cursor-pointer transition-all group"
                            >
                              <span className="font-semibold text-text-primary group-hover:text-cyan-400 truncate">
                                {dep.title}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-800 text-[9px] font-bold text-text-muted">
                                #{dep.id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Voting Section */}
            <CardVotingSection
              card={card}
              boardVisibility={boardVisibility}
              boardType={boardType}
              onVoteToggle={onVoteToggle}
            />

            {/* Danger Zone: Delete Card */}
            {canDeleteCard && (
              <div className="pt-5 border-t border-border/60">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-error/10 border border-error/25 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="text-center sm:text-left space-y-0.5">
                    <h5 className="text-xs font-extrabold text-error flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-error" />
                      <span>Danger Zone</span>
                    </h5>
                    <p className="text-[11px] text-text-muted">
                      Permanently delete this task card and all of its comments & attachments.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteCard(card.id)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-error text-white font-extrabold text-xs hover:bg-error-light transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-error/20 active:scale-98"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Card</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tabbed Side Panel (Desktop only - mobile uses responsive BottomSheet tabs) */}
          {!isMobile && (
            <div className="flex-shrink-0 flex">
              <CardDetailSidePanel
                card={card}
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
                cardUserId={card.user_id}
                cardAssignedUsers={card.assigned_users}
                isAdmin={isAdmin}
                canEditCard={canEditCard}
                onSubmitComment={handleSubmitComment}
                onDeleteComment={onDeleteComment}
                activities={activities}
                formatDateTime={formatDateTime}
                isUploadingImage={isUploadingImage}
                uploadStatusText={uploadStatusText}
                activeCarouselIndex={activeCarouselIndex}
                setActiveCarouselIndex={setActiveCarouselIndex}
                setFullscreenImageIndex={setFullscreenImageIndex}
                copiedAttachmentId={copiedAttachmentId}
                setCopiedAttachmentId={setCopiedAttachmentId}
                checklist={checklist}
                onToggleChecklistItem={handleToggleChecklistItem}
                progressComments={progressComments}
                onAddComment={onAddComment}
                onImageUpload={handleImageUpload}
                onShowAddLinkModal={() => setShowAddLinkModal(true)}
                onRemoveAttachment={handleRemoveAttachment}
              />
            </div>
          )}
        </div>
      )}

      {/* Completion Move Confirmation Modal */}
      {pendingCompletionModal && (
        <CompletionConfirmModal
          cardTitle={card.title}
          targetColumnTitle={pendingCompletionModal.targetColumnTitle}
          onCancel={handleCancelCompletionMove}
          onConfirm={handleConfirmCompletionMove}
        />
      )}
    </div>
  );

  if (isMobile) {
    const mobileEditFooter = isEditing && !showAuditLog ? (
      <div className="flex items-center justify-end gap-3 w-full">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="flex-1 py-3 px-4 rounded-xl border border-border text-text-muted hover:text-text-primary text-sm font-semibold hover:bg-surface-800 transition-all cursor-pointer text-center active:scale-98"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveCardEdits}
          disabled={!editTitle.trim() || isSavingEdit}
          className="flex-1 py-3 px-5 rounded-xl bg-primary text-surface-950 text-sm font-extrabold hover:bg-primary-light flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer transition-all disabled:opacity-50 active:scale-98"
        >
          <Check className="w-4 h-4" />
          <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>
    ) : undefined;

    const completionRate = card.completion_percentage || 0;
    const attachmentsCount = (card.attachments || []).length;

    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title={card.title}
        initialSnap="3/4"
        footer={mobileEditFooter}
      >
        <div className="space-y-3.5">
          {/* Top Control Bar: Edit Card Button & Back Button */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
            {mobileTab !== "details" ? (
              <button
                type="button"
                onClick={() => setMobileTab("details")}
                className="py-1.5 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Task Details</span>
              </button>
            ) : (
              <span className="text-xs font-extrabold text-text-muted uppercase tracking-wider">
                Task Workspace
              </span>
            )}

            {canEditCard && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                  isEditing
                    ? "bg-cyan-500 text-surface-950 border-cyan-400 shadow-md"
                    : "bg-surface-800 border-border text-text-primary hover:bg-surface-750"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "View Details" : "Edit Card"}</span>
              </button>
            )}
          </div>

          {/* Responsive Mobile / Tablet Tab Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/60">
            <button
              type="button"
              onClick={() => setMobileTab("details")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                mobileTab === "details"
                  ? "bg-primary text-surface-950 shadow-xs"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("activity")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                mobileTab === "activity"
                  ? "bg-cyan-500 text-surface-950 shadow-xs"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Activity ({comments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("progress")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                mobileTab === "progress"
                  ? "bg-cyan-500 text-surface-950 shadow-xs"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Progress ({completionRate}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("audit_logs")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                mobileTab === "audit_logs"
                  ? "bg-cyan-500 text-surface-950 shadow-xs"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit ({activities.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("tools")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                mobileTab === "tools"
                  ? "bg-cyan-500 text-surface-950 shadow-xs"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Tools ({attachmentsCount})</span>
            </button>
          </div>

          {/* Active Tab View */}
          {mobileTab === "details" && modalBody}

          {mobileTab === "activity" && (
            <div className="min-h-[350px]">
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
                cardUserId={card.user_id}
                cardAssignedUsers={card.assigned_users}
                isAdmin={isAdmin}
                onSubmitComment={handleSubmitComment}
                onDeleteComment={onDeleteComment}
              />
            </div>
          )}

          {mobileTab === "progress" && (
            <CardProgressNotesSection
              cardId={card.id}
              completionPercentage={completionRate}
              assignedUsers={card.assigned_users || []}
              currentUserId={currentUserId}
              boardHostId={boardHostId}
              cardUserId={card.user_id}
              isAdmin={isAdmin}
              checklist={checklist}
              onToggleChecklistItem={handleToggleChecklistItem}
              progressComments={progressComments}
              onAddComment={onAddComment}
            />
          )}

          {mobileTab === "audit_logs" && auditLogSidepanel}

          {mobileTab === "tools" && (
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
              onImageUpload={handleImageUpload}
              onShowAddLinkModal={() => setShowAddLinkModal(true)}
              onRemoveAttachment={handleRemoveAttachment}
            />
          )}
        </div>
      </BottomSheet>
    );
  }

  const currentColumn = columns.find((col) => col.id === card.column_id);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border/80 rounded-2xl w-full max-w-[1240px] h-[88vh] shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
        {/* ClickUp Inspired Header & Property Bar */}
        <div
          className="p-3 sm:p-4 border-b border-border/60 flex flex-col gap-2 bg-surface-900/90 flex-shrink-0"
          style={{
            borderTopColor: card.color_tag || undefined,
            borderTopWidth: card.color_tag ? "3px" : undefined,
          }}
        >
          {/* Top Bar Actions & Breadcrumb */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted">
              <span className="px-1.5 py-0.5 rounded-md bg-surface-800 border border-border/60 text-text-primary text-[10px]">
                Task
              </span>
              <span>/</span>
              <span>{currentColumn?.title || "Board Task"}</span>
              {card.phase && (
                <>
                  <span>/</span>
                  <span className="text-cyan-400">⚡ {card.phase}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Column-Based Edit Button */}
              {canEditCard && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isEditing
                      ? "bg-cyan-500 text-surface-950 font-extrabold"
                      : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
                  }`}
                  title="Edit Card Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{isEditing ? "View Details" : "Edit"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title Row */}
          <h2 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
            {card.title}
          </h2>

          {/* ClickUp-style Property Specs Grid */}
          <div className="p-2.5 rounded-xl bg-surface-800/40 border border-border/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
            {/* Status / Column */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Status</span>
              <span className="px-2.5 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 font-extrabold truncate w-fit shadow-2xs">
                {currentColumn?.title || "TO DO"}
              </span>
            </div>

            {/* Assignees */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Assignees</span>
              {card.assigned_users && card.assigned_users.length > 0 ? (
                <div className="flex items-center gap-1 truncate">
                  {card.assigned_users.slice(0, 2).map((u) => (
                    <img
                      key={`hdr-assignee-${u.id}`}
                      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                      alt={u.first_name}
                      className="w-5 h-5 rounded-full object-cover border border-border shadow-xs"
                      title={`${u.first_name} ${u.last_name}`}
                    />
                  ))}
                  <span className="font-bold text-text-primary text-xs truncate">
                    {card.assigned_users[0].first_name}
                    {card.assigned_users.length > 1 ? ` +${card.assigned_users.length - 1}` : ""}
                  </span>
                </div>
              ) : (
                <span className="text-text-muted italic">Unassigned</span>
              )}
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Priority</span>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wider uppercase border w-fit shadow-2xs ${
                  card.priority === "high"
                    ? "bg-rose-950/90 text-rose-300 border-rose-500/60"
                    : card.priority === "low"
                    ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                    : "bg-amber-950/90 text-amber-300 border-amber-500/60"
                }`}
              >
                {card.priority || "medium"}
              </span>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Start Date</span>
              <div className="flex items-center gap-1 text-text-primary font-bold">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">
                  {card.activity_date ? formatDate(card.activity_date) : "No Start"}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Deadline</span>
              <div className="flex items-center gap-1 text-text-primary font-bold">
                <Calendar className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">
                  {card.activity_end_date ? formatDate(card.activity_end_date) : (card.activity_date ? formatDate(card.activity_date) : "No Deadline")}
                </span>
              </div>
            </div>

            {/* Tag / Phase */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Category Tag</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs" style={{ backgroundColor: card.color_tag || "#06b6d4" }} />
                <span className="font-bold text-text-primary truncate">
                  {card.phase || "General Task"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Main Body Layout */}
        <div className="flex-1 flex overflow-hidden">{modalBody}</div>
      </div>

      {/* Modal to Add External Link */}
      {showAddLinkModal && (
        <div className="fixed inset-0 z-[10000] bg-surface-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-border rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Add File or External Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLinkModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  File or Resource URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    if (!linkTitle) {
                      const detected = detectAttachmentProvider(e.target.value);
                      if (detected && detected !== "general") {
                        setLinkTitle(detected.replace("_", " ").toUpperCase() + " File");
                      }
                    }
                  }}
                  placeholder="https://drive.google.com/file/d/..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-text-muted/80 mt-1">
                  Supports Google Drive, Dropbox, OneDrive, Figma, GitHub, or any file hosting URL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Title / Label (Optional)
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. Project Specs - Google Drive"
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowAddLinkModal(false)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!linkUrl.trim()}
                onClick={handleAddLinkSubmit}
                className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Image Viewer */}
      {(() => {
        const imageAttachments = (card.attachments || []).filter((att) => att.type === "image");
        if (fullscreenImageIndex === null || !imageAttachments[fullscreenImageIndex]) return null;

        const currentImg = imageAttachments[fullscreenImageIndex];

        return (
          <div className="fixed inset-0 z-[10000] bg-surface-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between text-text-primary z-20">
              <div className="flex items-center gap-3 min-w-0">
                <ImageIcon className="w-5 h-5 text-primary" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-primary truncate">
                    {currentImg.title}
                  </h3>
                  <span className="text-xs text-text-muted">
                    {fullscreenImageIndex + 1} of {imageAttachments.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={currentImg.url}
                  target="_blank"
                  download
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-border text-text-muted hover:text-text-primary transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => setFullscreenImageIndex(null)}
                  className="p-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-border text-text-muted hover:text-text-primary transition-all cursor-pointer"
                  title="Close Fullscreen Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center Image Display */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <img
                src={currentImg.url}
                alt={currentImg.title}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
              />

              {/* Navigation Arrows */}
              {imageAttachments.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenImageIndex((prev) =>
                        prev !== null ? (prev > 0 ? prev - 1 : imageAttachments.length - 1) : 0
                      )
                    }
                    className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface-900/90 text-text-primary border border-border hover:bg-surface-800 hover:scale-110 transition-all cursor-pointer shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenImageIndex((prev) =>
                        prev !== null ? (prev < imageAttachments.length - 1 ? prev + 1 : 0) : 0
                      )
                    }
                    className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface-900/90 text-text-primary border border-border hover:bg-surface-800 hover:scale-110 transition-all cursor-pointer shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Thumbnails Strip */}
            {imageAttachments.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-20">
                {imageAttachments.map((imgAtt, idx) => (
                  <button
                    key={`lightbox-thumb-${imgAtt.id}`}
                    type="button"
                    onClick={() => setFullscreenImageIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      fullscreenImageIndex === idx
                        ? "border-primary ring-2 ring-primary/50 scale-110"
                        : "border-border/60 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={imgAtt.url} alt={imgAtt.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
