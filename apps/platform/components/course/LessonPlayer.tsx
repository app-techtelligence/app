"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { markLessonDone, unmarkLessonDone } from "@/lib/progress-actions";

export type AdjacentLesson = { slug: string; title: string };

export type LessonPlayerLabels = {
  noVideo: string;
  markDone: string;
  unmarkDone: string;
  done: string;
  previous: string;
  next: string;
  advancing: string;
};

type Props = {
  lessonId: string;
  courseSlug: string;
  videoSrc: string | null;
  /** Set when the previous lesson auto-advanced here (?autoplay=1). */
  autoPlay: boolean;
  initialDone: boolean;
  prev: AdjacentLesson | null;
  next: AdjacentLesson | null;
  labels: LessonPlayerLabels;
};

export function LessonPlayer({
  lessonId,
  courseSlug,
  videoSrc,
  autoPlay,
  initialDone,
  prev,
  next,
  labels,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [done, setDone] = useState(initialDone);
  const [advancing, setAdvancing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Browsers may block un-muted autoplay without a fresh gesture; when that
  // happens the video simply stays paused with controls visible.
  useEffect(() => {
    if (autoPlay) videoRef.current?.play().catch(() => {});
  }, [autoPlay]);

  function toggleDone() {
    const wasDone = done;
    setDone(!wasDone);
    startTransition(async () => {
      const { ok } = wasDone
        ? await unmarkLessonDone(lessonId)
        : await markLessonDone(lessonId);
      if (!ok) setDone(wasDone);
    });
  }

  function handleEnded() {
    setDone(true);
    if (next) setAdvancing(true);
    startTransition(async () => {
      await markLessonDone(lessonId);
      if (next) {
        router.push({
          pathname: "/course/[slug]/lesson/[lessonSlug]",
          params: { slug: courseSlug, lessonSlug: next.slug },
          query: { autoplay: "1" },
        });
      }
    });
  }

  const adjacentCls =
    "group flex min-w-0 items-center gap-2 rounded-lg border border-navy/10 bg-white p-3 shadow-sm transition-colors hover:border-accent/60";

  return (
    <div>
      <div className="mt-8 overflow-hidden rounded-xl border border-navy/10 bg-navy-deep shadow-sm">
        {videoSrc ? (
          <video
            ref={videoRef}
            controls
            autoPlay={autoPlay}
            preload="metadata"
            controlsList="nodownload"
            className="aspect-video w-full"
            src={videoSrc}
            onEnded={handleEnded}
          />
        ) : (
          <p className="p-10 text-center text-white/70">{labels.noVideo}</p>
        )}
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-center text-sm font-semibold text-accent-ink"
      >
        {advancing ? labels.advancing : ""}
      </p>

      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="min-w-0">
          {prev ? (
            <Link
              href={{
                pathname: "/course/[slug]/lesson/[lessonSlug]",
                params: { slug: courseSlug, lessonSlug: prev.slug },
              }}
              className={adjacentCls}
            >
              <ChevronLeftIcon className="h-4 w-4 shrink-0 text-steel transition-colors group-hover:text-navy" />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-steel">
                  {labels.previous}
                </span>
                <span className="block truncate text-sm font-bold text-navy">
                  {prev.title}
                </span>
              </span>
            </Link>
          ) : null}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={toggleDone}
            disabled={isPending}
            aria-pressed={done}
            title={done ? labels.unmarkDone : labels.markDone}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold transition-colors disabled:opacity-60 ${
              done
                ? "bg-accent text-navy hover:bg-accent/80"
                : "border-2 border-navy/15 text-navy hover:border-accent hover:bg-accent/10"
            }`}
          >
            <CheckIcon className="h-4 w-4" />
            {done ? labels.done : labels.markDone}
          </button>
        </div>

        <div className="min-w-0">
          {next ? (
            <Link
              href={{
                pathname: "/course/[slug]/lesson/[lessonSlug]",
                params: { slug: courseSlug, lessonSlug: next.slug },
              }}
              className={`${adjacentCls} justify-end text-right`}
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-steel">
                  {labels.next}
                </span>
                <span className="block truncate text-sm font-bold text-navy">
                  {next.title}
                </span>
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-steel transition-colors group-hover:text-navy" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
