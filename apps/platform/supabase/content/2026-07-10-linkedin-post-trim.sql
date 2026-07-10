-- Trim the LinkedIn post (content update — run once in the Supabase SQL editor).
-- The original version (in 2026-07-10-seo-posts-2.sql) taught the full method,
-- which overlaps the course's LinkedIn module. This condensed version keeps the
-- SEO structure (the 5 pillars still answer the search intent) but moves the
-- step-by-step depth behind the course/mentorship CTA. Editorial rule going
-- forward: posts tease the method, the course teaches it.

update public.posts
set
  title = 'LinkedIn para conseguir emprego em TI: os 5 pilares',
  title_en = 'LinkedIn for landing a tech job: the 5 pillars',
  excerpt = $ptx$Recrutadores procuram você no LinkedIn antes mesmo de você se candidatar. Os 5 pilares de um perfil que gera entrevistas — e os erros que eliminam você em segundos.$ptx$,
  excerpt_en = $enx$Recruiters look you up on LinkedIn before you even apply. The 5 pillars of a profile that generates interviews — and the mistakes that eliminate you in seconds.$enx$,
  body_md = $ptb$Em TI, o LinkedIn não é rede social — é o primeiro filtro do processo seletivo. Recrutadores buscam candidatos por palavra-chave antes mesmo de abrir a vaga, e quem não aparece na busca não existe. Para quem está **migrando de carreira**, o perfil importa ainda mais: é onde a sua história é contada antes que o currículo seja descartado por "falta de experiência".

## Os 5 pilares de um perfil que gera entrevistas

1. **Ser encontrável.** Recrutadores pesquisam cargos e habilidades, não histórias. Headline com o cargo-alvo (nunca "em transição de carreira" — ninguém pesquisa por isso), skills preenchidas e "Open to Work" configurado para recrutadores.

2. **Headline e Sobre com narrativa.** A lógica: cargo-alvo + competências + o diferencial da sua carreira anterior. O Sobre conta a transição em primeira pessoa — de onde você vem, o que já construiu, o que busca. Sem "profissional dinâmico e proativo".

3. **Experiência traduzida.** Não apague o seu passado — reescreva-o em resultados que interessam à vaga-alvo. E projetos contam como experiência: [sem experiência profissional na área, o portfólio é a sua experiência](https://techtelligence.net/blog/como-migrar-para-ti-sem-experiencia).

4. **Presença consistente.** Um post por semana documentando a jornada vale mais que um viral. Recrutadores encontram quem aparece — e prova pública de evolução é exatamente o que uma vaga júnior contrata.

5. **Rede construída antes da necessidade.** Conecte com recrutadores da sua área-alvo e com quem já faz o trabalho que você quer fazer. Indicação vale mais que candidatura fria — e ninguém indica quem pede emprego na primeira mensagem.

## Os erros que eliminam você em segundos

- Headline "Desempregado" ou "Em busca de recolocação" — descreva o que você **é**, não o que falta.
- Perfil pela metade ou desatualizado — pior que não ter perfil.
- Pedir vaga por mensagem no primeiro contato.

## Próximos passos

Cada pilar acima tem técnica por trás: como escrever a headline palavra por palavra, o que colocar em cada seção do perfil, como estruturar os posts da jornada, os roteiros de abordagem que geram resposta em vez de silêncio. Esse passo a passo, com exemplos reais e aula por aula, é exatamente o **módulo de LinkedIn do nosso [curso de transição de carreira](https://techtelligence.net/curso)**. E na [mentoria 1:1](https://techtelligence.net/mentoria), revisamos o *seu* perfil de verdade — headline, narrativa e estratégia de abordagem — com quem contrata em TI todos os dias.

Comece pelos 5 pilares hoje. Quando quiser acelerar, a gente continua de onde este post parou.$ptb$,
  body_md_en = $enb$In tech, LinkedIn isn't a social network — it's the first screening round. Recruiters search for candidates by keyword before a job is even posted, and whoever doesn't show up in that search doesn't exist. If you're **switching careers**, the profile matters even more: it's where your story gets told before a résumé is discarded for "lack of experience".

## The 5 pillars of a profile that generates interviews

1. **Be findable.** Recruiters search for roles and skills, not stories. A headline with your target role (never "career transition in progress" — nobody searches for that), skills filled in, and "Open to Work" configured for recruiters.

2. **A headline and About with a narrative.** The logic: target role + skills + the differentiator of your previous career. The About tells your transition in first person — where you come from, what you've built, what you're looking for. No "dynamic and proactive professional".

3. **Experience, translated.** Don't erase your past — rewrite it as results that matter to your target role. And projects count as experience: [without professional experience in the field, your portfolio is your experience](https://techtelligence.net/en/blog/how-to-start-a-tech-career-with-no-experience).

4. **Consistent presence.** One post a week documenting the journey beats one viral hit. Recruiters find people who show up — and public proof of growth is exactly what a junior role hires.

5. **A network built before you need it.** Connect with recruiters in your target area and with people already doing the job you want. A referral beats a cold application — and nobody refers someone who asks for a job in the first message.

## The mistakes that eliminate you in seconds

- "Unemployed" or "Seeking opportunities" as a headline — describe what you **are**, not what's missing.
- A half-finished or outdated profile — worse than none.
- Asking for a job by DM on first contact.

## Next steps

Each pillar above has technique behind it: how to write the headline word by word, what goes in every profile section, how to structure your journey posts, the outreach scripts that get replies instead of silence. That step-by-step, with real examples, lesson by lesson, is exactly the **LinkedIn module of our [career-transition course](https://techtelligence.net/en/course)**. And in [1:1 mentorship](https://techtelligence.net/en/mentorship), we review *your* actual profile — headline, narrative and outreach strategy — with people who hire in tech every day.

Start with the 5 pillars today. When you're ready to accelerate, we'll pick up right where this post left off.$enb$,
  updated_at = now()
where slug = 'linkedin-para-conseguir-emprego-em-ti';
