export type AdsterraPlacement = "160x300" | "160x600" | "300x250" | "320x50" | "468x60" | "728x90" | "NativeBanner";

type IframeAdConfig = {
  kind: "iframe";
  key: string;
  scriptSrc: string;
  width: number;
  height: number;
};

type NativeAdConfig = {
  kind: "native";
  containerId: string;
  scriptSrc: string;
  width: "fluid";
  height: number;
};

export type AdsterraAdConfig = IframeAdConfig | NativeAdConfig;

export const adsterraAdsEnabled = true;

export const adsterraAds = {
  "160x300": {
    kind: "iframe",
    key: "d90259e92c7a0405ab6a4dbb5e427ec0",
    scriptSrc: "https://www.highperformanceformat.com/d90259e92c7a0405ab6a4dbb5e427ec0/invoke.js",
    width: 160,
    height: 300
  },
  "160x600": {
    kind: "iframe",
    key: "64613f6dfca37108b55f494dd4ea8546",
    scriptSrc: "https://www.highperformanceformat.com/64613f6dfca37108b55f494dd4ea8546/invoke.js",
    width: 160,
    height: 600
  },
  "300x250": {
    kind: "iframe",
    key: "d40e799bae619ac49cdc28a7c353ffb5",
    scriptSrc: "https://www.highperformanceformat.com/d40e799bae619ac49cdc28a7c353ffb5/invoke.js",
    width: 300,
    height: 250
  },
  "320x50": {
    kind: "iframe",
    key: "494f4fb5f74f04f443dd0ba8568bec9c",
    scriptSrc: "https://www.highperformanceformat.com/494f4fb5f74f04f443dd0ba8568bec9c/invoke.js",
    width: 320,
    height: 50
  },
  "468x60": {
    kind: "iframe",
    key: "c741c15e914e7f77b8236c3e07c5e828",
    scriptSrc: "https://www.highperformanceformat.com/c741c15e914e7f77b8236c3e07c5e828/invoke.js",
    width: 468,
    height: 60
  },
  "728x90": {
    kind: "iframe",
    key: "5baa2f0948d0e7b27745d8cd8c147ffb",
    scriptSrc: "https://www.highperformanceformat.com/5baa2f0948d0e7b27745d8cd8c147ffb/invoke.js",
    width: 728,
    height: 90
  },
  NativeBanner: {
    kind: "native",
    containerId: "container-8d8681504e24d5d920a8cad537f7d3c4",
    scriptSrc: "https://pl30196195.effectivecpmnetwork.com/8d8681504e24d5d920a8cad537f7d3c4/invoke.js",
    width: "fluid",
    height: 180
  }
} as const satisfies Record<AdsterraPlacement, AdsterraAdConfig>;
