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
