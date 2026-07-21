"use client";

import { useEffect, useRef } from "react";
import { adsterraAds, adsterraAdsEnabled, type AdsterraAdConfig, type AdsterraPlacement } from "@/config/adsterra";

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: "iframe";
      height: number;
      width: number;
      params: Record<string, unknown>;
    };
  }
}

type AdsterraAdProps = {
  placement: AdsterraPlacement;
  className?: string;
};

let iframeAdQueue = Promise.resolve();

export function AdsterraAd({ placement, className = "" }: AdsterraAdProps) {
  const config = adsterraAds[placement];
  const containerRef = useRef<HTMLDivElement>(null);
  const width = config.width === "fluid" ? "100%" : `${config.width}px`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLocalPreview() || !adsterraAdsEnabled) return;

    container.replaceChildren();

    if (config.kind === "native") {
      if (!config.scriptSrc) return;

      const nativeContainer = document.createElement("div");
      nativeContainer.id = config.containerId;
      container.appendChild(nativeContainer);

      const script = document.createElement("script");
      script.async = true;
      script.dataset.cfasync = "false";
      script.src = config.scriptSrc;
      container.appendChild(script);
      return;
    }

    iframeAdQueue = iframeAdQueue.then(() => loadIframeAd(container, config));
  }, [config]);

  return (
    <div
      className={`no-print mx-auto overflow-hidden rounded-md border border-dashed border-line bg-white text-center shadow-sm ${className}`}
      role="group"
      aria-label="Advertisement"
      style={{ width, maxWidth: "100%", minHeight: config.height }}
    >
      <div ref={containerRef} className="grid h-full place-items-center">
        <LocalAdPlaceholder placement={placement} height={config.height} />
      </div>
    </div>
  );
}

function LocalAdPlaceholder({ placement, height }: { placement: AdsterraPlacement; height: number }) {
  return (
    <div
      className="grid w-full place-items-center bg-slate-50 px-3 text-xs font-bold uppercase tracking-wide text-muted"
      style={{ minHeight: height }}
    >
      Advertisement {placement}
    </div>
  );
}

function isLocalPreview() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function loadIframeAd(container: HTMLDivElement, config: Extract<AdsterraAdConfig, { kind: "iframe" }>) {
  return new Promise<void>((resolve) => {
    if (!config.scriptSrc) {
      resolve();
      return;
    }

    window.atOptions = {
      key: config.key,
      format: "iframe",
      height: config.height,
      width: config.width,
      params: {}
    };

    const script = document.createElement("script");
    script.src = config.scriptSrc;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    container.appendChild(script);
  });
}
