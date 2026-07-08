type WordmarkProps = {
  /** Use on navy/dark backgrounds: "TECH" flips to white. */
  onDark?: boolean;
  className?: string;
};

/** "TECH" in navy + "TELLIGENCE" in gray-blue, echoing the logo wordmark. */
export function Wordmark({ onDark = false, className }: WordmarkProps) {
  return (
    <span
      className={`font-extrabold uppercase tracking-[0.14em] ${className ?? ""}`}
    >
      <span className={onDark ? "text-white" : "text-navy"}>Tech</span>
      <span className="text-steel">telligence</span>
    </span>
  );
}
