import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Image transformation needs a Cloudflare Images binding — deferred to v2.
  // v1 ships hand-optimized SVG/WebP assets instead.
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);

// Makes getCloudflareContext() (bindings, .dev.vars) work in `next dev`.
initOpenNextCloudflareForDev();
