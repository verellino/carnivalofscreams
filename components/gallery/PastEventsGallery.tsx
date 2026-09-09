"use client";

import { useEffect, useRef, useState } from "react";

import { GALLERY_IMAGES, type GalleryImage } from "@/lib/gallery";

type PastEventsGalleryProps = {
  images?: GalleryImage[];
};

export default function PastEventsGallery({
  images = GALLERY_IMAGES,
}: PastEventsGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const gallery = galleryRef.current;
    if (!root || !gallery) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    let app: { destroy: () => void } | undefined;
    let disposed = false;

    const showFallback = () => {
      html.style.overflow = previousOverflow;
      setFallback(true);
      setReady(true);
    };

    void import("./GalleryApp")
      .then(({ default: App }) => {
        if (disposed || !rootRef.current || !galleryRef.current) return;
        try {
          app = new App({
            container: root,
            gallery,
            onReady: () => setReady(true),
          });
        } catch {
          showFallback();
        }
      })
      .catch(() => {
        if (!disposed) showFallback();
      });

    return () => {
      disposed = true;
      html.style.overflow = previousOverflow;
      app?.destroy();
    };
  }, []);

  const rootClass = [
    "past-gallery",
    "is-titled",
    ready ? "is-ready" : "",
    fallback ? "is-fallback" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClass}>
      <header className="past-gallery__title">
        <p className="past-gallery__kicker">The archive</p>
        <h1 className="past-gallery__heading">Past events</h1>
        <p className="past-gallery__editions">
          C.L.O.W.N 2023 · CLEOPATRA 2024 · CHARIOT 2025
        </p>
      </header>

      <div ref={galleryRef} className="past-gallery__layout">
        {images.map((image) => (
          <figure key={image.src} className="past-gallery__figure">
            {/* Native img is required: OGL reads the element for plane bounds and textures. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="past-gallery__image"
              src={image.src}
              alt={`${image.alt}. ${image.edition}.`}
              draggable={false}
            />
          </figure>
        ))}
      </div>

      <p className="past-gallery__hint">Scroll or drag</p>
    </div>
  );
}
