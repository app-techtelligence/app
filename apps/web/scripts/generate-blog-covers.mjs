// Dev utility: renders blog cover images (1200x630 PNG) from the brand system —
// navy gradient, triangle mark, amber accent, one geometric motif per post.
// Covers are text-free because a post's single cover serves both locales.
// Output goes to <repo>/blog-covers/ (gitignored); upload each file through
// the platform admin editor (plataforma.techtelligence.net/admin/blog).
// Run manually: `node apps/web/scripts/generate-blog-covers.mjs`
// New post? Add an entry to POSTS below with a motif and re-run.
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(webRoot, "..", "..", "blog-covers");

const W = 1200;
const H = 630;
const NAVY = "#1A2A44";
const NAVY_DEEP = "#111B2E";
const STEEL = "#727B8A";
const AMBER = "#F59E0B";

// Mark paths in a 0 0 394.2 322.4 viewBox (see components/brand/LogoMark.tsx).
const MARK = [
  "M195.8 2.43c-0.8 1.3-7.7 12.5-15.2 24.9-7.6 12.4-20.2 32.8-28 45.5-7.8 12.6-20.5 33.1-28.1 45.5-7.6 12.4-18.5 30.1-24.2 39.5-5.8 9.3-12.4 20.1-14.7 24-12.3 20.4-34.9 57.4-68.1 111.3-7.9 12.8-15.1 24.6-15.9 26.2l-1.6 3 3.3 0.1c2.7 0 56.8 0 58.9-0.1 0.4 0 2.8-3.5 5.4-7.8 2.7-4.2 8.3-13.3 12.5-20.2 4.3-6.9 12.1-19.7 17.5-28.5 5.4-8.8 13.9-22.8 19-31 27.3-44.2 45.2-73.2 57-92.5 7.2-11.8 21.5-35 31.7-51.5 10.2-16.5 19.7-32 21.1-34.5l2.6-4.5-11.9-19.5c-6.5-10.7-13.6-22.4-15.8-25.9l-3.9-6.4-1.6 2.4z",
  "M240.5 82.53c-2.1 3.5-6.7 11-10.2 16.8-14.9 24.3-17.2 28.1-17.2 29 0 0.4 2.9 5.5 6.4 11.2 6.4 10.4 42.6 69.3 52 84.5 10.5 17 18.7 30.4 30.8 50.3 6.9 11.3 16.3 26.7 20.9 34.2l8.4 13.7 31.4 0.1c26.4 0 31.2-0.2 30.8-1.4-0.3-0.8-3.6-6.3-7.3-12.2-3.7-6-9.3-15.2-12.4-20.4-3.2-5.2-13.7-22.6-23.5-38.5-9.8-16-27.1-44.3-38.5-63-38.3-62.9-65.3-107-66.5-108.8-1.2-1.7-1.6-1.2-5.1 4.5z",
  "M181.2 179.63c-8.5 13.8-21.7 35.3-29.4 47.7-7.7 12.4-17.3 27.9-21.4 34.5-4 6.6-14 22.8-22.2 36l-14.8 24 31.1 0.3c28.9 0.2 31.2 0.1 32.4-1.5 1.8-2.3 19.4-30.8 30.6-49.3 4.8-8 9.3-14.5 9.9-14.5 1.3 0 6.7 8.4 27.4 42.7l13.8 22.8 31.3 0 31.3 0-1.2-2.3c-1.2-2.3-8.4-14-28.9-47.2-34.1-55.1-44.5-71.9-56.8-92-7.4-12.1-14.1-23-14.8-24.3-0.8-1.2-1.8-2.2-2.2-2.2-0.4 0-7.6 11.4-16.1 25.3z",
];

const markGroup = (tx, ty, s, opacity = 1) => `
  <g transform="translate(${tx},${ty}) scale(${s})" opacity="${opacity}">
    <path fill="#FFFFFF" d="${MARK[0]}"/>
    <path fill="#FFFFFF" d="${MARK[1]}"/>
    <path fill="${opacity === 1 ? AMBER : "#FFFFFF"}" d="${MARK[2]}"/>
  </g>`;

const tri = (cx, baseY, w, h, fill, opacity = 1, up = true) =>
  up
    ? `<path d="M${cx - w / 2} ${baseY} L${cx} ${baseY - h} L${cx + w / 2} ${baseY} Z" fill="${fill}" opacity="${opacity}"/>`
    : `<path d="M${cx - w / 2} ${baseY - h} L${cx + w / 2} ${baseY - h} L${cx} ${baseY} Z" fill="${fill}" opacity="${opacity}"/>`;

// Shared frame: gradient, faint watermark top-left, motif, brand footer.
const cover = (motif) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${markGroup(-90, -60, 1.5, 0.04)}
  ${motif}
  ${markGroup(70, 484, 0.28)}
  <text x="200" y="556" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="4">
    <tspan fill="#FFFFFF">TECH</tspan><tspan fill="${STEEL}">TELLIGENCE</tspan>
  </text>
  <rect x="202" y="574" width="90" height="5" fill="${AMBER}"/>
</svg>`;

// investment: rising bars toward an amber peak
const motifCost = () => {
  const bars = [
    [640, 130, 0.16],
    [760, 210, 0.26],
    [880, 290, 0.38],
  ]
    .map(([x, h, o]) => `<rect x="${x}" y="${470 - h}" width="82" height="${h}" rx="10" fill="#FFFFFF" opacity="${o}"/>`)
    .join("");
  return `${bars}
    <rect x="1000" y="${470 - 370}" width="82" height="370" rx="10" fill="${AMBER}"/>
    ${tri(1041, 78, 82, 66, AMBER)}
    <rect x="610" y="478" width="472" height="4" fill="#FFFFFF" opacity="0.25"/>`;
};

// readiness test: seven signals, one flipped amber
const motifSigns = () => {
  const row1 = [660, 780, 900, 1020].map((x) => tri(x, 290, 92, 84, "#FFFFFF", 0.85)).join("");
  const row2 = [720, 960].map((x) => tri(x, 440, 92, 84, "#FFFFFF", 0.85)).join("");
  return `${row1}${row2}${tri(840, 440, 92, 84, AMBER, 1, false)}`;
};

// career climb: a contiguous staircase up to the peak
const motifCareer = () => {
  const steps = [
    [620, 90, 0.14],
    [736, 180, 0.24],
    [852, 270, 0.34],
    [968, 360, 0.44],
  ]
    .map(([x, h, o]) => `<rect x="${x}" y="${470 - h}" width="116" height="${h}" fill="#FFFFFF" opacity="${o}"/>`)
    .join("");
  return `${steps}${tri(1026, 92, 132, 108, AMBER)}
    <rect x="610" y="474" width="474" height="4" fill="#FFFFFF" opacity="0.25"/>`;
};

// three data roles: same family, distinct shapes, one highlighted
const motifRoles = () => `
  ${tri(680, 440, 190, 210, "#FFFFFF", 0.35)}
  ${tri(870, 440, 190, 290, AMBER)}
  <path d="M${1060 - 95} 440 L1060 ${440 - 210} L${1060 + 95} 440 Z" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.8"/>`;

// where to start: a dotted path rising to the peak
const motifStart = () => {
  const dots = [
    [640, 450, 0.3],
    [716, 400, 0.4],
    [792, 350, 0.55],
    [868, 300, 0.7],
    [944, 250, 0.85],
  ]
    .map(([x, y, o]) => `<circle cx="${x}" cy="${y}" r="11" fill="#FFFFFF" opacity="${o}"/>`)
    .join("");
  return `${dots}${tri(1060, 235, 140, 118, AMBER)}`;
};

const POSTS = [
  ["ia-na-pratica-por-onde-sua-empresa-deve-comecar", motifStart],
  ["quanto-custa-implementar-ia-na-empresa", motifCost],
  ["empresa-pronta-para-ia-7-sinais", motifSigns],
  ["como-migrar-para-ti-sem-experiencia", motifCareer],
  ["analista-engenheiro-cientista-de-dados-qual-a-diferenca", motifRoles],
];

mkdirSync(outDir, { recursive: true });
for (const [slug, motif] of POSTS) {
  const file = join(outDir, `${slug}.png`);
  await sharp(Buffer.from(cover(motif()))).png().toFile(file);
  console.log(`[generate-blog-covers] wrote ${file}`);
}
