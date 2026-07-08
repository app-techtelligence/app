import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Image transformation needs a Cloudflare Images binding — deferred to v2.
  // v1 ships hand-optimized SVG/WebP assets instead.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// Makes getCloudflareContext() (bindings, .dev.vars) work in `next dev`.
initOpenNextCloudflareForDev();
