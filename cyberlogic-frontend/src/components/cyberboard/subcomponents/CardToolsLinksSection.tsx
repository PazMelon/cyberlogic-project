import React from "react";
import CardAttachmentsPanel from "./CardAttachmentsPanel";

interface CardToolsLinksSectionProps {
  card: any;
  canEditCard: boolean;
  isUploadingImage: boolean;
  uploadStatusText: string;
  activeCarouselIndex: number;
  setActiveCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
  setFullscreenImageIndex: (idx: number | null) => void;
  copiedAttachmentId: string | null;
  setCopiedAttachmentId: (id: string | null) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowAddLinkModal: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  hideUploadButtons?: boolean;
}

export const CardToolsLinksSection: React.FC<CardToolsLinksSectionProps> = ({
  card,
  canEditCard,
  isUploadingImage,
  uploadStatusText,
  activeCarouselIndex,
  setActiveCarouselIndex,
  setFullscreenImageIndex,
  copiedAttachmentId,
  setCopiedAttachmentId,
  onImageUpload,
  onShowAddLinkModal,
  onRemoveAttachment,
  hideUploadButtons = false,
}) => {
  return (
    <div className="p-3 sm:p-4">
      {/* Clean Unified Tools & Links Panel */}
      <CardAttachmentsPanel
        attachments={card.attachments || []}
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
        hideUploadButtons={hideUploadButtons}
      />
    </div>
  );
};

export default CardToolsLinksSection;
