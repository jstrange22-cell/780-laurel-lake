import { useEffect, useRef, useState } from "react";
import type { ManifestImage } from "~/lib/manifest";

interface Props {
  /** Curated, ordered list of interior + exterior images. */
  images: ManifestImage[];
}

/**
 * Masonry gallery with PhotoSwipe v5 lightbox. PhotoSwipe is dynamically
 * imported on first user interaction so it doesn't bloat first paint.
 *
 * The image full-size sources point to the largest available width (1920w
 * AVIF/WebP) to keep zoom legible without re-downloading originals.
 */
export default function InteriorGallery({ images }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<unknown>(null);
  const [revealedCount, setRevealedCount] = useState(() =>
    Math.min(images.length, 18),
  );

  // Lazy-load PhotoSwipe lightbox once the gallery is in view.
  useEffect(() => {
    if (!rootRef.current) return;
    let cancelled = false;

    async function init() {
      const { default: PhotoSwipeLightbox } = await import("photoswipe/lightbox");
      if (cancelled) return;
      const lightbox = new PhotoSwipeLightbox({
        gallery: rootRef.current!,
        children: "a[data-pswp]",
        pswpModule: () => import("photoswipe"),
        showHideAnimationType: "fade",
        bgOpacity: 0.96,
      });
      lightbox.init();
      lightboxRef.current = lightbox;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            void init();
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(rootRef.current);

    return () => {
      cancelled = true;
      io.disconnect();
      const lb = lightboxRef.current as { destroy?: () => void } | null;
      lb?.destroy?.();
    };
  }, []);

  // Reveal more on scroll
  useEffect(() => {
    if (revealedCount >= images.length) return;
    const sentinel = document.querySelector<HTMLElement>("[data-gallery-end]");
    if (!sentinel) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setRevealedCount((c) => Math.min(images.length, c + 18));
        }
      }
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [revealedCount, images.length]);

  const visible = images.slice(0, revealedCount);

  return (
    <div ref={rootRef} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {visible.map((img, i) => {
        // Use the 1920w source for the lightbox full-size, 1280w for the thumb.
        // Prefix with BASE_URL so deploying under a subpath (e.g. GitHub Pages
        // project URL) keeps asset paths working.
        const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
        const fullSrc = `${base}/img/property/${img.slug}-1920.webp`;
        const thumbSrc = `${base}/img/property/${img.slug}-1280.webp`;
        const tallSpan = img.orientation === "portrait" ? "row-span-2" : "";
        return (
          <a
            key={img.id}
            data-pswp
            href={fullSrc}
            data-pswp-width={img.width}
            data-pswp-height={img.height}
            className={`group relative block overflow-hidden rounded-lg bg-ink-800 ${tallSpan}`}
            style={{
              aspectRatio: tallSpan ? `${img.aspect} / 1` : `${img.aspect}`,
              gridRow: tallSpan ? "span 2" : "auto",
            }}
            aria-label={img.alt}
          >
            <picture>
              <source
                type="image/avif"
                srcSet={img.avifSrcset}
                sizes="(min-width:1024px) 25vw, 50vw"
              />
              <source
                type="image/webp"
                srcSet={img.webpSrcset}
                sizes="(min-width:1024px) 25vw, 50vw"
              />
              <img
                src={thumbSrc}
                alt={img.alt}
                width={img.width}
                height={img.height}
                loading={i < 6 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.04]"
              />
            </picture>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span
              aria-hidden="true"
              className="absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-ink-950/40 text-gold-200 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 3h3M3 3v3M11 11H8M11 11V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </a>
        );
      })}
      <div data-gallery-end aria-hidden="true" className="col-span-full h-1" />
    </div>
  );
}
