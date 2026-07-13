import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  onImageClick?: (index: number) => void;
  className?: string;
}

export function ImageCarousel({
  images,
  alt = "Image",
  onImageClick,
  className = "",
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div
      className={`relative group overflow-hidden rounded-xl bg-surface-800 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image display */}
      <div
        className="relative w-full aspect-video overflow-hidden cursor-pointer"
        onClick={() => onImageClick?.(currentIndex)}
      >
        <img
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300 select-none pointer-events-none"
        />

        {/* Image counter badge */}
        {images.length > 1 && (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 select-none">
            {currentIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 cursor-pointer hidden md:block"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 cursor-pointer hidden md:block"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 select-none">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => goToSlide(idx, e)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                idx === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

