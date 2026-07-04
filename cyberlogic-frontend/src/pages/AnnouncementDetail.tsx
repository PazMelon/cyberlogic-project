import { useState } from "react";
import { useParams, Link, useLocation } from "react-router";
import { ChevronLeft, Calendar, User, Pin, ArrowRight, ArrowLeft } from "lucide-react";
import { announcements } from "../data/mockData";

/**
 * 1. Single Image Layout Component
 */
function SingleImageBlock({ image }: { image: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 shadow-lg group">
      <div className="absolute inset-0 bg-gradient-to-t from-surface-950/40 via-transparent to-transparent opacity-60 z-10" />
      <img
        src={image}
        alt="Blog Content"
        className="w-full max-h-[460px] object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

/**
 * 2. Carousel Layout Component
 */
function CarouselBlock({ images }: { images: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) return null;

  const nextSlide = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 shadow-lg bg-surface-900">
      {/* Slides */}
      <div className="relative h-[320px] sm:h-[400px]">
        <img
          src={images[activeIdx]}
          alt={`Slide ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/65 to-transparent z-10" />
      </div>

      {/* Nav Controls */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface-950/60 border border-border/40 hover:bg-surface-950 hover:border-primary/50 text-text-primary transition-all flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface-950/60 border border-border/40 hover:bg-surface-950 hover:border-primary/50 text-text-primary transition-all flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activeIdx === idx ? "bg-primary scale-110" : "bg-text-muted/50 hover:bg-text-secondary"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 3. Bento Grid Layout Component
 */
function BentoGridBlock({ images }: { images: string[] }) {
  if (!images || images.length < 3) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Large Featured Card */}
      <div className="md:col-span-8 md:row-span-2 relative overflow-hidden rounded-2xl border border-border/80 shadow-md group h-[340px]">
        <img
          src={images[0]}
          alt="Bento Feature"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-surface-950/20 group-hover:bg-transparent transition-colors" />
      </div>

      {/* Top Right Card */}
      <div className="md:col-span-4 relative overflow-hidden rounded-2xl border border-border/80 shadow-md group h-[162px]">
        <img
          src={images[1]}
          alt="Bento Secondary 1"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Bottom Right Card */}
      <div className="md:col-span-4 relative overflow-hidden rounded-2xl border border-border/80 shadow-md group h-[162px]">
        <img
          src={images[2]}
          alt="Bento Secondary 2"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
}

/**
 * 4. Masonry Grid Layout Component
 */
function MasonryBlock({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;

  // Distribute images in 2 columns
  const col1 = images.filter((_, idx) => idx % 2 === 0);
  const col2 = images.filter((_, idx) => idx % 2 !== 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      <div className="grid gap-4">
        {col1.map((img, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group">
            <img
              src={img}
              alt={`Masonry Col 1 - ${idx}`}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
      <div className="grid gap-4">
        {col2.map((img, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-2xl border border-border/80 shadow-sm group">
            <img
              src={img}
              alt={`Masonry Col 2 - ${idx}`}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. Split Column Block Component
 */
function SplitBlock({ images, body }: { images: string[]; body?: string }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="text-sm text-text-secondary leading-relaxed space-y-4">
        {body && <p>{body}</p>}
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border/80 shadow-md group h-[280px]">
        <img
          src={images[0]}
          alt="Split Visual"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
}

/**
 * 6. Showcase Block Component
 */
function ShowcaseBlock({ images }: { images: string[] }) {
  const [featuredIdx, setFeaturedIdx] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Featured Big View */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 shadow-lg h-[340px] bg-surface-900">
        <img
          src={images[featuredIdx]}
          alt="Showcase Featured"
          className="w-full h-full object-cover transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/40 to-transparent" />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setFeaturedIdx(idx)}
              className={`w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                featuredIdx === idx ? "border-primary scale-95" : "border-border/60 hover:border-text-muted"
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MAIN ANNOUNCEMENT DETAIL VIEW PAGE
 */
export default function AnnouncementDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const item = announcements.find((a) => a.id === Number(id));

  if (!item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-primary">Announcement Not Found</h2>
        <Link
          to={isPortal ? "/app/announcements" : "/announcements"}
          className="text-primary hover:underline text-sm mt-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to list
        </Link>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    General: "bg-info/10 text-info border-info/20",
    Academic: "bg-success/10 text-success border-success/20",
    Events: "bg-accent/10 text-accent border-accent/20",
  };

  return (
    <div className={isPortal ? "pb-12" : "pt-24 pb-16"}>
      <div className={isPortal ? "max-w-4xl" : "max-w-4xl mx-auto px-4 sm:px-6"}>
        
        {/* Back navigation */}
        <Link
          to={isPortal ? "/app/announcements" : "/announcements"}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Announcements
        </Link>

        {/* Hero Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryColors[item.category]}`}>
              {item.category}
            </span>
            {item.pinned && (
              <span className="inline-flex items-center gap-1 text-xs text-warning font-semibold">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
            {item.title}
          </h1>

          {item.subtitle && (
            <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-light">
              {item.subtitle}
            </p>
          )}

          {/* Author Card & Date info */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/60">
            <img
              src={item.authorAvatar}
              alt={item.author}
              className="w-10 h-10 rounded-full bg-surface-700 border border-border/80 object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-text-muted" /> {item.author}
              </p>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> Published on {item.date}
              </p>
            </div>
          </div>
        </div>

        {/* Blog Post Content Body */}
        <div className="space-y-10">
          
          {/* Main intro content */}
          {item.content && (
            <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
              {item.content}
            </p>
          )}

          {/* Dynamically Render Rich Media Sections */}
          {item.sections && item.sections.length > 0 ? (
            item.sections.map((section) => (
              <div key={section.id} className="space-y-4 pt-6 border-t border-border/30 animate-fadeIn">
                {section.heading && (
                  <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
                    {section.heading}
                  </h3>
                )}

                {/* Body paragraph if layout is NOT split (split layout merges text body on side of image) */}
                {section.body && section.layout !== "split" && (
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                )}

                {/* Templates layout selectors */}
                {section.images && section.images.length > 0 && (
                  <div className="mt-4">
                    {section.layout === "single" && (
                      <SingleImageBlock image={section.images[0]} />
                    )}
                    {section.layout === "carousel" && (
                      <CarouselBlock images={section.images} />
                    )}
                    {section.layout === "bento" && (
                      <BentoGridBlock images={section.images} />
                    )}
                    {section.layout === "masonry" && (
                      <MasonryBlock images={section.images} />
                    )}
                    {section.layout === "split" && (
                      <SplitBlock images={section.images} body={section.body} />
                    )}
                    {section.layout === "showcase" && (
                      <ShowcaseBlock images={section.images} />
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-text-muted py-6">
              No further sections provided.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
