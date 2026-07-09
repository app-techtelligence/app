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
