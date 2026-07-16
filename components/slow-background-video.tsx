"use client";

import { useEffect, useRef } from "react";

type SlowBackgroundVideoProps = {
  src: string;
};

export function SlowBackgroundVideo({ src }: SlowBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    video.playbackRate = 1;

    void video.play().catch(() => {
      // Browsers can still block autoplay in unusual settings; muted playback
      // is allowed in normal cases, so this is only a quiet fallback.
    });
  }, []);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      className="video-crisp absolute inset-0 h-full w-full object-cover"
      loop
      muted
      playsInline
      preload="metadata"
      src={src}
    />
  );
}
