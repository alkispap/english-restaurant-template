"use client";

import { useEffect, useState } from "react";
import { adsterraAds, adsterraAdsEnabled, type AdsterraAdConfig, type AdsterraPlacement } from "@/config/adsterra";

type AdsterraAdProps = {
  placement: AdsterraPlacement;
  className?: string;
};

export function AdsterraAd({ placement, className = "" }: AdsterraAdProps) {
  const config = adsterraAds[placement];
  const maxWidth = config.width === "fluid" ? "100%" : `${config.width}px`;
  const [useNetworkAd, setUseNetworkAd] = useState(false);

  useEffect(() => {
    setUseNetworkAd(adsterraAdsEnabled && !isLocalPreview());
  }, []);

  return (
    <div
      className={`no-print mx-auto min-w-0 overflow-hidden rounded-md border border-dashed border-line bg-white text-center shadow-sm ${className}`}
      role="group"
      aria-label="Advertisement"
      style={{ width: "100%", maxWidth, minHeight: config.height }}
    >
      {useNetworkAd ? (
        <iframe
          className="block border-0"
          height={config.height}
          scrolling="no"
          srcDoc={createAdDocument(config)}
          style={{ width: "100%" }}
          title={`Advertisement ${placement}`}
          width={config.width === "fluid" ? undefined : config.width}
        />
      ) : (
        <LocalAdPlaceholder placement={placement} height={config.height} />
      )}
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

function createAdDocument(config: AdsterraAdConfig) {
  const scriptAttributes = config.kind === "native" ? ' async data-cfasync="false"' : "";
  const options =
    config.kind === "iframe"
      ? `<script>atOptions=${JSON.stringify({
          key: config.key,
          format: "iframe",
          height: config.height,
          width: config.width,
          params: {}
        })};</script>`
      : `<div id="${config.containerId}"></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden}</style></head><body>${options}<script${scriptAttributes} src="${config.scriptSrc}"></script></body></html>`;
}
