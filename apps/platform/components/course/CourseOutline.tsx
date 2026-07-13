"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  LockIcon,
  PlayIcon,
  SearchIcon,
  TriangleBullet,
  XIcon,
} from "@/components/ui/icons";
import { matchesQuery } from "@/lib/course-search";

export type OutlineLesson = {
  id: string;
  slug: string;
  /** Continuous two-digit number across the whole course ("01", "02", …). */
  number: string;
  title: string;
  description: string | null;
  durationLabel: string | null;
  done: boolean;
};

export type OutlineSection = {
  id: string;
  title: string;
  /** Pre-rendered count chip ("3/8 concluídas", or "8 aulas" when locked). */
  chip: string;
  lessons: OutlineLesson[];
};

export type CourseOutlineLabels = {
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  noResults: string;
  locked: string;
  doneBadge: string;
};

type Props = {
  courseSlug: string;
  sections: OutlineSection[];
  /** Enrolled or admin — mirrors the page's play vs. lock treatment. */
  accessible: boolean;
  labels: CourseOutlineLabels;
};

function SectionHeader({ section, open }: { section: OutlineSection; open?: boolean }) {
  return (
    <>
      <TriangleBullet className="h-3 w-3 shrink-0 text-accent" />
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold uppercase tracking-[0.2em] text-navy">
        {section.title}
      </span>
      <span className="shrink-0 rounded-full bg-navy/5 px-3 py-1 text-xs font-bold text-steel">
        {section.chip}
      </span>
      {open !== undefined ? (
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-steel transition-transform ${open ? "rotate-180" : ""}`}
        />
      ) : null}
    </>
  );
}

export function CourseOutline({ courseSlug, sections, accessible, labels }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const searching = query.trim().length > 0;

  // While searching, sections collapse to their matching lessons and are
  // always shown open; the manual expanded state comes back when cleared.
  const visible = useMemo(() => {
    if (!searching) return sections;
    return sections
      .map((section) => ({
        ...section,
        lessons: section.lessons.filter((lesson) =>
          matchesQuery(query, lesson.title, lesson.description, lesson.number),
        ),
      }))
      .filter((section) => section.lessons.length > 0);
  }, [sections, query, searching]);

  return (
    <div className="mt-10">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={labels.searchLabel}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-full border border-navy/15 bg-white py-2.5 pl-11 pr-11 text-sm text-navy shadow-sm placeholder:text-steel/70 focus:border-accent"
        />
        {searching ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={labels.clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-steel transition-colors hover:bg-navy/5 hover:text-navy"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {visible.map((section) => {
          const open = searching || Boolean(expanded[section.id]);
          const panelId = `section-panel-${section.id}`;
          return (
            <section
              key={section.id}
              className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm"
            >
              <h2>
                {searching ? (
                  <span className="flex w-full items-center gap-3 p-4 sm:p-5">
                    <SectionHeader section={section} />
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() =>
                      setExpanded((state) => ({ ...state, [section.id]: !open }))
                    }
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-canvas sm:p-5"
                  >
                    <SectionHeader section={section} open={open} />
                  </button>
                )}
              </h2>

              {open ? (
                <ol id={panelId} className="space-y-3 border-t border-navy/5 p-4 sm:p-5">
                  {section.lessons.map((lesson) => {
                    const inner = (
                      <>
                        <span
                          aria-hidden="true"
                          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                            !accessible
                              ? "bg-navy/5 text-steel"
                              : lesson.done
                                ? "bg-navy text-white group-hover:bg-navy-deep"
                                : "bg-navy/10 text-navy group-hover:bg-navy/20"
                          }`}
                        >
                          {accessible ? (
                            lesson.done ? (
                              <CheckIcon className="h-5 w-5" />
                            ) : (
                              <PlayIcon className="h-4 w-4 translate-x-px" />
                            )
                          ) : (
                            <LockIcon className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span
                              aria-hidden="true"
                              className="text-xs font-extrabold tracking-widest text-steel"
                            >
                              {lesson.number}
                            </span>
                            <span className="truncate font-bold text-navy">
                              {lesson.title}
                            </span>
                          </span>
                          {lesson.description ? (
                            <span className="mt-0.5 line-clamp-1 block text-sm text-steel">
                              {lesson.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          {lesson.done ? (
                            <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">
                              {labels.doneBadge}
                            </span>
                          ) : null}
                          {lesson.durationLabel ? (
                            <span className="hidden items-center gap-1.5 text-xs font-semibold text-steel sm:flex">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {lesson.durationLabel}
                            </span>
                          ) : null}
                          {!accessible ? (
                            <span className="text-xs font-bold uppercase tracking-wider text-steel">
                              {labels.locked}
                            </span>
                          ) : null}
                        </span>
                      </>
                    );

                    return (
                      <li key={lesson.id}>
                        {accessible ? (
                          <Link
                            href={{
                              pathname: "/course/[slug]/lesson/[lessonSlug]",
                              params: { slug: courseSlug, lessonSlug: lesson.slug },
                            }}
                            className="group flex items-center gap-4 rounded-xl border border-navy/10 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-4 rounded-xl border border-dashed border-navy/15 bg-white/60 p-4">
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </section>
          );
        })}

      </div>

      {/* Persistent live region so screen readers hear when the search
          filters down to nothing (WCAG 4.1.3). */}
      <p
        role="status"
        aria-live="polite"
        className={
          searching && visible.length === 0
            ? "mt-4 rounded-xl border border-dashed border-navy/15 bg-white/60 p-6 text-center text-sm font-medium text-steel"
            : "sr-only"
        }
      >
        {searching && visible.length === 0 ? labels.noResults : ""}
      </p>
    </div>
  );
}
