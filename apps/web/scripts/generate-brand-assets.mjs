// Dev utility: regenerates the OG image and apple-touch icon from the official
// mark geometry (vectorized from the brand logo; same paths as LogoMark.tsx).
// Run manually when the brand changes: `node scripts/generate-brand-assets.mjs`
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Mark paths in a 0 0 394.2 322.4 viewBox (see components/brand/LogoMark.tsx).
const MARK = [
  "M195.8 2.43c-0.8 1.3-7.7 12.5-15.2 24.9-7.6 12.4-20.2 32.8-28 45.5-7.8 12.6-20.5 33.1-28.1 45.5-7.6 12.4-18.5 30.1-24.2 39.5-5.8 9.3-12.4 20.1-14.7 24-12.3 20.4-34.9 57.4-68.1 111.3-7.9 12.8-15.1 24.6-15.9 26.2l-1.6 3 3.3 0.1c2.7 0 56.8 0 58.9-0.1 0.4 0 2.8-3.5 5.4-7.8 2.7-4.2 8.3-13.3 12.5-20.2 4.3-6.9 12.1-19.7 17.5-28.5 5.4-8.8 13.9-22.8 19-31 27.3-44.2 45.2-73.2 57-92.5 7.2-11.8 21.5-35 31.7-51.5 10.2-16.5 19.7-32 21.1-34.5l2.6-4.5-11.9-19.5c-6.5-10.7-13.6-22.4-15.8-25.9l-3.9-6.4-1.6 2.4z",
  "M240.5 82.53c-2.1 3.5-6.7 11-10.2 16.8-14.9 24.3-17.2 28.1-17.2 29 0 0.4 2.9 5.5 6.4 11.2 6.4 10.4 42.6 69.3 52 84.5 10.5 17 18.7 30.4 30.8 50.3 6.9 11.3 16.3 26.7 20.9 34.2l8.4 13.7 31.4 0.1c26.4 0 31.2-0.2 30.8-1.4-0.3-0.8-3.6-6.3-7.3-12.2-3.7-6-9.3-15.2-12.4-20.4-3.2-5.2-13.7-22.6-23.5-38.5-9.8-16-27.1-44.3-38.5-63-38.3-62.9-65.3-107-66.5-108.8-1.2-1.7-1.6-1.2-5.1 4.5z",
  "M181.2 179.63c-8.5 13.8-21.7 35.3-29.4 47.7-7.7 12.4-17.3 27.9-21.4 34.5-4 6.6-14 22.8-22.2 36l-14.8 24 31.1 0.3c28.9 0.2 31.2 0.1 32.4-1.5 1.8-2.3 19.4-30.8 30.6-49.3 4.8-8 9.3-14.5 9.9-14.5 1.3 0 6.7 8.4 27.4 42.7l13.8 22.8 31.3 0 31.3 0-1.2-2.3c-1.2-2.3-8.4-14-28.9-47.2-34.1-55.1-44.5-71.9-56.8-92-7.4-12.1-14.1-23-14.8-24.3-0.8-1.2-1.8-2.2-2.2-2.2-0.4 0-7.6 11.4-16.1 25.3z",
];

// White mark with amber inner peak, wrapped in a translate/scale group.
const markGroup = (tx, ty, s, opacity = 1) => `
  <g transform="translate(${tx},${ty}) scale(${s})" opacity="${opacity}">
    <path fill="#FFFFFF" d="${MARK[0]}"/>
    <path fill="#FFFFFF" d="${MARK[1]}"/>
    <path fill="${opacity === 1 ? "#F59E0B" : "#FFFFFF"}" d="${MARK[2]}"/>
  </g>`;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A2A44"/>
      <stop offset="1" stop-color="#111B2E"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- watermark peak, right side -->
  ${markGroup(790, 40, 1.55, 0.05)}
  <!-- mark -->
  ${markGroup(88, 150, 0.55)}
  <text x="90" y="420" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" letter-spacing="8">
    <tspan fill="#FFFFFF">TECH</tspan><tspan fill="#727B8A">TELLIGENCE</tspan>
  </text>
  <text x="90" y="480" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FFFFFFBF" letter-spacing="1">
    Curso &#8226; Mentoria &#8226; Consultoria em Dados &amp; IA
  </text>
  <rect x="90" y="520" width="120" height="6" fill="#F59E0B"/>
</svg>`;

// Apple touch icon: full-bleed black square, all-white mark (matches the
// favicon treatment the client chose; iOS applies its own rounding).
const appleIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#000000"/>
  <g transform="translate(9,13.2) scale(0.1167)" fill="#FFFFFF">
    <path d="${MARK[0]}"/>
    <path d="${MARK[1]}"/>
    <path d="${MARK[2]}"/>
  </g>
</svg>`;

// Email header logo (720x160, transparent): all-white mark for the navy
// email header + "TECH" white / "TELLIGENCE" light steel wordmark.
const emailLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="160">
  <g transform="translate(14,14) scale(0.407)" fill="#FFFFFF">
    <path d="${MARK[0]}"/>
    <path d="${MARK[1]}"/>
    <path d="${MARK[2]}"/>
  </g>
  <text x="192" y="98" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="800" letter-spacing="5">
    <tspan fill="#FFFFFF">TECH</tspan><tspan fill="#9AA3B0">TELLIGENCE</tspan>
  </text>
</svg>`;

mkdirSync(join(root, "public", "og"), { recursive: true });
mkdirSync(join(root, "public", "email"), { recursive: true });
await sharp(Buffer.from(og)).png().toFile(join(root, "public", "og", "og-default.png"));
await sharp(Buffer.from(appleIcon)).resize(180, 180).png().toFile(join(root, "app", "apple-icon.png"));
await sharp(Buffer.from(emailLogo)).png().toFile(join(root, "public", "email", "logo-email.png"));
console.log("[generate-brand-assets] wrote og-default.png, apple-icon.png, email/logo-email.png");
