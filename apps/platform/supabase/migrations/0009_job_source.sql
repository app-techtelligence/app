-- How the application started: 'active' = the student found the job and
-- applied directly; 'passive' = a tech recruiter reached out about the role.
alter table public.job_applications
  add column source text not null default 'active'
    check (source in ('active', 'passive'));
