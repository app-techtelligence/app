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
