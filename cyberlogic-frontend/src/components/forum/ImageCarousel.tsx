import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  onImageClick: (index: number) => void;
}

export function ImageCarousel({ images, onImageClick }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative group w-full h-[260px] sm:h-[400px] rounded-2xl overflow-hidden bg-black/40 border border-border/20 shadow-2xl flex items-center justify-center my-4">
      {/* Slider Images */}
      <div 
        className="w-full h-full cursor-pointer relative overflow-hidden flex items-center justify-center"
        onClick={() => onImageClick(currentIndex)}
      >
        <img
          src={images[currentIndex]}
          alt={`Thread gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none transition-all duration-500 scale-98 group-hover:scale-100"
        />

        {/* Cyber Zoom Button */}
        <div className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Maximize2 className="w-4 h-4 text-white" />
        </div>

        {/* Glass Counter badge */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 px-2.5 py-1 text-[10px] font-bold tracking-widest bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-white">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Navigation Chevrons */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/75 hover:text-white hover:bg-black/80 hover:border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/75 hover:text-white hover:bg-black/80 hover:border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-primary w-4" : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
