"use client";

import { useRef } from "react";

export default function VideoBackground({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/video/stargate-poster.webp"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/video/stargate-bg.mp4" type="video/mp4" />
      </video>

      {/* Fallback scrim for the no-WebGL path; the canvas paints over both. */}
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_20%,rgba(5,3,8,0.68)_100%)]" />
    </div>
  );
}
