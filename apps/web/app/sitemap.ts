import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import {
  routing,
  type AppPathname,
  type Locale,
  type StaticAppPathname,
} from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { listPublishedPosts } from "@/lib/blog";

// Blog posts come from the database, so the sitemap is rendered per request.
export const dynamic = "force-dynamic";

// Dynamic routes (e.g. /blog/[slug]) get their entries from real data below.
const staticPathnames = (Object.keys(routing.pathnames) as AppPathname[]).filter(
  (href): href is StaticAppPathname => !href.includes("["),
);

function absoluteUrl(href: StaticAppPathname, locale: Locale): string {
  return siteConfig.url + getPathname({ href, locale });
}

/** One entry per page with hreflang alternates for both locales. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = staticPathnames.map((href) => ({
    url: absoluteUrl(href, routing.defaultLocale),
    changeFrequency: "monthly",
    priority: href === "/" ? 1 : 0.8,
    alternates: {
      languages: {
        "pt-BR": absoluteUrl(href, "pt-BR"),
        en: absoluteUrl(href, "en"),
        "x-default": absoluteUrl(href, routing.defaultLocale),
      },
    },
  }));

  const posts = await listPublishedPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: post.updated_at ?? post.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.7,
    alternates: {
      languages: {
        "pt-BR": `${siteConfig.url}/blog/${post.slug}`,
        en: `${siteConfig.url}/en/blog/${post.slug_en}`,
        "x-default": `${siteConfig.url}/blog/${post.slug}`,
      },
    },
  }));

  return [...pages, ...postEntries];
}
