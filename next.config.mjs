import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { securityHeaders } from "./src/config/security-headers.mjs";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const releaseBuildId = process.env.NEXT_BUILD_ID?.trim();

if (releaseBuildId && !/^[0-9a-f]{40}$/.test(releaseBuildId)) {
  throw new Error("NEXT_BUILD_ID must be the full lowercase Git commit used for the release.");
}

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;
  const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

  return {
    ...(releaseBuildId ? { generateBuildId: async () => releaseBuildId } : {}),
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
    ...(!isDevServer && !isStaticExport
      ? {
          async headers() {
            return [{ source: "/:path*", headers: securityHeaders }];
          }
        }
      : {})
  };
};

export default nextConfig;
