"use client";

import { useId, useMemo, useOptimistic, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button, buttonVariants } from "@/components/ui/Button";
import {
  BanknoteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  TriangleBullet,
} from "@/components/ui/icons";
import {
  JOB_SOURCES,
  JOB_STAGES,
  type JobSource,
  type JobStage,
  type JobStatus,
} from "@/lib/job-tracker";
import type { JobApplication } from "@/lib/types";
import {
  createApplication,
  deleteApplication,
  moveApplication,
  setApplicationStatus,
  updateApplication,
} from "@/lib/job-tracker-actions";

export type JobTrackerLabels = {
  newApplication: string;
  create: string;
  cancel: string;
  save: string;
  saving: string;
  errorSave: string;
  edit: string;
  close: string;
  delete: string;
  confirmDelete: string;
  moveBack: string;
  moveForward: string;
  toggleStatus: string;
  openWebsite: string;
  empty: string;
  fields: {
    companyName: string;
    contactName: string;
    websiteUrl: string;
    websiteUrlPlaceholder: string;
    salary: string;
    salaryPlaceholder: string;
    firstContactDate: string;
    stage: string;
    status: string;
    source: string;
  };
  stages: Record<JobStage, string>;
  statuses: Record<JobStatus, string>;
  /** Short chip labels ("Ativo"/"Passivo"). */
  sources: Record<JobSource, string>;
  /** Descriptive <select> options explaining each source. */
  sourceOptions: Record<JobSource, string>;
};

type Props = {
  initial: JobApplication[];
  labels: JobTrackerLabels;
  locale: string;
};

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-navy";
const labelCls = "mb-1 block text-xs font-bold text-navy";
const cardActionCls =
  "rounded-md px-1.5 py-1 text-xs font-semibold text-steel transition-colors hover:bg-navy/5 hover:text-navy";

// Waiting reads amber (the brand's yellow), no-return reads red. amber-800
// instead of accent-ink: the 11px bold text needs 4.5:1 on the amber tints,
// which accent-ink misses (4.15:1 on the hover tint).
const statusStyles: Record<JobStatus, string> = {
  waiting: "bg-accent/15 text-amber-800 hover:bg-accent/25",
  no_return: "bg-red-600/10 text-red-700 hover:bg-red-600/20",
};

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// The actions only store http(s) URLs, but a row written straight through
// PostgREST could hold anything — never emit a non-http(s) href.
function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function ConfirmDeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-red-600/10 px-2.5 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-600/20 disabled:opacity-60"
    >
      {label}
    </button>
  );
}

function ApplicationFields({
  app,
  labels,
  withStatus,
}: {
  app?: JobApplication;
  labels: JobTrackerLabels;
  withStatus?: boolean;
}) {
  const id = useId();
  return (
    <div className="grid gap-3">
      <div>
        <label htmlFor={`${id}-company`} className={labelCls}>
          {labels.fields.companyName}
        </label>
        <input
          id={`${id}-company`}
          name="company_name"
          required
          maxLength={200}
          defaultValue={app?.company_name ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${id}-contact`} className={labelCls}>
          {labels.fields.contactName}
        </label>
        <input
          id={`${id}-contact`}
          name="contact_name"
          maxLength={200}
          defaultValue={app?.contact_name ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${id}-website`} className={labelCls}>
          {labels.fields.websiteUrl}
        </label>
        <input
          id={`${id}-website`}
          name="website_url"
          inputMode="url"
          maxLength={300}
          placeholder={labels.fields.websiteUrlPlaceholder}
          defaultValue={app?.website_url ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${id}-salary`} className={labelCls}>
          {labels.fields.salary}
        </label>
        <input
          id={`${id}-salary`}
          name="salary"
          maxLength={200}
          placeholder={labels.fields.salaryPlaceholder}
          defaultValue={app?.salary ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${id}-date`} className={labelCls}>
          {labels.fields.firstContactDate}
        </label>
        <input
          id={`${id}-date`}
          name="first_contact_date"
          type="date"
          defaultValue={app?.first_contact_date ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor={`${id}-stage`} className={labelCls}>
          {labels.fields.stage}
        </label>
        <select
          id={`${id}-stage`}
          name="stage"
          defaultValue={app?.stage ?? "first_contact"}
          className={inputCls}
        >
          {JOB_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {labels.stages[stage]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-source`} className={labelCls}>
          {labels.fields.source}
        </label>
        <select
          id={`${id}-source`}
          name="source"
          defaultValue={app?.source ?? "active"}
          className={inputCls}
        >
          {JOB_SOURCES.map((source) => (
            <option key={source} value={source}>
              {labels.sourceOptions[source]}
            </option>
          ))}
        </select>
      </div>
      {withStatus ? (
        <div>
          <label htmlFor={`${id}-status`} className={labelCls}>
            {labels.fields.status}
          </label>
          <select
            id={`${id}-status`}
            name="status"
            defaultValue={app?.status ?? "waiting"}
            className={inputCls}
          >
            {(["waiting", "no_return"] as const).map((status) => (
              <option key={status} value={status}>
                {labels.statuses[status]}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

// Deliberately onSubmit instead of <form action>: a failed save must keep
// the student's typed-in data on screen (the action prop auto-resets the
// fields), and create/update report { ok } so failures are never silent.
function useSubmit(
  run: (formData: FormData) => Promise<{ ok: boolean }>,
  onSuccess: () => void,
) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setFailed(false);
    try {
      const result = await run(formData);
      if (result?.ok) {
        onSuccess();
        return;
      }
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return { pending, failed, onSubmit };
}

function SaveError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-md bg-red-600/10 px-4 py-3 text-sm font-medium text-red-700"
    >
      {message}
    </p>
  );
}

function CreateForm({
  labels,
  onClose,
}: {
  labels: JobTrackerLabels;
  onClose: () => void;
}) {
  const { pending, failed, onSubmit } = useSubmit(createApplication, onClose);
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 max-w-xl rounded-xl border border-navy/10 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-extrabold tracking-wide text-navy">
        {labels.newApplication}
      </h2>
      <div className="mt-4">
        <ApplicationFields labels={labels} />
      </div>
      {failed ? <SaveError message={labels.errorSave} /> : null}
      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? labels.saving : labels.create}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className={buttonVariants("outline")}
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}

function EditForm({
  app,
  labels,
  onClose,
}: {
  app: JobApplication;
  labels: JobTrackerLabels;
  onClose: () => void;
}) {
  const { pending, failed, onSubmit } = useSubmit(updateApplication, onClose);
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-accent/50 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="id" value={app.id} />
      <ApplicationFields app={app} labels={labels} withStatus />
      {failed ? <SaveError message={labels.errorSave} /> : null}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-navy transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
        <button type="button" onClick={onClose} className={cardActionCls}>
          {labels.close}
        </button>
      </div>
    </form>
  );
}

export function JobTrackerBoard({ initial, labels, locale }: Props) {
  // Moves and status toggles render instantly on top of the server rows;
  // once the action's revalidation lands, `initial` carries the real state.
  const [items, patchItem] = useOptimistic(
    initial,
    (state, { id, patch }: { id: string; patch: Partial<JobApplication> }) =>
      state.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  );
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<JobStage | null>(null);

  const dateFormat = useMemo(
    // Dates are stored day-precise; format in UTC so the viewer's timezone
    // never shifts them to the previous day.
    () => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" }),
    [locale],
  );
  const formatDate = (value: string) => dateFormat.format(new Date(`${value}T00:00:00Z`));

  function apply(id: string, patch: Partial<JobApplication>, run: () => Promise<void>) {
    startTransition(async () => {
      patchItem({ id, patch });
      await run();
    });
  }

  function move(app: JobApplication, to: JobStage) {
    if (to === app.stage) return;
    const formData = new FormData();
    formData.set("id", app.id);
    formData.set("stage", to);
    apply(app.id, { stage: to }, () => moveApplication(formData));
  }

  function moveBy(app: JobApplication, direction: -1 | 1) {
    const target = JOB_STAGES[JOB_STAGES.indexOf(app.stage) + direction];
    if (target) move(app, target);
  }

  function toggleStatus(app: JobApplication) {
    const next: JobStatus = app.status === "waiting" ? "no_return" : "waiting";
    const formData = new FormData();
    formData.set("id", app.id);
    formData.set("status", next);
    apply(app.id, { status: next }, () => setApplicationStatus(formData));
  }

  return (
    <div>
      {creating ? (
        <CreateForm labels={labels} onClose={() => setCreating(false)} />
      ) : (
        <Button className="mt-8" onClick={() => setCreating(true)}>
          {labels.newApplication}
        </Button>
      )}

      {items.length === 0 ? (
        <p className="mt-6 rounded-xl border border-navy/10 bg-white p-8 text-center text-steel">
          {labels.empty}
        </p>
      ) : null}

      <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-4">
        {JOB_STAGES.map((stage) => {
          const cards = items.filter((item) => item.stage === stage);
          return (
            <section
              key={stage}
              aria-label={labels.stages[stage]}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragOverStage !== stage) setDragOverStage(stage);
              }}
              onDragLeave={() =>
                setDragOverStage((current) => (current === stage ? null : current))
              }
              onDrop={(event) => {
                event.preventDefault();
                const app = items.find((item) => item.id === dragId);
                if (app) move(app, stage);
                setDragId(null);
                setDragOverStage(null);
              }}
              className={`flex w-72 shrink-0 snap-start flex-col rounded-xl border p-3 transition-colors ${
                dragOverStage === stage
                  ? "border-accent/60 bg-accent/5"
                  : "border-navy/10 bg-white/60"
              }`}
            >
              <header className="flex items-center gap-2 px-1">
                <TriangleBullet className="h-2.5 w-2.5 shrink-0 text-accent" />
                <h2 className="truncate text-xs font-extrabold uppercase tracking-[0.18em] text-navy">
                  {labels.stages[stage]}
                </h2>
                <span className="ml-auto rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-bold text-steel">
                  {cards.length}
                </span>
              </header>

              <ol className="mt-3 flex-1 space-y-3">
                {cards.map((app) => {
                  const stageIndex = JOB_STAGES.indexOf(app.stage);
                  const websiteHref = app.website_url
                    ? safeHref(app.website_url)
                    : null;
                  return (
                    <li key={app.id}>
                      {editingId === app.id ? (
                        <EditForm
                          app={app}
                          labels={labels}
                          onClose={() => setEditingId(null)}
                        />
                      ) : (
                        <article
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            setDragId(app.id);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setDragOverStage(null);
                          }}
                          className={`cursor-grab rounded-xl border border-navy/10 bg-white p-4 shadow-sm transition-all active:cursor-grabbing ${
                            dragId === app.id ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleStatus(app)}
                                title={labels.toggleStatus}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${statusStyles[app.status]}`}
                              >
                                <span
                                  aria-hidden="true"
                                  className="h-1.5 w-1.5 rounded-full bg-current"
                                />
                                {labels.statuses[app.status]}
                              </button>
                              <span
                                title={labels.fields.source}
                                className="inline-flex items-center rounded-full bg-navy/5 px-2.5 py-0.5 text-[11px] font-bold text-steel"
                              >
                                {labels.sources[app.source]}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(app.id);
                                  setConfirmingId(null);
                                }}
                                className={cardActionCls}
                              >
                                {labels.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(app.id)}
                                className={`${cardActionCls} hover:text-red-700`}
                              >
                                {labels.delete}
                              </button>
                            </div>
                          </div>

                          {confirmingId === app.id ? (
                            <form
                              action={async (formData) => {
                                await deleteApplication(formData);
                                setConfirmingId(null);
                              }}
                              className="mt-2 flex items-center gap-2"
                            >
                              <input type="hidden" name="id" value={app.id} />
                              <ConfirmDeleteButton label={labels.confirmDelete} />
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                className={cardActionCls}
                              >
                                {labels.cancel}
                              </button>
                            </form>
                          ) : null}

                          <h3 className="mt-2 break-words text-sm font-extrabold tracking-wide text-navy">
                            {app.company_name}
                          </h3>
                          {app.contact_name ? (
                            <p className="mt-1 text-xs text-steel">{app.contact_name}</p>
                          ) : null}
                          {websiteHref ? (
                            <a
                              href={websiteHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={labels.openWebsite}
                              className="mt-1 block truncate text-xs font-semibold text-accent-ink hover:underline"
                            >
                              {hostLabel(websiteHref)}
                            </a>
                          ) : app.website_url ? (
                            <p className="mt-1 truncate text-xs text-steel">
                              {app.website_url}
                            </p>
                          ) : null}
                          {app.salary ? (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-steel">
                              <BanknoteIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{app.salary}</span>
                            </p>
                          ) : null}
                          {app.first_contact_date ? (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-steel">
                              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                              {formatDate(app.first_contact_date)}
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-2">
                            <button
                              type="button"
                              disabled={stageIndex === 0}
                              onClick={() => moveBy(app, -1)}
                              aria-label={labels.moveBack}
                              title={labels.moveBack}
                              className="rounded-md p-1.5 text-steel transition-colors hover:bg-navy/5 hover:text-navy disabled:pointer-events-none disabled:opacity-30"
                            >
                              <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={stageIndex === JOB_STAGES.length - 1}
                              onClick={() => moveBy(app, 1)}
                              aria-label={labels.moveForward}
                              title={labels.moveForward}
                              className="rounded-md p-1.5 text-steel transition-colors hover:bg-navy/5 hover:text-navy disabled:pointer-events-none disabled:opacity-30"
                            >
                              <ChevronRightIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </article>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
