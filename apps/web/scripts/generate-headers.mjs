// Emits public/_headers from lib/security-headers.mjs. Runs before `next build`
// so the file ships with the static assets. Workers Static Assets serve files
// BEFORE the worker runs, so next.config headers() never reach them — this
// file is the only way to set headers on asset-served responses.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { securityHeaders } from "../lib/security-headers.mjs";

const indent = (lines) => lines.map((l) => `  ${l}`).join("\n");
const headerLines = securityHeaders.map((h) => `${h.key}: ${h.value}`);

const content = `# GENERATED FILE — do not edit. Source: lib/security-headers.mjs
# Applies to asset-served responses (prerendered /en pages, /_next/static).

/*
${indent(headerLines)}

# Hashed build assets never change — cache forever.
/_next/static/*
${indent(["Cache-Control: public, max-age=31536000, immutable"])}

# Internal locale-prefixed copies of default-locale pages are directly
# reachable as assets; keep them out of search indexes (canonical URLs
# are the unprefixed ones).
/pt-BR/*
${indent(["X-Robots-Tag: noindex"])}
`;

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
writeFileSync(join(publicDir, "_headers"), content);
console.log("[generate-headers] wrote public/_headers");
