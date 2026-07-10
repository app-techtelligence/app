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
