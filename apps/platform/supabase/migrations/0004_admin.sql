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

-- ---------------------------------------------------------------------------
-- PROMOTE YOUR ACCOUNT (edit the email, run once):
--
-- update public.profiles set role = 'admin'
-- where id in (select id from auth.users where email = 'YOUR-EMAIL-HERE');
-- ---------------------------------------------------------------------------
