import type { ContentSection, ImageTemplate } from "../../data/mockData";

interface BlogContentRendererProps {
  content: string | ContentSection[];
}

/**
 * 1. Template Layout Renderer for Images
 */
function ImageTemplateGrid({ template, images }: { template: ImageTemplate; images: { url: string; alt: string }[] }) {
  if (!images || images.length === 0) return null;

  // Smart image seed parser to support easy Dicebear/Unsplash mockup triggers
  const resolveUrl = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60&sig=${encodeURIComponent(url)}`;
  };

  switch (template) {
    case "single":
      return (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 shadow-md group">
          <img
            src={resolveUrl(images[0]?.url)}
            alt={images[0]?.alt || "Visual content"}
            className="w-full max-h-[480px] object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      );

    case "side-by-side":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.slice(0, 2).map((img, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group h-[260px]">
              <img
                src={resolveUrl(img.url)}
                alt={img.alt || `Side image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      );

    case "bento-3":
      return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main big block */}
          <div className="md:col-span-8 md:row-span-2 relative overflow-hidden rounded-2xl border border-border/80 shadow-md group h-[340px]">
            <img
              src={resolveUrl(images[0]?.url)}
              alt={images[0]?.alt || "Bento main"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          {/* Top small stack */}
          <div className="md:col-span-4 relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group h-[162px]">
            <img
              src={resolveUrl(images[1]?.url)}
              alt={images[1]?.alt || "Bento secondary"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          {/* Bottom small stack */}
          <div className="md:col-span-4 relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group h-[162px]">
            <img
              src={resolveUrl(images[2]?.url)}
              alt={images[2]?.alt || "Bento tertiary"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      );

    case "bento-4":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group h-[220px]">
              <img
                src={resolveUrl(img.url)}
                alt={img.alt || `Grid image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      );

    case "bento-6":
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.slice(0, 6).map((img, idx) => {
            const spanClass = (idx === 0 || idx === 5) ? "col-span-2 row-span-1" : "col-span-1";
            return (
              <div key={idx} className={`relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group h-[150px] ${spanClass}`}>
                <img
                  src={resolveUrl(img.url)}
                  alt={img.alt || `Gallery image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            );
          })}
        </div>
      );

    case "banner":
      return (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 shadow-md group h-[220px]">
          <img
            src={resolveUrl(images[0]?.url)}
            alt={images[0]?.alt || "Cinematic banner"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      );

    default:
      return null;
  }
}

/**
 * 2. Main Content Renderer Page Parser
 */
export default function BlogContentRenderer({ content }: BlogContentRendererProps) {
  let sections: ContentSection[] = [];

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        sections = parsed;
      }
    } catch {
      // Treat plain-text string as a fallback text block
      sections = [{ type: "text", id: "fallback-id", html: content }];
    }
  } else if (Array.isArray(content)) {
    sections = content;
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        switch (section.type) {
          case "text":
            return (
              <div key={section.id} className="space-y-3">
                {section.title && (
                  <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
                    {section.title}
                  </h3>
                )}
                {section.subtitle && (
                  <p className="text-sm text-text-muted italic -mt-1 pl-1">
                    {section.subtitle}
                  </p>
                )}
                {section.html && (
                  <div
                    className="text-sm text-text-secondary leading-relaxed space-y-2 prose prose-invert max-w-none
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                      [&_li]:my-0.5
                      [&_b]:font-bold [&_strong]:font-bold
                      [&_i]:italic [&_em]:italic
                      [&_p]:my-1
                    "
                    dangerouslySetInnerHTML={{ __html: section.html }}
                  />
                )}
              </div>
            );

          case "image":
            return (
              <div key={section.id} className="space-y-2">
                <ImageTemplateGrid template={section.template} images={section.images} />
                {section.caption && (
                  <p className="text-[11px] text-text-muted text-center italic">
                    {section.caption}
                  </p>
                )}
              </div>
            );

          case "quote":
            return (
              <div key={section.id} className="relative py-4 pl-5 border-l-3 border-primary bg-surface-900/10 rounded-r-xl">
                <p className="text-sm font-medium text-text-secondary italic leading-relaxed">
                  "{section.text}"
                </p>
                {section.attribution && (
                  <p className="text-xs text-text-muted mt-1.5 font-semibold">
                    — {section.attribution}
                  </p>
                )}
              </div>
            );

          case "divider":
            return (
              <div key={section.id} className="py-4 flex items-center justify-center">
                <div className="w-full border-t border-dashed border-primary/20" />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
