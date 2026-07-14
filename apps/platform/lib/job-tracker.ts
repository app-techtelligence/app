/**
 * Job-tracker kanban vocabulary, shared by the board (client), the page
 * (server) and the actions (server). The DB check constraints in migration
 * 0007_job_tracker.sql must stay in sync with these lists.
 */

/** Kanban columns, in pipeline order. */
export const JOB_STAGES = [
  "first_contact",
  "hr_interview",
  "tech_interview",
  "manager_interview",
  "offer",
] as const;

export const JOB_STATUSES = ["waiting", "no_return"] as const;

/** 'active' = applied directly; 'passive' = a recruiter reached out. */
export const JOB_SOURCES = ["active", "passive"] as const;

export type JobStage = (typeof JOB_STAGES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobSource = (typeof JOB_SOURCES)[number];

/**
 * The date column each stage is about. `first_contact` shows when the student
 * first reached the company; each interview stage shows its own scheduled
 * interview date (migration 0013). `offer` has no date of its own, so it is
 * absent here — callers must narrow out "offer" before indexing.
 */
export const STAGE_DATE_FIELD = {
  first_contact: "first_contact_date",
  hr_interview: "hr_interview_date",
  tech_interview: "tech_interview_date",
  manager_interview: "manager_interview_date",
} as const satisfies Record<Exclude<JobStage, "offer">, string>;

/** Every date column, for partial-update handling in the server actions. */
export const JOB_DATE_FIELDS = [
  "first_contact_date",
  "hr_interview_date",
  "tech_interview_date",
  "manager_interview_date",
] as const;

/**
 * Max length of a card's free-text notes, counting line breaks as one char
 * (LF). The form's live counter and the server both measure against this after
 * normalizing CRLF → LF, so what fits on screen always saves.
 */
export const NOTES_MAX_LENGTH = 2000;
