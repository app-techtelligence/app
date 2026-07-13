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
