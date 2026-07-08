type SectionHeadingProps = {
  /** Small uppercase label above the title. */
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  onDark?: boolean;
  /** Heading level — pages keep a single h1 (usually in the hero). */
  as?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
  onDark = false,
  as: Tag = "h2",
}: SectionHeadingProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {kicker ? (
        <p
          className={`mb-3 text-xs font-bold uppercase tracking-[0.22em] ${
            onDark ? "text-accent" : "text-accent-ink"
          }`}
        >
          {kicker}
        </p>
      ) : null}
      <Tag
        className={`text-3xl font-extrabold tracking-wide sm:text-4xl ${
          onDark ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            onDark ? "text-white/75" : "text-steel"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
