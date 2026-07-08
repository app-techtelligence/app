type LogoMarkProps = {
  className?: string;
};

/**
 * Vector approximation of the TechTelligence mountain mark (nested peaks).
 * Replace with the official SVG once the client provides it — see README.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 120 88"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M60 4 112 84H92L60 33 28 84H8L60 4Z" />
      <path d="M60 46 84 84H70L60 68 50 84H36L60 46Z" />
    </svg>
  );
}
