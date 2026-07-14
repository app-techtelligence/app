-- Per-stage interview dates on job-tracker cards. `first_contact_date` covers
-- the "Primeiro contato" column; each interview column now carries its own
-- scheduled date, so a card in "Entrevista técnica" shows that interview's
-- date, distinct from the HR and manager rounds. The board & form pick the
-- column that matches the card's current stage (STAGE_DATE_FIELD in
-- lib/job-tracker.ts).

alter table public.job_applications
  add column hr_interview_date date,
  add column tech_interview_date date,
  add column manager_interview_date date;
