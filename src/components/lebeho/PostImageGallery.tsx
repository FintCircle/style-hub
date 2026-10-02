import { useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const PREVIEW_IMAGE_LIMIT = 4;

type PostImageGalleryProps = {
  images: string[];
  author: string;
};

/**
 * A compact social-style photo preview with a viewer that always includes the
 * complete image set. The preview intentionally stops at four images so a post
 * with a large upload does not dominate the feed.
 */
export function PostImageGallery({ images, author }: PostImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visibleImages = images.slice(0, PREVIEW_IMAGE_LIMIT);
  const imageCount = images.length;

  if (!imageCount) return null;

  const moveTo = (nextIndex: number) => {
    setActiveIndex(Math.max(0, Math.min(nextIndex, imageCount - 1)));
  };

  const previewLayout =
    imageCount === 1
      ? "block"
      : imageCount === 2
        ? "grid grid-cols-2 gap-1"
        : imageCount === 3
          ? "grid h-[min(26rem,78vw)] grid-cols-2 grid-rows-2 gap-1"
          : "grid aspect-square grid-cols-2 grid-rows-2 gap-1";

  return (
    <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
      <div className={`mt-5 overflow-hidden rounded-sm ${previewLayout}`}>
        {visibleImages.map((image, index) => {
          const isSingleImage = imageCount === 1;
          const isThreeImageLead = imageCount === 3 && index === 0;
          const remainingImages = imageCount - PREVIEW_IMAGE_LIMIT;

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group relative min-h-0 overflow-hidden text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                isThreeImageLead ? "row-span-2" : ""
              }`}
              aria-label={`Open image ${index + 1} of ${imageCount} from ${author}'s post`}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                className={
                  isSingleImage
                    ? "block h-auto w-full"
                    : "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                }
              />
              {index === visibleImages.length - 1 && remainingImages > 0 && (
                <span className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-medium text-white">
                  +{remainingImages}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeIndex !== null && (
        <DialogContent className="fixed inset-0 grid h-screen max-w-none translate-x-0 translate-y-0 place-items-center border-0 bg-black/95 p-4 text-white shadow-none sm:rounded-none">
          <DialogTitle className="sr-only">Images from {author}'s post</DialogTitle>
          <DialogDescription className="sr-only">
            Image {activeIndex + 1} of {imageCount}. Swipe left or right to browse on touch devices.
          </DialogDescription>
          <ImageViewer
            image={images[activeIndex]}
            index={activeIndex}
            imageCount={imageCount}
            onPrevious={() => moveTo(activeIndex - 1)}
            onNext={() => moveTo(activeIndex + 1)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

type ImageViewerProps = {
  image: string;
  index: number;
  imageCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

function ImageViewer({ image, index, imageCount, onPrevious, onNext }: ImageViewerProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const hasPrevious = index > 0;
  const hasNext = index < imageCount - 1;

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const horizontalDistance = event.clientX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(horizontalDistance) < 40) return;
    if (horizontalDistance < 0 && hasNext) onNext();
    if (horizontalDistance > 0 && hasPrevious) onPrevious();
  };

  return (
    <div
      className="grid h-full w-full select-none place-items-center"
      onPointerDown={(event) => event.pointerType !== "mouse" && setTouchStartX(event.clientX)}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setTouchStartX(null)}
    >
      <img
        src={image}
        alt={`Image ${index + 1} from ${imageCount}`}
        className="max-h-[calc(100vh-2rem)] max-w-full object-contain"
      />
      {imageCount > 1 && (
        <>
          <p className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {index + 1} / {imageCount}
          </p>
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="absolute left-5 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:invisible sm:block"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:invisible sm:block"
            aria-label="Next image"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </div>
  );
}
