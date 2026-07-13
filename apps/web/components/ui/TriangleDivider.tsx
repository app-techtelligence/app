type TriangleDividerProps = {
  /** Color of the mountain strip — match the surface: steel on light, white on dark. */
  tone?: "navy" | "steel" | "white";
  className?: string;
};

const tones = {
  navy: "text-navy/10",
  steel: "text-steel/25",
  white: "text-white/15",
} as const;

/** Decorative mountain-range strip echoing the triangle logo geometry. */
export function TriangleDivider({
  tone = "navy",
  className,
}: TriangleDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex justify-center py-2 ${tones[tone]} ${className ?? ""}`}
    >
      <svg viewBox="0 0 160 20" fill="currentColor" className="h-4 w-40">
        <path d="M20 20 40 0l20 20H48L40 12l-8 8H20Z" />
        <path d="M62 20 80 2l18 18H86l-6-6-6 6H62Z" opacity="0.75" />
        <path d="M104 20 120 4l16 16h-10l-6-6-6 6h-10Z" opacity="0.5" />
      </svg>
    </div>
  );
}
