"use client";

import { Utensils } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type DirectoryImageProps = {
  src?: string;
  alt: string;
  fallbackLabel?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

export function DirectoryImage({
  src,
  alt,
  fallbackLabel = "Listing",
  className,
  fill,
  priority,
  sizes
}: DirectoryImageProps) {
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setTimedOut(false);
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (!src || loaded || failed) return;

    const timeout = window.setTimeout(() => {
      setTimedOut(true);
    }, IMAGE_FALLBACK_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [failed, loaded, src]);

  if (!src || failed || timedOut) {
    return (
      <div className="grid h-full min-h-full w-full place-items-center bg-[linear-gradient(135deg,#fff7ed,#fef3c7_55%,#f8fafc)] p-6 text-center dark:bg-none dark:bg-slate-800">
        <div>
          <Utensils className="mx-auto mb-3 h-9 w-9 text-primary" aria-hidden />
          <span className="text-sm font-bold text-accent">{fallbackLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      unoptimized={shouldBypassImageOptimization(src)}
      onLoad={() => {
        setLoaded(true);
        setTimedOut(false);
      }}
      onError={() => setFailed(true)}
    />
  );
}

export const IMAGE_FALLBACK_TIMEOUT_MS = 8000;

export function shouldBypassImageOptimization(src?: string) {
  if (!src) return false;

  try {
    const hostname = new URL(src).hostname;
    return hostname.endsWith(".googleusercontent.com") || hostname === "streetviewpixels-pa.googleapis.com";
  } catch {
    return false;
  }
}

