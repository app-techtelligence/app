-- SEO batch #2 (content seed — run once in the Supabase SQL editor).
-- Three bilingual posts, staggered published_at (consultancy post on top).
-- Covers via /blog-cover (Gemini prompts + processing).
--
-- Search intent each post targets:
--   1. "RAG o que é" / "what is RAG"                       (B2B, rising query)
--   2. "quanto ganha um analista de dados"                 (B2C, huge volume — non-promissory)
--   3. "linkedin para conseguir emprego em TI"             (B2C, course/mentorship tie-in)

-- 1 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'rag-o-que-e-e-quando-usar',
    'what-is-rag-and-when-to-use-it',
    'RAG: o que é e quando sua empresa deve usar',
    'What is RAG and when should your company use it?',
    $ptx1$A IA que responde com base nos documentos da sua empresa — sem treinar modelo nenhum. Entenda o que é RAG em português claro, para que serve e o que precisa estar pronto antes.$ptx1$,
    $enx1$AI that answers from your company's own documents — no model training required. What RAG is in plain language, what it's for, and what needs to be ready first.$enx1$,
    $ptb1$Pergunte a um chatbot genérico qual é a política de reembolso da sua empresa e ele vai inventar uma resposta educada — e errada. O modelo nunca leu os seus documentos. **RAG (Retrieval-Augmented Generation)** é a técnica que resolve exatamente isso, e é hoje o caminho mais rápido para colocar IA útil dentro de uma empresa.

## O que é RAG, em português claro?

RAG é uma prova com consulta. Em vez de esperar que o modelo "saiba" alguma coisa sobre o seu negócio, o sistema funciona em três passos:

1. **Você pergunta** — "qual o prazo de cancelamento no contrato da ACME?"
2. **O sistema busca** — encontra os trechos relevantes nos *seus* documentos (contratos, políticas, manuais, tickets).
3. **A IA responde com base no que encontrou** — citando a fonte, em linguagem natural.

O modelo não decora os seus dados; ele consulta na hora. Documento atualizado hoje entra na resposta de hoje.

## Por que não simplesmente "treinar" um modelo com os meus dados?

É a primeira ideia de quase todo mundo — e quase sempre a errada:

- **Custo**: fine-tuning exige preparação de dados, infraestrutura e re-treinos a cada mudança. RAG usa modelos prontos, pagos por uso (já explicamos [o que entra na conta de um projeto de IA](https://techtelligence.net/blog/quanto-custa-implementar-ia-na-empresa)).
- **Atualização**: o modelo treinado congela no tempo; o RAG lê a versão atual do documento.
- **Controle de acesso**: com RAG, dá para respeitar quem pode ver o quê — a busca só consulta o que aquele usuário pode acessar. Modelo treinado não tem essa noção.
- **Fontes**: RAG mostra de onde a resposta veio. Em ambiente corporativo, resposta sem fonte é risco.

Fine-tuning tem lugar — tom de voz, formatos muito específicos — mas para "IA que conhece a empresa", RAG vence na prática.

## Para que sua empresa pode usar RAG hoje

- **Assistente interno** — políticas de RH, procedimentos, normas técnicas: o time pergunta, a IA responde com a fonte, ninguém mais caça PDF.
- **Atendimento** — respostas baseadas na base de conhecimento real do produto, não no "achismo" do modelo.
- **Contratos e documentos** — "quais contratos vencem em 90 dias e têm multa rescisória?" vira uma pergunta, não uma tarde de trabalho.
- **Onboarding** — quem chega aprende perguntando, com respostas consistentes.

## O que precisa estar pronto antes

RAG responde com base no que encontra — se os documentos estão desatualizados, duplicados ou espalhados em caixas de e-mail, a resposta herda essa bagunça. Antes do piloto, vale o nosso [teste dos 7 sinais](https://techtelligence.net/blog/empresa-pronta-para-ia-7-sinais): fonte oficial definida, documentos acessíveis de forma estruturada e regras de acesso claras. A boa notícia: para um piloto, basta arrumar o corpus daquele caso de uso — não a empresa inteira.

## Quando RAG *não* é a resposta

- **Perguntas sobre números** ("qual foi a margem por região?") — isso é BI e dados estruturados, não busca em documentos.
- **Previsão** (demanda, churn, inadimplência) — isso é modelo preditivo treinado no seu histórico.
- **Automação pura** (mover dados de A para B) — isso é integração, sem IA nenhuma.

Usar RAG onde ele não serve é a versão 2026 de "comprar a ferramenta antes de entender o problema".

## Como começar

Como todo projeto de IA que funciona: **um caso de uso, um corpus de documentos, uma métrica** — por exemplo, reduzir em 40% o tempo que o suporte gasta procurando resposta — e semanas de piloto, não meses ([o método completo está aqui](https://techtelligence.net/blog/ia-na-pratica-por-onde-sua-empresa-deve-comecar)).

É exatamente esse tipo de projeto que a nossa [consultoria em Dados & IA](https://techtelligence.net/consultoria) desenha e implementa: diagnóstico do cenário, arquitetura pragmática (sem exagero de infraestrutura), piloto com métrica e transição para o seu time operar. [Fale com a gente](https://techtelligence.net/contato) e conte qual conhecimento da sua empresa você quer destravar primeiro.$ptb1$,
    $enb1$Ask a generic chatbot about your company's refund policy and it will invent a polite — and wrong — answer. The model has never read your documents. **RAG (Retrieval-Augmented Generation)** is the technique that fixes exactly this, and it's currently the fastest path to putting genuinely useful AI inside a company.

## What is RAG, in plain language?

RAG is an open-book exam. Instead of expecting the model to "know" your business, the system works in three steps:

1. **You ask** — "what's the cancellation notice period in the ACME contract?"
2. **The system searches** — it finds the relevant passages in *your* documents (contracts, policies, manuals, tickets).
3. **The AI answers based on what it found** — citing the source, in natural language.

The model doesn't memorize your data; it looks things up at answer time. A document updated today shows up in today's answers.

## Why not just "train" a model on my data?

It's almost everyone's first idea — and almost always the wrong one:

- **Cost**: fine-tuning demands data preparation, infrastructure and re-training on every change. RAG uses ready-made pay-per-use models (we broke down [what actually goes into an AI project's cost](https://techtelligence.net/en/blog/how-much-does-it-cost-to-implement-ai)).
- **Freshness**: a trained model freezes in time; RAG reads the current version of the document.
- **Access control**: with RAG, the search can respect who is allowed to see what — it only retrieves what that user can access. A trained model has no such concept.
- **Sources**: RAG shows where the answer came from. In a corporate setting, an answer without a source is a liability.

Fine-tuning has its place — tone of voice, very specific output formats — but for "AI that knows the company", RAG wins in practice.

## What your company can use RAG for today

- **Internal assistant** — HR policies, procedures, technical standards: the team asks, the AI answers with the source, nobody hunts PDFs anymore.
- **Customer support** — answers grounded in the product's real knowledge base, not the model's guesswork.
- **Contracts and documents** — "which contracts expire within 90 days and carry a termination penalty?" becomes a question, not an afternoon of work.
- **Onboarding** — new hires learn by asking, with consistent answers.

## What needs to be ready first

RAG answers from what it finds — if your documents are outdated, duplicated or scattered across inboxes, the answers inherit that mess. Before the pilot, run our [7-signs readiness test](https://techtelligence.net/en/blog/is-your-company-ready-for-ai-7-signs): an official source per topic, documents structurally accessible, clear access rules. The good news: for a pilot you only need to fix the corpus of that one use case — not the whole company.

## When RAG is *not* the answer

- **Questions about numbers** ("what was the margin by region?") — that's BI and structured data, not document search.
- **Forecasting** (demand, churn, delinquency) — that's a predictive model trained on your history.
- **Pure automation** (moving data from A to B) — that's integration, no AI required.

Using RAG where it doesn't fit is the 2026 version of "buying the tool before understanding the problem".

## How to start

Like every AI project that works: **one use case, one document corpus, one metric** — for example, cutting the time support spends hunting for answers by 40% — and a pilot measured in weeks, not months ([the full method is here](https://techtelligence.net/en/blog/ai-in-practice-where-your-company-should-start)).

This is exactly the kind of project our [Data & AI consulting](https://techtelligence.net/en/consulting) designs and implements: a diagnosis of your scenario, pragmatic architecture (no infrastructure overkill), a pilot with a metric, and a handover so your team can operate it. [Talk to us](https://techtelligence.net/en/contact) and tell us which of your company's knowledge you want to unlock first.$enb1$,
    array['IA', 'Dados', 'Empresas'],
    true,
    now()
  );

-- 2 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'quanto-ganha-um-analista-de-dados',
    'how-much-do-data-analysts-earn',
    'Quanto ganha um analista de dados? Um guia honesto',
    'How much do data analysts earn? An honest guide',
    $ptx2$Faixas salariais reais por nível, o que faz o número variar e como evoluir de faixa — sem promessa milagrosa. O guia honesto para quem está avaliando a área de dados.$ptx2$,
    $enx2$Real salary ranges by level, what makes the number vary, and how to move up — no miracle promises. The honest guide for anyone considering the data field.$enx2$,
    $ptb2$"Quanto ganha um analista de dados?" é provavelmente a pergunta mais pesquisada por quem está pensando em migrar para a área de dados — e a mais respondida com promessas irreais. Vamos fazer diferente: faixas de mercado, o que faz o número variar e o que realmente move alguém de faixa. **Sem promessa de salário — de quem promete, desconfie.**

## As faixas que o mercado pratica no Brasil

Os números abaixo são a ordem de grandeza que aparece em portais de vagas e pesquisas salariais (Glassdoor, Catho, pesquisas de comunidades de dados). Variam por região, setor e empresa — use como referência, nunca como garantia:

| Nível | Faixa mensal típica | O que se espera |
|---|---|---|
| **Júnior** | R$ 3 mil – R$ 5 mil | SQL, planilhas, uma ferramenta de BI; entrega com supervisão |
| **Pleno** | R$ 5 mil – R$ 9 mil | Autonomia, dono de indicadores, comunicação com o negócio |
| **Sênior** | R$ 9 mil – R$ 15 mil+ | Direciona decisões, mentora o time, desenha a análise certa |

Dois fatores mudam essa tabela de patamar: **trabalho remoto para fora do país** (salários em dólar ou euro) e **migração para engenharia ou ciência de dados**, que puxam faixas mais altas — comparamos os três papéis [neste guia](https://techtelligence.net/blog/analista-engenheiro-cientista-de-dados-qual-a-diferenca).

## O que faz o salário variar tanto?

- **Setor** — tecnologia e mercado financeiro costumam pagar acima de varejo e indústria.
- **Região e modelo** — grandes capitais e vagas remotas pagam mais que o interior; remoto internacional é outro campeonato.
- **Inglês** — é o multiplicador mais barato de desenvolver: abre vagas remotas e empresas globais.
- **Tamanho e maturidade da empresa** — quem já tem área de dados estruturada paga mais do que quem está começando (e exige mais).

## Como evoluir de faixa (o que realmente conta)

1. **Impacto no negócio, não ferramenta.** Quem mostra "minha análise reduziu X% do custo de frete" sobe; quem coleciona certificados, não necessariamente.
2. **Comunicação.** A análise só vale quando alguém decide algo com ela. Apresentar bem multiplica seu valor.
3. **Profundidade técnica na medida** — SQL forte, estatística básica sólida, uma stack de BI dominada. Depois, se fizer sentido, especialize (engenharia, ciência).
4. **Provas públicas** — portfólio, GitHub, LinkedIn ativo. É o que permite *negociar* em vez de aceitar.

## Vale a pena entrar na área?

A demanda por gente que transforma dados em decisão segue crescendo — toda empresa que quer usar IA descobre primeiro que precisa arrumar (e entender) os próprios dados. E análise de dados continua sendo **a porta de entrada mais acessível** da área técnica: exige menos bagagem para começar e aproveita a experiência de quem vem de outro setor. O caminho completo da transição está no nosso [guia para migrar para TI sem experiência](https://techtelligence.net/blog/como-migrar-para-ti-sem-experiencia).

## O aviso honesto

Se um curso promete "salário de R$ X em 6 meses", feche a aba. Não existe prazo nem salário garantido — existe probabilidade, que aumenta com constância, projetos reais e orientação de quem conhece o mercado. É essa a nossa proposta: o [curso de transição de carreira](https://techtelligence.net/curso) para construir a base, e a [mentoria 1:1](https://techtelligence.net/mentoria) para estratégia, LinkedIn e preparação para entrevistas — com quem contrata e trabalha com dados todos os dias.$ptb2$,
    $enb2$"How much do data analysts earn?" is probably the most-searched question by anyone considering a move into data — and the one most often answered with unrealistic promises. Let's do it differently: market ranges, what makes the number vary, and what actually moves someone up a bracket. **No salary promises — distrust anyone who makes them.**

## The ranges the market pays in Brazil

The numbers below are the order of magnitude you'll see on job boards and salary surveys (Glassdoor, local job portals, data-community surveys). They vary by region, industry and company — treat them as reference, never as a guarantee:

| Level | Typical monthly range | What's expected |
|---|---|---|
| **Junior** | R$ 3k – R$ 5k | SQL, spreadsheets, one BI tool; delivers with supervision |
| **Mid-level** | R$ 5k – R$ 9k | Autonomy, owns indicators, communicates with the business |
| **Senior** | R$ 9k – R$ 15k+ | Steers decisions, mentors the team, designs the right analysis |

Two factors shift this table to another level entirely: **remote work for foreign companies** (salaries in dollars or euros) and **moving into data engineering or data science**, which command higher ranges — we compared the three roles [in this guide](https://techtelligence.net/en/blog/data-analyst-vs-data-engineer-vs-data-scientist).

## Why do salaries vary so much?

- **Industry** — tech and finance tend to pay above retail and manufacturing.
- **Region and work model** — major cities and remote roles pay more; international remote is a different league altogether.
- **English** — the cheapest multiplier you can develop: it unlocks remote roles and global companies.
- **Company size and data maturity** — companies with an established data function pay more than those just starting (and demand more).

## How to move up a bracket (what actually counts)

1. **Business impact, not tools.** "My analysis cut freight costs by X%" gets you promoted; a collection of certificates doesn't necessarily.
2. **Communication.** Analysis only creates value when someone decides something with it. Presenting well multiplies your worth.
3. **Technical depth in the right measure** — strong SQL, solid basic statistics, one BI stack mastered. Then, if it makes sense, specialize (engineering, science).
4. **Public proof** — portfolio, GitHub, an active LinkedIn. That's what lets you *negotiate* instead of accept.

## Is the field worth entering?

Demand for people who turn data into decisions keeps growing — every company that wants AI discovers first that it needs to organize (and understand) its own data. And data analysis remains **the most accessible entry door** into technical work: it requires the least baggage to start and rewards experience brought from other industries. The full transition path is in our [guide to starting a tech career with no experience](https://techtelligence.net/en/blog/how-to-start-a-tech-career-with-no-experience).

## The honest warning

If a course promises "earn R$ X within 6 months", close the tab. There is no guaranteed timeline or salary — there is probability, and it grows with consistency, real projects and guidance from people who know the market. That's our proposition: the [career-transition course](https://techtelligence.net/en/course) to build the foundation, and [1:1 mentorship](https://techtelligence.net/en/mentorship) for strategy, LinkedIn and interview preparation — with people who hire and work with data every day.$enb2$,
    array['Carreira', 'Dados'],
    true,
    now() - interval '1 hour'
  );

-- 3 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'linkedin-para-conseguir-emprego-em-ti',
    'linkedin-guide-to-land-a-tech-job',
    'LinkedIn para conseguir emprego em TI: o guia completo',
    'LinkedIn for landing a tech job: the complete guide',
    $ptx3$Recrutadores procuram você no LinkedIn antes mesmo de você se candidatar. Headline, Sobre, experiência e abordagem: o guia prático para transformar o perfil em entrevistas.$ptx3$,
    $enx3$Recruiters look you up on LinkedIn before you even apply. Headline, About, experience and outreach: the practical guide to turning your profile into interviews.$enx3$,
    $ptb3$Em TI, o LinkedIn não é rede social — é o primeiro filtro do processo seletivo. Recrutadores buscam candidatos por palavra-chave antes mesmo de abrir a vaga, e quem não aparece na busca não existe. Para quem está **migrando de carreira**, o perfil importa ainda mais: é onde você conta a sua história antes que o currículo seja descartado por "falta de experiência". Este guia mostra, seção por seção, como transformar o perfil em convites para entrevista.

## Primeiro: seja encontrável (o SEO do seu perfil)

Recrutadores pesquisam cargos e habilidades, não histórias. Seu perfil precisa conter as palavras que eles digitam:

- **Headline com o cargo-alvo** — "Analista de Dados | SQL · Power BI · Python", nunca "Em transição de carreira" (ninguém pesquisa por isso).
- **Skills preenchidas** — as ~10 habilidades da sua trilha, validadas quando possível; o filtro de busca usa esse campo.
- **Configurações certas** — "Open to Work" ativado para recrutadores (pode ficar invisível para sua rede atual), localização correta, setor "Tecnologia da Informação".

## Headline e Sobre que funcionam

A fórmula da headline: **cargo-alvo | 3 competências | diferencial**. O diferencial de quem migra é a carreira anterior — use-a:

> Analista de Dados | SQL · Power BI · Python | 8 anos em logística — dados aplicados a operações reais

No **Sobre**, conte a transição em três parágrafos: de onde você vem (e o que isso te deu), o que você já construiu (projetos, com links), o que você busca. Primeira pessoa, direto, sem "profissional dinâmico e proativo".

## Experiência: traduza o seu passado

Não apague a carreira anterior — traduza-a. O que em "atendente" era rotina, em dados vira "analisava padrões de reclamação e propus mudança que reduziu retrabalho". E **projetos contam como experiência**: crie uma entrada "Projetos em Dados" (ou use a seção Projetos) com dois ou três cases, cada um com problema, ferramenta e resultado — e link para o GitHub. Sem experiência profissional na área, [o portfólio é a sua experiência](https://techtelligence.net/blog/como-migrar-para-ti-sem-experiencia).

## Publique a jornada (consistência > viralização)

Recrutadores encontram quem aparece. Um post por semana basta: o que você aprendeu, um projeto concluído, um erro que virou lição. Não precisa ser guru — precisa ser real. Quem documenta o próprio progresso constrói prova pública de evolução, e é exatamente isso que uma vaga júnior contrata.

## Conexões e abordagem que não queimam pontes

- Conecte com **recrutadores da sua área-alvo** e pessoas que fazem o trabalho que você quer fazer.
- Convite com nota curta: quem você é, por que está conectando — **sem pedir emprego na primeira mensagem**.
- Comente com substância nos posts de quem você admira; é networking que não parece networking.
- Indicação vale mais que candidatura fria: cultive relações antes de precisar delas.

## Os erros que afastam recrutadores

1. Foto de festa, selfie escura — ou nenhuma foto.
2. Headline "Desempregado" ou "Em busca de recolocação" (descreva o que você **é**, não o que falta).
3. Perfil desatualizado ou pela metade — pior que não ter.
4. Copiar descrição de vaga no Sobre.
5. Pedir vaga por DM no primeiro contato.

## Checklist final

- [ ] Headline com cargo-alvo + competências
- [ ] Foto profissional e capa simples
- [ ] Sobre em 1ª pessoa com narrativa de transição
- [ ] Experiência traduzida + projetos com links
- [ ] 10 skills da trilha preenchidas
- [ ] Open to Work configurado
- [ ] 1 post por semana no ar

Perfil pronto é o primeiro passo; usá-lo bem é o jogo contínuo. É exatamente isso que trabalhamos no nosso [curso de transição de carreira](https://techtelligence.net/curso) — que inclui um módulo dedicado a LinkedIn — e na [mentoria 1:1](https://techtelligence.net/mentoria), onde revisamos o seu perfil real, sua narrativa e sua estratégia de abordagem, com quem contrata em TI todos os dias.$ptb3$,
    $enb3$In tech, LinkedIn isn't a social network — it's the first screening round. Recruiters search for candidates by keyword before a job is even posted, and whoever doesn't show up in that search doesn't exist. If you're **switching careers**, the profile matters even more: it's where you tell your story before a résumé gets discarded for "lack of experience". This guide shows, section by section, how to turn your profile into interview invitations.

## First: be findable (your profile's SEO)

Recruiters search for roles and skills, not stories. Your profile must contain the words they type:

- **Headline with your target role** — "Data Analyst | SQL · Power BI · Python", never "Career transition in progress" (nobody searches for that).
- **Skills filled in** — the ~10 skills of your chosen track, endorsed where possible; recruiter search filters use this field.
- **The right settings** — "Open to Work" enabled for recruiters (it can stay invisible to your current network), correct location, industry set to Information Technology.

## A headline and About section that work

The headline formula: **target role | 3 skills | differentiator**. A career changer's differentiator is the previous career — use it:

> Data Analyst | SQL · Power BI · Python | 8 years in logistics — data applied to real operations

In **About**, tell the transition in three paragraphs: where you come from (and what it taught you), what you've already built (projects, with links), what you're looking for. First person, direct, no "dynamic and proactive professional".

## Experience: translate your past

Don't erase your previous career — translate it. What was routine as a "support agent" becomes "analyzed complaint patterns and proposed a change that cut rework". And **projects count as experience**: create a "Data Projects" entry (or use the Projects section) with two or three cases — problem, tool, result — each linking to GitHub. Without professional experience in the field, [your portfolio is your experience](https://techtelligence.net/en/blog/how-to-start-a-tech-career-with-no-experience).

## Publish the journey (consistency > virality)

Recruiters find people who show up. One post a week is enough: something you learned, a finished project, a mistake that became a lesson. You don't need to be a guru — you need to be real. Documenting your own progress builds public proof of growth, and that's exactly what a junior role hires.

## Connections and outreach that don't burn bridges

- Connect with **recruiters in your target area** and people doing the job you want.
- Invitations with a short note: who you are, why you're connecting — **never ask for a job in the first message**.
- Comment with substance on posts by people you admire; it's networking that doesn't feel like networking.
- A referral beats a cold application: build relationships before you need them.

## The mistakes that push recruiters away

1. Party photo, dark selfie — or no photo at all.
2. "Unemployed" or "Seeking opportunities" as a headline (describe what you **are**, not what's missing).
3. An outdated or half-finished profile — worse than none.
4. Pasting job-description language into your About.
5. Asking for a job by DM on first contact.

## Final checklist

- [ ] Headline with target role + skills
- [ ] Professional photo and a simple banner
- [ ] First-person About with your transition narrative
- [ ] Experience translated + projects with links
- [ ] 10 track-relevant skills filled in
- [ ] Open to Work configured
- [ ] 1 post a week going out

A finished profile is step one; using it well is the ongoing game. That's exactly what we work on in our [career-transition course](https://techtelligence.net/en/course) — which includes a dedicated LinkedIn module — and in [1:1 mentorship](https://techtelligence.net/en/mentorship), where we review your actual profile, your narrative and your outreach strategy, with people who hire in tech every day.$enb3$,
    array['Carreira', 'TI'],
    true,
    now() - interval '2 hours'
  );
