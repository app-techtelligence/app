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

export type JobStage = (typeof JOB_STAGES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
