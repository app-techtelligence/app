import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Platform pages are per-user (SSR behind auth) — no incremental cache needed.
export default defineCloudflareConfig({});
