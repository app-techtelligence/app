-- Optional free-text notes on job-tracker cards. Students jot down anything
-- about the role: interview feedback, contacts, next steps, comp details.

alter table public.job_applications
  add column notes text;
