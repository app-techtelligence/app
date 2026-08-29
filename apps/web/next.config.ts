import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { securityHeaders } from "./lib/security-headers.mjs";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Image transformation needs a Cloudflare Images binding — deferred to v2.
  // v1 ships hand-optimized SVG/WebP assets instead.
  images: {
    unoptimized: true,
  },
  // The per-service pages were folded into anchored sections on the consulting
  // page (feature/consultoria-design); old URLs stay alive for links in the wild.
  async redirects() {
    return [
      { source: "/consultoria/ia", destination: "/consultoria#ia", permanent: true },
      { source: "/consultoria/governanca-de-dados", destination: "/consultoria#data", permanent: true },
      { source: "/en/consulting/ai", destination: "/en/consulting#ia", permanent: true },
      { source: "/en/consulting/data-governance", destination: "/en/consulting#data", permanent: true },
    ];
  },
  // Applies only to worker-rendered responses; asset-served responses get the
  // same headers from public/_headers (see lib/security-headers.mjs).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

// Makes getCloudflareContext() (bindings, .dev.vars) work in `next dev`.
initOpenNextCloudflareForDev();
