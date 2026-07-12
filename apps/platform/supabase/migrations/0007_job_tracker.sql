-- Job-application tracker (student kanban): each student privately tracks
-- the companies they are interviewing with. Rows are personal data (LGPD):
-- full own-rows CRUD via RLS, no admin or anon access.

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_name text not null,
  contact_name text,
  website_url text,
  first_contact_date date,
  stage text not null default 'first_contact'
    check (stage in ('first_contact', 'hr_interview', 'tech_interview', 'manager_interview', 'offer')),
  status text not null default 'waiting'
    check (status in ('waiting', 'no_return')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every read/write is scoped to one user; RLS filters on user_id constantly.
create index job_applications_user_idx on public.job_applications (user_id);

alter table public.job_applications enable row level security;

create policy "job_applications: read own"
  on public.job_applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "job_applications: insert own"
  on public.job_applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "job_applications: update own"
  on public.job_applications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "job_applications: delete own"
  on public.job_applications for delete
  to authenticated
  using ((select auth.uid()) = user_id);
