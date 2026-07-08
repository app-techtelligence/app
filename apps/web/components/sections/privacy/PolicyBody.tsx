import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { TriangleBullet } from "@/components/ui/icons";

/**
 * The policy sections. `body` / `items` are the number of entries each
 * section has in the messages — index access keeps every string in
 * messages/*.json (see home/ProductDoors.tsx for the same pattern).
 */
const sections = [
  { key: "dataCollected", body: 1, items: 2 },
  { key: "howWeUse", body: 2, items: 0 },
  { key: "storage", body: 2, items: 0 },
  { key: "retention", body: 1, items: 0 },
  { key: "cookies", body: 2, items: 0 },
  { key: "infrastructure", body: 2, items: 0 },
  { key: "rights", body: 1, items: 7 },
  { key: "exercise", body: 2, items: 0 },
  { key: "changes", body: 1, items: 0 },
] as const;

export async function PolicyBody() {
  const t = await getTranslations("privacy.sections");

  // The <email> tag (used in "exercise") becomes a mailto link. Both the
  // href and the visible address come from site-config so the messages
  // never drift from the real inbox.
  const richTags = {
    email: () => (
      <a
        href={`mailto:${siteConfig.contactEmail}`}
        className="font-bold text-navy underline decoration-accent decoration-2 underline-offset-2 transition-colors hover:text-accent-strong"
      >
        {siteConfig.contactEmail}
      </a>
    ),
  };

  return (
    <section className="bg-white pb-16 pt-10 sm:pb-20">
      <Container>
        <div className="mx-auto max-w-3xl space-y-10">
          {sections.map(({ key, body, items }) => (
            <section key={key}>
              <h2 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`${key}.title`)}
              </h2>
              <div className="mt-3 space-y-3">
                {Array.from({ length: body }, (_, i) => (
                  <p key={i} className="text-base leading-relaxed text-navy/80">
                    {t.rich(`${key}.body.${i}`, richTags)}
                  </p>
                ))}
              </div>
              {items > 0 ? (
                <ul className="mt-4 space-y-2.5">
                  {Array.from({ length: items }, (_, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-base leading-relaxed text-navy/85"
                    >
                      <TriangleBullet className="mt-1.5 h-2.5 w-2.5 shrink-0 text-accent" />
                      <span>{t(`${key}.items.${i}`)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
