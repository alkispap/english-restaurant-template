import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { securityHeaders } from "./src/config/security-headers.mjs";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;
  const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

  return {
    output: isStaticExport && !isDevServer ? "export" : undefined,
    staticPageGenerationTimeout: isStaticExport && !isDevServer ? 180 : undefined,
    trailingSlash: true,
    outputFileTracingRoot: projectRoot,
    images: {
      unoptimized: isStaticExport,
      formats: ["image/avif", "image/webp"],
      qualities: [75],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "example.com"
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com"
        },
        {
          protocol: "https",
          hostname: "lh3.googleusercontent.com"
        },
        {
          protocol: "https",
          hostname: "lh4.googleusercontent.com"
        },
        {
          protocol: "https",
          hostname: "lh5.googleusercontent.com"
        },
        {
          protocol: "https",
          hostname: "lh6.googleusercontent.com"
        },
        {
          protocol: "https",
          hostname: "streetviewpixels-pa.googleapis.com"
        },
        {
          protocol: "https",
          hostname: "thecurryclub.uk"
        }
      ]
    },
    ...(!isStaticExport || isDevServer
      ? {
          async headers() {
            return [{ source: "/:path*", headers: securityHeaders }];
          }
        }
      : {})
  };
};

export default nextConfig;
