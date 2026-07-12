import React, { useState } from "react";
import { Link } from "react-router";
import { ChevronLeft } from "lucide-react";
import BlogContentRenderer, { resolveCmsUrl } from "./BlogContentRenderer";
import { FullscreenImageViewer } from "../forum/FullscreenImageViewer";

export interface DetailLayoutProps {
  isPortal: boolean;
  backLink: { to: string; label: string };
  badges?: React.ReactNode;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  introText?: string;
  sections?: any;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  portalPrimaryAction?: React.ReactNode;
  showSidebarOnPublic?: boolean;
  fullWidthHeaderPublic?: boolean;
  publicSidebar?: React.ReactNode;
  publicHeaderExtra?: React.ReactNode;
  publicContainerClass?: string;

  // Loading and Error states
  loading?: boolean;
  loadingText?: string;
  error?: string | null;
  errorTitle?: string;
  errorBackLink?: { to: string; label: string };
}

export default function DetailLayout({
  isPortal,
  backLink,
  badges,
  title,
  subtitle,
  image,
  introText,
  sections,
  sidebar,
  footer,
  portalPrimaryAction,
  showSidebarOnPublic = false,
  fullWidthHeaderPublic = false,
  publicSidebar,
  publicHeaderExtra,
  publicContainerClass = "max-w-4xl mx-auto px-4 sm:px-6 space-y-6",
  loading = false,
  loadingText,
  error = null,
  errorTitle,
  errorBackLink,
}: DetailLayoutProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">{loadingText || "Retrieving details..."}</p>
      </div>
    );
  }

  const defaultErrorBackLink = errorBackLink || backLink;

  if (error || !title) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-primary">{errorTitle || "Details Not Found"}</h2>
        <p className="text-xs text-text-muted mt-1">{error || "The requested item could not be found."}</p>
        <Link
          to={defaultErrorBackLink.to}
          className="text-primary hover:underline text-sm mt-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> {defaultErrorBackLink.label}
        </Link>
      </div>
    );
  }

  // Gather all images for fullscreen image viewer
  const allImages: string[] = [];
  if (image) {
    allImages.push(resolveCmsUrl(image));
  }
  if (sections) {
    let sectionsArr: any[] = [];
    if (typeof sections === "string") {
      try {
        sectionsArr = JSON.parse(sections);
      } catch {}
    } else if (Array.isArray(sections)) {
      sectionsArr = sections;
    }
    sectionsArr.forEach((sec: any) => {
      if (sec.type === "image" && sec.images) {
        sec.images.forEach((img: any) => {
          if (img.url) {
            allImages.push(resolveCmsUrl(img.url));
          }
        });
      }
    });
  }

  const handleImageClick = (url: string) => {
    const idx = allImages.indexOf(url);
    if (idx !== -1) {
      setActiveImageIndex(idx);
      setIsViewerOpen(true);
    }
  };

  const hasSections = sections && (Array.isArray(sections) ? sections.length > 0 : typeof sections === "string" && sections.trim().length > 0);

  if (isPortal) {
    return (
      <div className="pb-12 w-full max-w-6xl mx-auto space-y-6">
        {/* Back navigation */}
        <Link
          to={backLink.to}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> {backLink.label}
        </Link>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column: Title, cover image, and body content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header / Title block */}
            <div className="glass rounded-2xl p-6 border border-border space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {badges}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base sm:text-lg text-text-muted leading-relaxed font-light">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Cover Image banner */}
            {image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border max-h-[400px]">
                <img
                  src={resolveCmsUrl(image)}
                  alt={title}
                  onClick={() => handleImageClick(resolveCmsUrl(image))}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </div>
            )}

            {/* Portal Primary Action */}
            {portalPrimaryAction}

            {/* Content Body */}
            <div className="glass rounded-2xl p-6 border border-border space-y-6">
              {introText && (
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
                  {introText}
                </p>
              )}

              {hasSections ? (
                <div className={`pt-6 ${introText ? "border-t border-border/30" : ""}`}>
                  <BlogContentRenderer content={sections} onImageClick={handleImageClick} />
                </div>
              ) : (
                !introText && (
                  <div className="text-xs text-text-muted py-2 italic">
                    No further sections provided.
                  </div>
                )
              )}
            </div>

            {footer}
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="space-y-6 sticky top-20">
              {sidebar}
            </div>
          </div>
        </div>

        {allImages.length > 0 && (
          <FullscreenImageViewer
            images={allImages}
            initialIndex={activeImageIndex}
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
          />
        )}
      </div>
    );
  }

  // Public View
  const renderPublicGrid = () => {
    const leftContent = (
      <>
        <div className={showSidebarOnPublic ? "glass rounded-2xl p-6 border border-border space-y-6 animate-fadeIn" : "space-y-8 animate-fadeIn"}>
          {introText && (
            <p className={`text-base text-text-secondary leading-relaxed whitespace-pre-line pl-4 border-l-2 border-primary/20 ${showSidebarOnPublic ? "" : "font-medium"}`}>
              {introText}
            </p>
          )}

          {hasSections && (
            <div className={`pt-6 ${introText ? "border-t border-border/30" : ""}`}>
              <BlogContentRenderer content={sections} onImageClick={handleImageClick} />
            </div>
          )}

          {!introText && !hasSections && (
            <div className="text-xs text-text-muted py-6 italic">
              No further sections provided.
            </div>
          )}
        </div>
        {footer}
      </>
    );

    const rightContent = (
      <div className="space-y-6 sticky top-20">
        {publicSidebar || sidebar}
      </div>
    );

    if (fullWidthHeaderPublic) {
      return (
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="space-y-4 mb-8 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-2">
              {badges}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-light">
                {subtitle}
              </p>
            )}
            {publicHeaderExtra}
          </div>

          {/* Cover Image banner */}
          {image && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border mb-8 max-h-[400px]">
              <img
                src={resolveCmsUrl(image)}
                alt={title}
                onClick={() => handleImageClick(resolveCmsUrl(image))}
                className="w-full h-full object-cover cursor-zoom-in"
              />
            </div>
          )}

          {/* 2-Column Grid for Body Content and Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fadeIn">
            <div className="md:col-span-8 space-y-8">
              {leftContent}
            </div>
            <div className="md:col-span-4 space-y-6">
              {rightContent}
            </div>
          </div>
        </div>
      );
    }

    // Standard grid layout (where header and cover are inside the left column)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Block */}
          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {badges}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base sm:text-lg text-text-muted leading-relaxed font-light">
                {subtitle}
              </p>
            )}
            {publicHeaderExtra}
          </div>

          {/* Cover Image banner */}
          {image && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border max-h-[400px]">
              <img
                src={resolveCmsUrl(image)}
                alt={title}
                onClick={() => handleImageClick(resolveCmsUrl(image))}
                className="w-full h-full object-cover cursor-zoom-in"
              />
            </div>
          )}

          {portalPrimaryAction}

          {leftContent}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4">
          {rightContent}
        </div>
      </div>
    );
  };

  return (
    <div className={isPortal ? "pb-12" : "pt-24 pb-16"}>
      <div className={showSidebarOnPublic ? (publicContainerClass.includes("max-w-4xl") ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" : publicContainerClass) : publicContainerClass}>
        {/* Back Link */}
        <Link
          to={backLink.to}
          className={`inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors ${
            showSidebarOnPublic ? "bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border w-fit" : "mb-6"
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> {backLink.label}
        </Link>

        {showSidebarOnPublic ? (
          renderPublicGrid()
        ) : (
          <div className="space-y-6">
            {/* Hero Header */}
            <div className="space-y-4 mb-8 animate-fadeIn">
              <div className="flex flex-wrap items-center gap-2">
                {badges}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
                {title}
              </h1>

              {subtitle && (
                <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-light">
                  {subtitle}
                </p>
              )}

              {publicHeaderExtra}
            </div>

            {/* Cover Image banner */}
            {image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border mb-8 max-h-[400px]">
                <img
                  src={resolveCmsUrl(image)}
                  alt={title}
                  onClick={() => handleImageClick(resolveCmsUrl(image))}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </div>
            )}

            {/* Content Body */}
            <div className="space-y-8 animate-fadeIn">
              {introText && (
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
                  {introText}
                </p>
              )}

              {hasSections ? (
                <div className={`pt-6 ${introText ? "border-t border-border/30" : ""}`}>
                  <BlogContentRenderer content={sections} onImageClick={handleImageClick} />
                </div>
              ) : (
                !introText && (
                  <div className="text-xs text-text-muted py-6 italic">
                    No further sections provided.
                  </div>
                )
              )}

              {footer}
            </div>
          </div>
        )}

        {allImages.length > 0 && (
          <FullscreenImageViewer
            images={allImages}
            initialIndex={activeImageIndex}
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
