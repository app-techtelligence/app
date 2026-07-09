-- TechTelligence platform — initial schema.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Security model (CLAUDE.md §8 v2): RLS on EVERY table, default deny;
-- roles student → mentor → admin; role changes only via service role.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'student'
    check (role in ('student', 'mentor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users see and edit only their own profile. Column-level grant below
-- prevents them from touching `role` even through the update policy.
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  is_published boolean not null default false,
  -- While payments don't exist: lets verified students self-enroll.
  beta_open boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "courses: read published"
  on public.courses for select
  to authenticated
  using (is_published);

-- ---------------------------------------------------------------- modules
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position int not null default 0
);

alter table public.modules enable row level security;

create policy "modules: read when course published"
  on public.modules for select
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published
    )
  );

-- ---------------------------------------------------------------- lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  -- Object key in the R2 media bucket, e.g. 'linkedin/Linkedin.mp4'.
  video_key text,
  duration_seconds int,
  position int not null default 0,
  is_free_preview boolean not null default false,
  unique (module_id, slug)
);

alter table public.lessons enable row level security;

create policy "lessons: read when course published"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.is_published
    )
  );

-- ------------------------------------------------------------- enrollments
create table public.enrollments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "enrollments: read own"
  on public.enrollments for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Beta self-enrollment: only into published courses flagged beta_open,
-- only for yourself, only as 'active'. Paid enrollment will replace this
-- with service-role inserts from verified payment webhooks.
create policy "enrollments: beta self-enroll"
  on public.enrollments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'active'
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published and c.beta_open
    )
  );
