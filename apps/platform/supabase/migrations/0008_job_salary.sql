-- Optional salary on job-tracker cards. Free text, not numeric: students
-- record whatever the posting says ("R$ 8.000", "80k-100k", "a combinar").
alter table public.job_applications
  add column salary text;
