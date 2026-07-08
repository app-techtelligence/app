// Dev utility: regenerates the OG image and apple-touch icon from inline SVG.
// Run manually when the brand changes: `node scripts/generate-brand-assets.mjs`
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A2A44"/>
      <stop offset="1" stop-color="#111B2E"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- watermark peak, right side -->
  <g fill="#FFFFFF" opacity="0.05" transform="translate(760,60) scale(5.4)">
    <path d="M60 4 112 84H92L60 33 28 84H8L60 4Z"/>
    <path d="M60 46 84 84H70L60 68 50 84H36L60 46Z"/>
  </g>
  <!-- mark -->
  <g transform="translate(88,170) scale(1.9)">
    <path d="M60 4 112 84H92L60 33 28 84H8L60 4Z" fill="#FFFFFF"/>
    <path d="M60 46 84 84H70L60 68 50 84H36L60 46Z" fill="#F59E0B"/>
  </g>
  <text x="90" y="420" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" letter-spacing="8">
    <tspan fill="#FFFFFF">TECH</tspan><tspan fill="#727B8A">TELLIGENCE</tspan>
  </text>
  <text x="90" y="480" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFFBF" letter-spacing="1">
    Curso &#8226; Mentoria &#8226; Consultoria em Dados &amp; IA
  </text>
  <rect x="90" y="520" width="120" height="6" fill="#F59E0B"/>
</svg>`;

const appleIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#1A2A44"/>
  <path d="M32 10 57 55H46.5L32 29 17.5 55H7L32 10Z" fill="#FFFFFF"/>
  <path d="M32 35 44 55H36.8L32 46.5 27.2 55H20L32 35Z" fill="#F59E0B"/>
</svg>`;

mkdirSync(join(root, "public", "og"), { recursive: true });
await sharp(Buffer.from(og)).png().toFile(join(root, "public", "og", "og-default.png"));
await sharp(Buffer.from(appleIcon)).resize(180, 180).png().toFile(join(root, "app", "apple-icon.png"));
console.log("[generate-brand-assets] wrote public/og/og-default.png and app/apple-icon.png");
