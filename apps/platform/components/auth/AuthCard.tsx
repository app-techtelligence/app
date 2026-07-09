import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

/** Centered card shell shared by the auth pages. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Container className="flex justify-center py-16 sm:py-20">
      <div className="w-full max-w-md rounded-xl border border-navy/10 bg-white p-7 shadow-sm sm:p-9">
        <h1 className="text-2xl font-extrabold tracking-wide text-navy">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-steel">{subtitle}</p>
        ) : null}
        <div className="mt-7">{children}</div>
      </div>
    </Container>
  );
}
