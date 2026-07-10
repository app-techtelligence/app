// Single source of truth for security headers (CLAUDE.md §8).
// Consumed by BOTH mechanisms — this split is required on OpenNext/Cloudflare:
//  1. next.config.ts headers()  → worker-rendered responses (PT pages, /api/*)
//  2. scripts/generate-headers.mjs → public/_headers → asset-served responses
//     (prerendered /en/* pages, /_next/static/*), which bypass the worker.

// Nonce-based CSP would force dynamic rendering; 'unsafe-inline' is the
// standard trade-off for fully static Next.js sites. Turnstile needs
// challenges.cloudflare.com in script-src, frame-src and connect-src.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  // https: lets blog posts embed images from external hosts (images can't
  // execute script, so the loosening is low-risk).
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {{ key: string, value: string }[]} */
export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];
