import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "onDark" | "onDarkOutline";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold transition-colors disabled:pointer-events-none disabled:opacity-60";

// Monochrome, background-aware: filled fill flips navy↔white by context, with a
// matching outline for secondary actions. Pick the pair that fits the surface.
const variants: Record<ButtonVariant, string> = {
  // On LIGHT surfaces (white / canvas)
  primary: "bg-navy text-white hover:bg-navy-deep",
  secondary: "border border-navy/30 text-navy hover:border-navy hover:bg-navy/5",
  // On DARK surfaces (navy / navy gradient)
  onDark: "bg-white text-navy hover:bg-white/90",
  onDarkOutline:
    "border border-white/40 text-white hover:border-white hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

/**
 * Class-name builder so links can look like buttons:
 * `<Link className={buttonVariants("primary", "lg")} …>`.
 */
export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${className ?? ""}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonVariants(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
