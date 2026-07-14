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
-- Seed: the first course with the recorded LinkedIn class.
-- Idempotent-ish: uses fixed slugs; safe to re-run only on a fresh DB.

with course as (
  insert into public.courses (slug, title, description, is_published, beta_open)
  values (
    'carreira-tech',
    'Carreira Tech — Fundamentos',
    'O ponto de partida da sua transição para a área de tecnologia: carreira, posicionamento e as habilidades que o mercado contrata.',
    true,
    true
  )
  returning id
),
mod as (
  insert into public.modules (course_id, title, position)
  select id, 'Posicionamento e Carreira', 1 from course
  returning id
)
insert into public.lessons
  (module_id, slug, title, description, video_key, position, is_free_preview)
select
  id,
  'linkedin-que-atrai-recrutadores',
  'LinkedIn que atrai recrutadores',
  'Como montar um perfil de LinkedIn que aparece nas buscas e atrai recrutadores de tecnologia — passo a passo, do zero.',
  'linkedin/Linkedin.mp4',
  1,
  false
from mod;
-- Bilingual course content: English columns alongside the PT-BR defaults.
-- Pages pick *_en when the user is on the English locale, falling back to
-- the PT-BR base columns when a translation is missing.

alter table public.courses
  add column if not exists title_en text,
  add column if not exists description_en text;

alter table public.modules
  add column if not exists title_en text;

alter table public.lessons
  add column if not exists title_en text,
  add column if not exists description_en text;

-- Translations for the seeded course.
update public.courses set
  title_en = 'Tech Career — Foundations',
  description_en = 'The starting point of your transition into tech: career, positioning and the skills the market actually hires for.'
where slug = 'carreira-tech';

update public.modules set
  title_en = 'Positioning and Career'
where title = 'Posicionamento e Carreira';

update public.lessons set
  title_en = 'A LinkedIn that attracts recruiters',
  description_en = 'How to build a LinkedIn profile that shows up in searches and attracts tech recruiters — step by step, from scratch.'
where slug = 'linkedin-que-atrai-recrutadores';
-- Admin capabilities: role helper + content-management policies.
-- The admin role can manage courses/modules/lessons (including unpublished).
-- Role changes stay service-role/SQL-only — see the promote statement below.

-- SECURITY DEFINER so the check doesn't recurse into profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Content management (FOR ALL covers select/insert/update/delete; policies
-- are OR'd with the existing published-only read policies).
create policy "courses: admin manage"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "modules: admin manage"
  on public.modules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "lessons: admin manage"
  on public.lessons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Defense in depth: profiles has no insert/delete policy, but drop the
-- default table grants too so RLS isn't the only barrier.
revoke insert, delete on public.profiles from authenticated;

-- ============================================================ 0005_blog.sql
-- Blog posts: written by admins on the platform, rendered publicly on the
-- marketing site (techtelligence.net/blog). Both languages are mandatory to
-- publish (site-wide rule); drafts may be incomplete. The marketing site
-- reads with the anon key and no session, so the read policy includes anon.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  slug_en text not null unique,
  title text not null,
  title_en text not null,
  excerpt text not null default '',
  excerpt_en text not null default '',
  body_md text not null default '',
  body_md_en text not null default '',
  cover_key text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts: read published"
  on public.posts for select
  to anon, authenticated
  using (is_published);

create policy "posts: admin manage"
  on public.posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==================================================== 0006_post_tags_en.sql
-- English tags for blog posts (tags_en mirrors tags; PT fallback at render).

alter table public.posts
  add column if not exists tags_en text[] not null default '{}';

update public.posts
set tags_en = (
  select coalesce(
    array_agg(
      case t.tag
        when 'IA' then 'AI'
        when 'Dados' then 'Data'
        when 'Empresas' then 'Business'
        when 'Carreira' then 'Career'
        when 'TI' then 'IT'
        when 'Investimento' then 'Investment'
        else t.tag
      end
      order by t.ord
    ),
    '{}'::text[]
  )
  from unnest(posts.tags) with ordinality as t(tag, ord)
)
where tags_en = '{}';

-- ===================================================== 0007_job_tracker.sql
-- Job-application tracker (student kanban): private per-student rows, full
-- own-rows CRUD via RLS; no admin or anon access.

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

-- ====================================================== 0008_job_salary.sql
-- Optional salary on job-tracker cards. Free text, not numeric: students
-- record whatever the posting says ("R$ 8.000", "80k-100k", "a combinar").

alter table public.job_applications
  add column salary text;

-- ====================================================== 0009_job_source.sql
-- How the application started: 'active' = the student found the job and
-- applied directly; 'passive' = a tech recruiter reached out about the role.

alter table public.job_applications
  add column source text not null default 'active'
    check (source in ('active', 'passive'));

-- ================================================= 0010_lesson_progress.sql
-- Student lesson progress: a row means the lesson is done; deleting the row
-- un-marks it. Written by the student from the lesson player (manual toggle
-- or automatically when the video ends).

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index lesson_progress_user_idx on public.lesson_progress (user_id);

alter table public.lesson_progress enable row level security;

create policy "lesson_progress: read own"
  on public.lesson_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Own rows only, and only for lessons the caller can actually watch:
-- published course, or admin (admins can preview unpublished lessons).
create policy "lesson_progress: insert own"
  on public.lesson_progress for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id and (c.is_published or public.is_admin())
    )
  );

create policy "lesson_progress: delete own"
  on public.lesson_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ====================================== 0011_lesson_progress_enrollment.sql
-- Review follow-up to 0010: marking a lesson done must also require an
-- active enrollment in its course, matching the watch entitlement everywhere
-- else (media route, lesson page). Admins keep preview parity.

drop policy "lesson_progress: insert own" on public.lesson_progress;

create policy "lesson_progress: insert own"
  on public.lesson_progress for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and (
          public.is_admin()
          or (
            c.is_published
            and exists (
              select 1 from public.enrollments e
              where e.course_id = c.id
                and e.user_id = (select auth.uid())
                and e.status = 'active'
            )
          )
        )
    )
  );

-- ========================================================= 0012_job_notes.sql
-- Optional free-text notes on job-tracker cards. Students jot down anything
-- about the role: interview feedback, contacts, next steps, comp details.

alter table public.job_applications
  add column notes text;

-- =============================================== 0013_job_interview_dates.sql
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

-- ---------------------------------------------------------------------------
-- PROMOTE YOUR ACCOUNT (edit the email, run once):
--
-- update public.profiles set role = 'admin'
-- where id in (select id from auth.users where email = 'YOUR-EMAIL-HERE');
-- ---------------------------------------------------------------------------
