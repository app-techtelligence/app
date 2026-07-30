import type { Metadata } from "next";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Internal design-system registry for validating components against
// docs/style-guide.md. Not part of the marketing site — keep it out of search.
export const metadata: Metadata = {
  title: "Styleguide — TechTelligence",
  robots: { index: false, follow: false },
};

// Monochrome logo palette only (style-guide §1) — no hue is invented here.
const PALETTE = [
  {
    name: "navy",
    hex: "#1A2A44",
    swatch: "bg-navy",
    note: "Headings, body, dark backgrounds, filled buttons",
  },
  {
    name: "steel",
    hex: "#667080",
    swatch: "bg-steel",
    note: "Muted text / eyebrows on light (AA)",
  },
  {
    name: "canvas",
    hex: "#F7F8FA",
    swatch: "bg-canvas",
    note: "Off-white section backgrounds",
  },
  {
    name: "white",
    hex: "#FFFFFF",
    swatch: "bg-white",
    note: "Text/fills on navy; page background",
  },
];

// The remaining two logo-palette tokens, shown for completeness.
const SUPPORTING = [
  {
    name: "navy-deep",
    hex: "#111B2E",
    swatch: "bg-navy-deep",
    note: "Hover / pressed on navy fills",
  },
  {
    name: "steel-light",
    hex: "#9AA3B0",
    swatch: "bg-steel-light",
    note: "Muted text / eyebrows on navy (AA)",
  },
];

type Swatch = { name: string; hex: string; swatch: string; note: string };

function ColorSwatch({ name, hex, swatch, note }: Swatch) {
  return (
    <figure className="flex flex-col gap-3">
      <div className={`h-24 w-full rounded-xl border border-navy/10 ${swatch}`} />
      <figcaption className="space-y-1">
        <div className="text-sm font-bold text-navy">{name}</div>
        <div className="font-mono text-xs text-steel">{hex}</div>
        <div className="text-xs leading-relaxed text-steel">{note}</div>
      </figcaption>
    </figure>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-navy/10 py-14 first:border-t-0 first:pt-0">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 leading-relaxed text-steel">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function StyleguidePage({ params }: Props) {
  const { locale } = await params;
  // Keep the page statically rendered, consistent with every page under [locale].
  setRequestLocale(locale);

  return (
    <Container className="py-20 sm:py-24">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
          Design system
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
          Component styleguide
        </h1>
        <p className="mt-4 leading-relaxed text-steel">
          A live registry for validating the building blocks against{" "}
          <span className="font-medium text-navy">docs/style-guide.md</span>.
          Monochrome logo palette only — navy, steel, and white/off-white, with
          emphasis from fill vs. outline, never hue.
        </p>
      </header>

      <div className="mt-6">
        {/* Colors */}
        <Section
          eyebrow="Tokens"
          title="Colors"
          description="The full logo palette. White and canvas sit on a bordered tile so they stay visible on a light page."
        >
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {PALETTE.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
          <p className="mt-8 mb-4 text-xs font-bold uppercase tracking-[0.18em] text-steel">
            Supporting tokens
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {SUPPORTING.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section
          eyebrow="Manrope"
          title="Typography"
          description="Extrabold headings with tight tracking; body copy uses relaxed leading for a modern, floating feel."
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                Display H1 · text-5xl / extrabold / tracking-tight
              </span>
              <p className="text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
                We build Data &amp; AI, so we know what the market hires for.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                H2 · text-3xl / extrabold / tracking-tight
              </span>
              <p className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                From no experience to a job in tech.
              </p>
            </div>
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                Body · leading-relaxed
              </span>
              <p className="leading-relaxed text-navy">
                Body copy in Manrope with relaxed leading. Direct sentences, no
                corporate jargon — professional but encouraging. The extra line
                height keeps long paragraphs readable and gives the layout room
                to breathe.
              </p>
            </div>
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                Muted body · text-steel / leading-loose
              </span>
              <p className="leading-loose text-steel">
                Secondary and supporting copy uses steel for AA-safe contrast on
                light surfaces, with even looser leading where a softer, quieter
                voice is wanted.
              </p>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section
          eyebrow="Components"
          title="Buttons"
          description="Pill shape, transition-all, and a hover lift (hover:-translate-y-0.5 hover:shadow-md). Hover any button to see the elevation."
        >
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
              On light surfaces
            </p>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-canvas p-8">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="primary" size="lg">
                Primary · lg
              </Button>
              <Button variant="secondary" size="lg">
                Secondary · lg
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <a href="#" className={buttonVariants("primary", "md")}>
                Link as button
              </a>
            </div>

            <p className="pt-4 text-xs font-bold uppercase tracking-[0.18em] text-steel">
              On navy surfaces
            </p>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-navy p-8">
              <Button variant="onDark">On dark</Button>
              <Button variant="onDarkOutline">On dark · outline</Button>
              <Button variant="onDark" size="lg">
                On dark · lg
              </Button>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section
          eyebrow="Components"
          title="Cards"
          description="rounded-2xl, a hairline border, and generous p-8 sm:p-10 padding. Default cards elevate on hover (hover:-translate-y-1 hover:shadow-lg); the locked variant uses a dashed border and stays put."
        >
          <div className="grid gap-8 rounded-3xl bg-canvas p-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <span className="inline-flex rounded-full bg-navy/5 px-3 py-1 text-xs font-bold text-steel">
                Resource
              </span>
              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-navy">
                Kanban board
              </h3>
              <p className="mt-3 leading-relaxed text-steel">
                Track every job application through five stages. Hover this card
                to see it lift off the page.
              </p>
              <Button variant="secondary" size="md" className="mt-6">
                Open board
              </Button>
            </Card>

            <Card>
              <span className="inline-flex rounded-full bg-navy/5 px-3 py-1 text-xs font-bold text-steel">
                Course
              </span>
              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-navy">
                Lesson player
              </h3>
              <p className="mt-3 leading-relaxed text-steel">
                Collapsible sections, per-student progress, and auto-advance to
                the next lesson. A second default card for spacing rhythm.
              </p>
              <Button variant="primary" size="md" className="mt-6">
                Continue
              </Button>
            </Card>

            <Card variant="locked">
              <span className="inline-flex rounded-full bg-navy/5 px-3 py-1 text-xs font-bold text-steel">
                Locked
              </span>
              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-navy">
                Mentorship booking
              </h3>
              <p className="mt-3 leading-relaxed text-steel">
                Disabled / locked variant: dashed border, softened background,
                and no hover lift. Reserved for not-yet-available features.
              </p>
            </Card>
          </div>
        </Section>
      </div>
    </Container>
  );
}
