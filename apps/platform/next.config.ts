import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { securityHeaders } from "./lib/security-headers.mjs";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
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

// Makes getCloudflareContext() (MEDIA binding, .dev.vars) work in `next dev`.
initOpenNextCloudflareForDev();
