type ContourBandProps = {
  /** Match the surface: steel on light, white or navy on dark. */
  tone?: "navy" | "steel" | "white";
  className?: string;
};

const tones = {
  navy: "text-navy/15",
  steel: "text-steel/30",
  white: "text-white/20",
} as const;

/**
 * Static contour divider — the same nested triangular isolines the hero shader
 * draws, held still. Pure SVG: the animated field is the Home hero's signature
 * and stays exclusive to it (spec §6).
 */
export function ContourBand({ tone = "navy", className }: ContourBandProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex justify-center ${tones[tone]} ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 240 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="h-10 w-60"
      >
        <path d="M60 38 120 6l60 32" />
        <path d="M76 38 120 14l44 24" opacity="0.7" />
        <path d="M92 38 120 22l28 16" opacity="0.45" />
        <path d="M108 38 120 30l12 8" opacity="0.25" />
      </svg>
    </div>
  );
}
