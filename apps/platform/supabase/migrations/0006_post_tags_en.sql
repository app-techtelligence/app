-- English tags for blog posts. tags was one shared array, so PT tags
-- rendered on the EN site. tags_en follows the same convention as
-- title_en/excerpt_en: EN column, PT fallback at render time.

alter table public.posts
  add column if not exists tags_en text[] not null default '{}';

-- Backfill posts that already exist: translate the known PT vocabulary,
-- pass anything unknown through unchanged. Re-runnable (only touches rows
-- that still have no EN tags).
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
