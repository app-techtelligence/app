import type { ReactNode } from "react";

export type CardVariant = "default" | "locked";

// Style-guide §4: rounded-2xl surface with a very subtle border and abundant
// internal padding. The default variant elevates on hover; the locked/disabled
// variant uses a dashed border and stays put.
const base =
  "rounded-2xl p-8 transition-[transform,box-shadow,background-color,border-color,color] duration-300 sm:p-10";

const variants: Record<CardVariant, string> = {
  default:
    "border border-navy/5 bg-white motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg motion-safe:hover:shadow-navy/10",
  locked: "border border-dashed border-navy/15 bg-white/60",
};

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
};

export function Card({ children, variant = "default", className }: CardProps) {
  return (
    <div className={`${base} ${variants[variant]} ${className ?? ""}`}>
      {children}
    </div>
  );
}
