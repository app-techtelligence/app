-- SEO batch #1 (content seed — run once in the Supabase SQL editor).
-- Four bilingual posts, published immediately, staggered published_at so the
-- blog listing keeps a deliberate order (consultancy posts on top, per the
-- product priority). Cover images can be added later via the admin editor.
--
-- Search intent each post targets:
--   1. "quanto custa implementar IA" / "how much does AI cost"        (B2B, high commercial intent)
--   2. "empresa pronta para IA" / "is my company ready for AI"        (B2B, problem-aware)
--   3. "como migrar para TI sem experiência" / "start a tech career"  (B2C, high volume)
--   4. "analista vs engenheiro vs cientista de dados"                 (B2C, comparison snippet)

-- 1 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'quanto-custa-implementar-ia-na-empresa',
    'how-much-does-it-cost-to-implement-ai',
    'Quanto custa implementar IA na empresa? Um guia realista',
    'How much does it cost to implement AI? A realistic guide',
    $ptx1$Piloto, produção, custos escondidos: o que entra de verdade na conta de um projeto de IA, as faixas de investimento do mercado e como gastar menos sem cortar o que importa.$ptx1$,
    $enx1$Pilot, production, hidden costs: what an AI project really costs, the typical investment tiers, and how to spend less without cutting what matters.$enx1$,
    $ptb1$"Quanto custa implementar inteligência artificial?" é, de longe, a pergunta que mais escutamos de empresas. E a resposta honesta — *depende* — não ajuda ninguém a montar um orçamento. Então vamos fazer melhor: este guia mostra **o que realmente entra na conta de um projeto de IA**, as faixas de investimento que o mercado pratica e os custos escondidos que costumam aparecer depois da assinatura do contrato.

## O que realmente entra na conta

Um projeto de IA sério tem cinco blocos de custo. Quem orça só o terceiro — a tecnologia — descobre os outros quatro do pior jeito.

- **Descoberta e diagnóstico** — entender o problema, medir o processo atual e definir a métrica de sucesso. É o bloco mais barato e o que mais evita desperdício.
- **Preparação dos dados** — localizar, limpar, integrar e controlar o acesso aos dados que o caso de uso exige. Em empresas sem fundação de dados, este costuma ser o maior bloco de todos.
- **Modelo e infraestrutura** — a maioria dos casos hoje usa modelos prontos pagos por uso (APIs), o que derruba o investimento inicial. Fine-tuning e modelos próprios só se justificam em cenários bem específicos.
- **Integração** — conectar a IA aos sistemas onde o trabalho acontece (ERP, CRM, atendimento). É o que separa uma demo bonita de uma ferramenta que o time usa todo dia.
- **Operação** — monitoramento, ajustes, controle do custo por uso e evolução contínua. IA em produção é um sistema vivo, não um projeto com data de fim.

## As três faixas de investimento

Cada projeto é um orçamento próprio, mas o mercado se organiza em três degraus bem reconhecíveis:

1. **Piloto bem delimitado (semanas).** Um caso de uso, uma métrica definida antes, um time pequeno. No mercado brasileiro, pilotos assim costumam ficar na casa de dezenas de milhares de reais — o suficiente para provar (ou descartar) o valor com risco controlado.
2. **Primeiro caso em produção (meses).** O piloto aprovado ganha integração, segurança, monitoramento e capacitação do time. Tipicamente custa um múltiplo do piloto, e é onde o valor começa a ser entregue todos os meses.
3. **Fundação de dados + programa de IA (contínuo).** Para empresas que querem escalar vários casos de uso sobre uma base comum. É investimento recorrente — e é ele que faz o custo *por caso de uso* cair com o tempo.

A ordem importa: pular o degrau 1 é a forma mais cara que existe de descobrir que o caso de uso estava errado.

## Os custos que ninguém coloca na proposta

- **Dados desorganizados.** Se cada área tem seu próprio número e o histórico vive em planilhas, o projeto paga essa conta antes de escrever a primeira linha de IA. Fizemos um teste rápido para isso: [7 sinais de que o problema são os dados](https://techtelligence.net/blog/empresa-pronta-para-ia-7-sinais).
- **Custo por uso em escala.** No piloto, a API custa centavos. Com mil usuários por dia, não. Projete o custo de inferência no volume real *antes* de escalar.
- **Manutenção.** Modelos mudam, sistemas mudam, o negócio muda. Reserve orçamento para operar, não só para construir.
- **Capacitação.** A ferramenta que o time não sabe (ou não quer) usar tem ROI zero.
- **Retrabalho por falta de governança.** Corrigir depois um projeto que ignorou a LGPD e o controle de acesso custa mais do que fazer certo desde o início.

## Como investir menos (sem cortar o que importa)

- **Comece com um caso de uso, não cinco.** Foco barateia tudo: dados, integração, gestão da mudança.
- **Use modelos prontos por API antes de pensar em modelo próprio.** O custo inicial cai uma ordem de grandeza.
- **Defina a métrica antes de gastar.** Já explicamos o método em [por onde sua empresa deve começar](https://techtelligence.net/blog/ia-na-pratica-por-onde-sua-empresa-deve-comecar).
- **Reaproveite a fundação.** O segundo caso de uso deve custar menos que o primeiro — se não custa, algo foi construído descartável.

## E o custo de não fazer nada?

Ele não aparece em nenhuma proposta, mas existe: horas de trabalho manual que não voltam, decisões tomadas no escuro e concorrentes acumulando eficiência mês após mês. Não é motivo para pânico — é motivo para começar pequeno, agora, com método.

## O orçamento começa por um diagnóstico

Antes de pedir (ou aceitar) qualquer proposta, entenda seu cenário: qual problema atacar primeiro, em que estado estão os dados e qual o caminho mais curto até um resultado mensurável. É exatamente assim que a nossa [consultoria em Dados & IA](https://techtelligence.net/consultoria) trabalha — diagnóstico, roadmap pragmático e implementação em ciclos curtos, com decisão de continuar (ou parar) a cada ciclo.

Quer um número de verdade, para o *seu* caso? [Fale com a gente](https://techtelligence.net/contato) e conte qual problema você quer resolver primeiro.$ptb1$,
    $enb1$"How much does it cost to implement artificial intelligence?" is by far the question we hear most from companies. And the honest answer — *it depends* — helps no one build a budget. So let's do better: this guide shows **what actually goes into the cost of an AI project**, the investment tiers the market works with, and the hidden costs that tend to show up after the contract is signed.

## What actually goes into the cost

A serious AI project has five cost blocks. Companies that budget only the third one — the technology — discover the other four the hard way.

- **Discovery and diagnosis** — understanding the problem, measuring the current process and defining the success metric. It's the cheapest block and the one that prevents the most waste.
- **Data preparation** — locating, cleaning, integrating and controlling access to the data the use case requires. In companies without a data foundation, this is usually the biggest block of all.
- **Model and infrastructure** — most use cases today run on ready-made pay-per-use models (APIs), which slashes the upfront investment. Fine-tuning and custom models only pay off in very specific scenarios.
- **Integration** — connecting the AI to the systems where work actually happens (ERP, CRM, support desk). This is what separates a pretty demo from a tool the team uses every day.
- **Operations** — monitoring, adjustments, usage-cost control and continuous evolution. AI in production is a living system, not a project with an end date.

## The three investment tiers

Every project is its own budget, but the market organizes into three recognizable steps:

1. **A well-scoped pilot (weeks).** One use case, one metric defined up front, a small team. Well-scoped pilots typically land in the low tens of thousands of dollars — enough to prove (or discard) the value with controlled risk.
2. **First case in production (months).** The approved pilot gains integration, security, monitoring and team training. It typically costs a multiple of the pilot — and it's where value starts being delivered every month.
3. **Data foundation + AI program (ongoing).** For companies that want to scale several use cases on a shared base. It's recurring investment — and it's what makes the cost *per use case* drop over time.

The order matters: skipping step 1 is the most expensive way ever invented to discover the use case was wrong.

## The costs nobody puts in the proposal

- **Messy data.** If every department has its own numbers and the history lives in spreadsheets, the project pays that bill before the first line of AI is written. We built a quick test for this: [7 signs your data is the real problem](https://techtelligence.net/en/blog/is-your-company-ready-for-ai-7-signs).
- **Usage cost at scale.** In the pilot, the API costs cents. With a thousand users a day, it doesn't. Project the inference cost at real volume *before* scaling.
- **Maintenance.** Models change, systems change, the business changes. Budget to operate, not just to build.
- **Training.** A tool the team can't (or won't) use has zero ROI.
- **Rework from missing governance.** Retrofitting privacy compliance (LGPD, GDPR) and access control into a finished project costs more than doing it right from day one.

## How to spend less (without cutting what matters)

- **Start with one use case, not five.** Focus makes everything cheaper: data, integration, change management.
- **Use ready-made models via API before considering your own.** The upfront cost drops by an order of magnitude.
- **Define the metric before spending.** We covered the method in [where your company should start](https://techtelligence.net/en/blog/ai-in-practice-where-your-company-should-start).
- **Reuse the foundation.** The second use case should cost less than the first — if it doesn't, something disposable was built.

## And the cost of doing nothing?

It never shows up in a proposal, but it's real: manual hours that never come back, decisions made in the dark, and competitors compounding efficiency month after month. That's not a reason to panic — it's a reason to start small, now, with a method.

## A budget starts with a diagnosis

Before requesting (or accepting) any proposal, understand your scenario: which problem to attack first, what state your data is in, and the shortest path to a measurable result. That's exactly how our [Data & AI consulting](https://techtelligence.net/en/consulting) works — diagnosis, a pragmatic roadmap, and implementation in short cycles, with a go/no-go decision at every cycle.

Want a real number, for *your* case? [Talk to us](https://techtelligence.net/en/contact) and tell us which problem you want to solve first.$enb1$,
    array['IA', 'Empresas', 'Investimento'],
    true,
    now()
  );

-- 2 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'empresa-pronta-para-ia-7-sinais',
    'is-your-company-ready-for-ai-7-signs',
    'Sua empresa está pronta para IA? 7 sinais de que o problema são os dados',
    'Is your company ready for AI? 7 signs your data is the real problem',
    $ptx2$Antes de contratar qualquer ferramenta de IA, faça este teste rápido: 7 sinais de que os seus dados vão sabotar o projeto — e o que fazer em cada um deles.$ptx2$,
    $enx2$Before you buy any AI tool, run this quick test: 7 signs your data will sabotage the project — and what to do about each one.$enx2$,
    $ptb2$A maioria dos projetos de IA que fracassam não fracassa no modelo — fracassa nos dados. A ferramenta funciona na demo, o contrato é assinado e, meses depois, as respostas vêm erradas, incompletas ou simplesmente não vêm. Antes de investir, vale fazer um teste honesto: **sua empresa está pronta para IA?**

Construindo plataformas de dados e ambientes de IA, aprendemos a reconhecer os sinais de longe. Aqui estão os sete mais comuns — e o que fazer em cada um.

## 1. Cada área apresenta um número diferente para a mesma pergunta

Faturamento do mês segundo o financeiro: um valor. Segundo o comercial: outro. Se as pessoas já não confiam nos números, nenhuma IA construída sobre eles será confiável.

**O que fazer:** eleger uma fonte oficial por indicador — antes de qualquer ferramenta, é uma decisão de gestão.

## 2. Fechar o relatório do mês leva dias (e passa por copiar e colar)

Consolidação manual de planilhas é o sintoma clássico de dados espalhados e sem integração. IA sobre esse processo só automatiza a bagunça.

**O que fazer:** automatizar a coleta dos dados desses relatórios primeiro. É, aliás, um ótimo primeiro projeto de dados: valor visível em semanas.

## 3. Os dados importantes vivem em planilhas e caixas de e-mail

Contratos em anexos, cadastro de clientes em uma planilha com dezessete abas, histórico de preços na cabeça de alguém. O que não está acessível de forma estruturada não alimenta IA nenhuma.

**O que fazer:** mapear onde vive o dado crítico de cada processo — só o mapa já revela por onde começar.

## 4. Ninguém sabe dizer quem pode acessar o quê

Se o acesso aos dados é "todo mundo vê tudo" (ou o oposto: cada dado preso em um sistema), qualquer projeto de IA vira um risco de privacidade. Com a LGPD, isso não é detalhe.

**O que fazer:** definir donos e regras de acesso para os dados sensíveis antes de conectá-los a qualquer ferramenta.

## 5. O histórico é curto, cheio de buracos ou não confiável

Previsão de demanda, análise de churn, priorização — tudo isso aprende com o passado. Se o passado registrado não reflete o que aconteceu, a IA aprende a coisa errada com convicção.

**O que fazer:** começar a registrar direito *agora*. Dado histórico não se compra depois.

## 6. Cada sistema chama o mesmo cliente de um jeito

No ERP é "ACME LTDA", no CRM é "Acme", no suporte é o e-mail do comprador. Sem unificar quem é quem, qualquer visão "360º do cliente" — com ou sem IA — é ficção.

**O que fazer:** padronizar identificadores nos cadastros principais (cliente, produto, fornecedor). Trabalho pouco glamouroso, retorno enorme.

## 7. Só uma pessoa "entende dos dados"

Se a empresa inteira depende de uma pessoa para extrair qualquer número, você não tem uma área de dados — tem um ponto único de falha.

**O que fazer:** documentar as extrações que essa pessoa faz e transformá-las em rotinas automatizadas e acessíveis.

## Reprovou no teste? Ótimo — agora você sabe por onde começar

Nenhuma empresa passa nos sete. A boa notícia: **você não precisa arrumar tudo antes de começar com IA.** O caminho que aplicamos nos nossos projetos é escolher um caso de uso de valor claro e arrumar primeiro *os dados que esse caso exige* — a fundação cresce guiada por resultado, não por perfeccionismo. Explicamos o método em [por onde sua empresa deve começar](https://techtelligence.net/blog/ia-na-pratica-por-onde-sua-empresa-deve-comecar) e o investimento típico em [quanto custa implementar IA](https://techtelligence.net/blog/quanto-custa-implementar-ia-na-empresa).

Se quiser um diagnóstico honesto do seu cenário — sem hype e sem projeto grandioso — é o que a nossa [consultoria em Dados & IA](https://techtelligence.net/consultoria) faz. [Fale com a gente](https://techtelligence.net/contato).$ptb2$,
    $enb2$Most AI projects that fail don't fail at the model — they fail at the data. The tool works in the demo, the contract gets signed, and months later the answers come back wrong, incomplete, or not at all. Before investing, it's worth running an honest test: **is your company actually ready for AI?**

Building data platforms and AI environments for companies, we've learned to spot the warning signs from a distance. Here are the seven most common — and what to do about each.

## 1. Every department reports a different number for the same question

Monthly revenue according to finance: one figure. According to sales: another. If people already don't trust the numbers, no AI built on top of them will be trustworthy either.

**What to do:** elect one official source per indicator — before any tool, this is a management decision.

## 2. Closing the monthly report takes days (and involves copy-paste)

Manual spreadsheet consolidation is the classic symptom of scattered, unintegrated data. AI on top of that process just automates the mess.

**What to do:** automate the data collection behind those reports first. It's also a great first data project: visible value in weeks.

## 3. Critical data lives in spreadsheets and inboxes

Contracts in attachments, the customer base in a seventeen-tab spreadsheet, price history in someone's head. Data that isn't accessible in a structured way feeds no AI at all.

**What to do:** map where the critical data of each process lives — the map alone reveals where to start.

## 4. Nobody can say who has access to what

If data access is "everyone sees everything" (or the opposite: every dataset locked in its own system), any AI project becomes a privacy risk. Under laws like LGPD and GDPR, that's not a detail.

**What to do:** define owners and access rules for sensitive data before connecting it to any tool.

## 5. Your history is short, full of gaps, or unreliable

Demand forecasting, churn analysis, prioritization — they all learn from the past. If the recorded past doesn't reflect what happened, the AI confidently learns the wrong thing.

**What to do:** start recording properly *now*. Historical data can't be bought later.

## 6. Every system calls the same customer something different

In the ERP it's "ACME LLC", in the CRM it's "Acme", in support it's the buyer's email address. Without unifying who is who, any "360º customer view" — with or without AI — is fiction.

**What to do:** standardize identifiers in your core records (customer, product, supplier). Unglamorous work, enormous payoff.

## 7. Only one person "understands the data"

If the whole company depends on one person to extract any number, you don't have a data capability — you have a single point of failure.

**What to do:** document the extractions that person runs and turn them into automated, accessible routines.

## Failed the test? Good — now you know where to start

No company passes all seven. The good news: **you don't need to fix everything before starting with AI.** The path we apply in our own projects is to pick one use case with clear value and fix *the data that use case requires* first — the foundation grows guided by results, not perfectionism. We explain the method in [where your company should start](https://techtelligence.net/en/blog/ai-in-practice-where-your-company-should-start) and the typical investment in [how much it costs to implement AI](https://techtelligence.net/en/blog/how-much-does-it-cost-to-implement-ai).

If you'd like an honest diagnosis of your scenario — no hype, no grand project — that's what our [Data & AI consulting](https://techtelligence.net/en/consulting) does. [Talk to us](https://techtelligence.net/en/contact).$enb2$,
    array['Dados', 'IA', 'Empresas'],
    true,
    now() - interval '1 hour'
  );

-- 3 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'como-migrar-para-ti-sem-experiencia',
    'how-to-start-a-tech-career-with-no-experience',
    'Como migrar para TI sem experiência: o guia para começar do zero',
    'How to start a tech career with no experience: a step-by-step guide',
    $ptx3$Sem faculdade de computação, sem experiência e depois dos 30? Dá, sim. Um passo a passo honesto para planejar sua transição de carreira para a tecnologia.$ptx3$,
    $enx3$No computer science degree, no experience, past your twenties? You can still do it. An honest, step-by-step plan for switching your career into tech.$enx3$,
    $ptb3$Se você digitou "como migrar para TI sem experiência" no Google, provavelmente já sentiu as duas coisas ao mesmo tempo: a vontade de mudar e a dúvida de se é possível. A resposta curta: **é possível, e acontece todos os dias** — o mercado de tecnologia contrata gente vinda do direito, da enfermagem, do varejo, da cozinha. A resposta longa é este guia: o que fazer, em que ordem e no que não perder tempo.

## Primeiro, os mitos que te impedem de começar

- **"Preciso de faculdade de computação."** Não para a maioria das vagas. O mercado contrata por habilidade demonstrada — projetos, portfólio, raciocínio — mais do que por diploma.
- **"Estou velho demais."** Maturidade, responsabilidade e conhecimento de outras áreas são vantagens competitivas, não defeitos. Times técnicos precisam de gente que entende de negócio, de gente e de prazo.
- **"Preciso ser gênio em matemática."** Para a maioria das áreas (desenvolvimento, dados, DevOps), o que se usa é lógica e resolução de problemas — habilidades que se treinam.
- **"Preciso de inglês fluente antes de começar."** Inglês técnico de leitura se aprende junto com o resto. Não espere a fluência para dar o primeiro passo.

## Passo 1 — Escolha uma direção (sem casamento)

Você não precisa acertar de primeira, precisa *começar*. As portas de entrada mais comuns:

- **Desenvolvimento (front-end, back-end)** — construir sites, aplicativos e sistemas.
- **Dados (análise, engenharia)** — transformar dados em decisões; se essa área te atrai, veja [qual papel combina com você](https://techtelligence.net/blog/analista-engenheiro-cientista-de-dados-qual-a-diferenca).
- **DevOps / infraestrutura** — automatizar e operar os ambientes onde tudo roda.

Escolha pela afinidade com o tipo de problema, não pelo salário da vaga sênior que você viu no LinkedIn. As bases se aproveitam: mudar de trilha depois custa muito menos do que você imagina.

## Passo 2 — Monte uma rotina de estudo que caiba na sua vida

Consistência vence intensidade: **1 a 2 horas por dia, todos os dias**, superam a maratona de domingo que não se sustenta. Duas regras que economizam meses:

- Aprenda *fazendo*: para cada hora de vídeo ou leitura, uma hora construindo algo.
- Siga uma trilha estruturada em vez de colecionar cursos soltos — ter ordem e um objetivo por etapa evita o ciclo eterno de "curso de introdução".

## Passo 3 — Crie provas públicas de que você sabe

Sem experiência profissional, seu portfólio *é* a sua experiência. Publique projetos no GitHub — pequenos e completos valem mais que grandes e abandonados. Use dados e problemas reais (dados públicos do governo, um controle para o seu próprio orçamento, uma automação para o seu trabalho atual). Documente a jornada no LinkedIn: recrutadores encontram quem aparece.

## Passo 4 — Transforme sua experiência anterior em vantagem

Quem migra de carreira não começa do zero — começa com um diferencial. O ex-contador entende o negócio que o analista de dados atende; a ex-enfermeira conhece a rotina que o sistema de saúde precisa resolver. Monte sua narrativa em uma frase: *"eu venho da área X, e por isso resolvo problemas de tecnologia da área X melhor que a maioria."* Essa narrativa — no LinkedIn, no currículo e na entrevista — muda o jogo.

## Passo 5 — Candidate-se do jeito certo

- Atende a ~70% dos requisitos? **Candidate-se.** Vaga é lista de desejos, não checklist eliminatório.
- Personalize o topo do currículo para cada vaga, destacando projetos relevantes.
- Ative sua rede: uma indicação vale mais que cinquenta candidaturas frias.
- Trate a busca como um funil: registre candidaturas, respostas e entrevistas, e ajuste o que não está convertendo.

## Quanto tempo leva?

Sendo honesto: **meses, não semanas** — e não existe prazo garantido (desconfie de quem promete um). O que encurta o caminho é constância, projetos reais e orientação de quem já conhece o mercado. O que alonga é pular etapas e estudar sem direção.

## Você não precisa fazer isso sozinho

Dá para trilhar esse caminho por conta própria — muita gente consegue. Se você prefere estrutura e companhia, é para isso que existem o nosso [curso de transição de carreira](https://techtelligence.net/curso), desenhado para quem parte do zero, e a nossa [mentoria 1:1](https://techtelligence.net/mentoria) — estratégia de carreira, LinkedIn e preparação para entrevistas, com quem contrata e trabalha na área todos os dias.$ptb3$,
    $enb3$If you typed "how to start a tech career with no experience" into Google, you've probably felt both things at once: the urge to change and the doubt about whether it's possible. The short answer: **it is possible, and it happens every day** — the tech market hires people coming from law, nursing, retail, restaurant kitchens. The long answer is this guide: what to do, in what order, and where not to waste time.

## First, the myths keeping you from starting

- **"I need a computer science degree."** Not for most roles. The market hires demonstrated skill — projects, portfolio, reasoning — more than diplomas.
- **"I'm too old."** Maturity, accountability and knowledge of other fields are competitive advantages, not defects. Technical teams need people who understand business, people and deadlines.
- **"I need to be a math genius."** For most areas (development, data, DevOps), what you actually use is logic and problem-solving — skills you can train.
- **"I need fluent English first."** In non-English-speaking markets, technical reading skills grow alongside everything else. Don't wait for fluency to take the first step.

## Step 1 — Pick a direction (no lifetime commitment)

You don't need to get it right on the first try; you need to *start*. The most common entry doors:

- **Development (front-end, back-end)** — building websites, apps and systems.
- **Data (analysis, engineering)** — turning data into decisions; if this field attracts you, see [which role fits you](https://techtelligence.net/en/blog/data-analyst-vs-data-engineer-vs-data-scientist).
- **DevOps / infrastructure** — automating and operating the environments where everything runs.

Choose by affinity with the type of problem, not by the senior-level salary you saw on LinkedIn. The foundations transfer: switching tracks later costs far less than you imagine.

## Step 2 — Build a study routine that fits your life

Consistency beats intensity: **1–2 hours a day, every day**, outperforms the Sunday marathon that never lasts. Two rules that save months:

- Learn by *doing*: for every hour of video or reading, one hour building something.
- Follow a structured path instead of collecting scattered courses — having an order and a goal per stage breaks the eternal "intro course" loop.

## Step 3 — Create public proof that you know your stuff

Without professional experience, your portfolio *is* your experience. Publish projects on GitHub — small and finished beats big and abandoned. Use real data and real problems (open government data, a tracker for your own budget, an automation for your current job). Document the journey on LinkedIn: recruiters find people who show up.

## Step 4 — Turn your previous career into an advantage

Career changers don't start from zero — they start with an edge. The former accountant understands the business the data analyst serves; the former nurse knows the routines a healthcare system needs to solve. Build your narrative in one sentence: *"I come from field X, which is why I solve field X's technology problems better than most."* That narrative — on LinkedIn, in your résumé, in the interview — changes the game.

## Step 5 — Apply the right way

- Do you meet ~70% of the requirements? **Apply.** A job post is a wish list, not an elimination checklist.
- Tailor the top of your résumé for each role, highlighting relevant projects.
- Activate your network: one referral is worth more than fifty cold applications.
- Treat the search as a funnel: track applications, replies and interviews, and fix whatever isn't converting.

## How long does it take?

Honestly: **months, not weeks** — and there is no guaranteed timeline (distrust anyone who promises one). What shortens the path is consistency, real projects and guidance from people who know the market. What stretches it is skipping steps and studying without direction.

## You don't have to do it alone

You can walk this path on your own — many people do. If you'd rather have structure and company, that's what our [career-transition course](https://techtelligence.net/en/course) is for, designed for people starting from zero, along with our [1:1 mentorship](https://techtelligence.net/en/mentorship) — career strategy, LinkedIn and interview preparation, with people who hire and work in the field every day.$enb3$,
    array['Carreira', 'TI'],
    true,
    now() - interval '2 hours'
  );

-- 4 ─────────────────────────────────────────────────────────────────────────
insert into public.posts
  (slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, is_published, published_at)
values
  (
    'analista-engenheiro-cientista-de-dados-qual-a-diferenca',
    'data-analyst-vs-data-engineer-vs-data-scientist',
    'Analista, engenheiro ou cientista de dados: qual a diferença e por onde começar?',
    'Data analyst, data engineer or data scientist: what''s the difference?',
    $ptx4$Os três trabalham com dados, mas o dia a dia, as ferramentas e a porta de entrada são bem diferentes. Compare os papéis e descubra qual combina com o seu perfil.$ptx4$,
    $enx4$All three work with data, but the day-to-day, the tools and the entry path are very different. Compare the roles and find the one that fits your profile.$enx4$,
    $ptb4$A área de dados é uma das portas de entrada mais procuradas por quem está migrando para a tecnologia — e uma das mais confusas de fora. **Analista de dados, engenheiro de dados e cientista de dados** parecem variações do mesmo cargo, mas o dia a dia, as ferramentas e o caminho de entrada são bem diferentes. Escolher sem entender essa diferença custa meses de estudo na direção errada.

## O que faz um analista de dados?

O analista responde perguntas do negócio com dados: *por que as vendas caíram no Sul? Qual campanha trouxe clientes que ficam?* No dia a dia, isso significa consultar bases com **SQL**, organizar números em planilhas e construir dashboards em ferramentas de BI (Power BI, Looker, Tableau).

É o papel mais próximo do negócio — e por isso a **porta de entrada mais comum** da área: exige menos bagagem técnica para começar e aproveita ao máximo a experiência de quem veio de outra carreira e entende o problema por trás dos números.

## O que faz um engenheiro de dados?

Se o analista usa os dados, o engenheiro constrói o caminho por onde eles chegam: pipelines que coletam, limpam, integram e entregam dados confiáveis, todos os dias, sem intervenção manual. É o "encanamento" da casa — invisível quando funciona, sentido por todos quando falha.

As ferramentas centrais são **SQL e Python**, além de nuvem e orquestração de processos. É o papel mais próximo da engenharia de software e, hoje, um dos que têm **mais demanda em relação à oferta de profissionais** — toda empresa que quer usar IA descobre primeiro que precisa de engenharia de dados.

## O que faz um cientista de dados?

O cientista usa estatística e machine learning para prever e recomendar: qual cliente tende a cancelar, qual estoque dimensionar, qual preço testar. É um trabalho mais exploratório e experimental — formular hipóteses, treinar modelos, validar resultados.

Importante saber: **raramente é a primeira função de quem está entrando na área.** A maioria dos cientistas passou antes por análise ou engenharia, e boa parte das empresas só cria essa cadeira quando a fundação de dados já existe.

## Os três lado a lado

| | Analista de dados | Engenheiro de dados | Cientista de dados |
|---|---|---|---|
| **Foco** | Responder perguntas do negócio | Construir a infraestrutura de dados | Prever e recomendar com modelos |
| **Ferramentas típicas** | SQL, planilhas, BI | SQL, Python, nuvem | Python, estatística, ML |
| **Perfil que combina** | Curiosidade pelo negócio, comunicação | Gosto por construir e automatizar | Gosto por estatística e experimentos |
| **Porta de entrada** | A mais acessível | Exige mais base técnica | Raramente a primeira função |

## Qual escolher para começar?

- Você gosta de **entender o negócio** e transformar perguntas em respostas? Comece por **análise de dados**.
- Você gosta de **construir coisas que funcionam sozinhas** e sente satisfação em automatizar? Vá de **engenharia de dados**.
- Você se encanta por **estatística, hipóteses e previsão**? Comece por análise mesmo assim — e evolua para ciência de dados com a base montada.

E uma boa notícia para quem está em dúvida: **os três caminhos começam no mesmo lugar — SQL.** É a habilidade mais pedida da área inteira, e nada do que você aprender se perde se mudar de trilha depois.

## Como dar o primeiro passo

Aprenda SQL, domine planilhas de verdade e escolha uma ferramenta de BI para praticar. Depois, monte dois ou três projetos com dados públicos reais (há ótimas bases abertas do governo) e publique — portfólio conta mais que certificado. O caminho completo da transição, incluindo LinkedIn e busca de vagas, está no nosso [guia para migrar para TI sem experiência](https://techtelligence.net/blog/como-migrar-para-ti-sem-experiencia).

Se preferir percorrer isso com estrutura e orientação, conheça o nosso [curso de transição de carreira](https://techtelligence.net/curso) e a [mentoria 1:1](https://techtelligence.net/mentoria) — construídas por quem contrata e trabalha com dados todos os dias.$ptb4$,
    $enb4$The data field is one of the most sought-after entry doors for people switching into tech — and one of the most confusing from the outside. **Data analyst, data engineer and data scientist** sound like variations of the same job, but the day-to-day, the tools and the entry path are very different. Choosing without understanding the difference costs months of study in the wrong direction.

## What does a data analyst do?

The analyst answers business questions with data: *why did sales drop in the South region? Which campaign brought customers who stay?* Day to day, that means querying databases with **SQL**, organizing numbers in spreadsheets and building dashboards in BI tools (Power BI, Looker, Tableau).

It's the role closest to the business — and therefore the **most common entry door** into the field: it demands the least technical baggage to start and makes the most of the experience of career changers who understand the problem behind the numbers.

## What does a data engineer do?

If the analyst uses the data, the engineer builds the path it travels: pipelines that collect, clean, integrate and deliver reliable data, every day, without manual intervention. It's the plumbing of the house — invisible when it works, felt by everyone when it fails.

The core tools are **SQL and Python**, plus cloud platforms and process orchestration. It's the role closest to software engineering and, today, one with the **highest demand relative to the supply of professionals** — every company that wants to use AI discovers first that it needs data engineering.

## What does a data scientist do?

The scientist uses statistics and machine learning to predict and recommend: which customer is likely to churn, how much stock to plan, which price to test. It's more exploratory and experimental work — forming hypotheses, training models, validating results.

Worth knowing: **it's rarely the first role for someone entering the field.** Most data scientists came through analysis or engineering first, and many companies only create the position once the data foundation already exists.

## The three side by side

| | Data analyst | Data engineer | Data scientist |
|---|---|---|---|
| **Focus** | Answering business questions | Building the data infrastructure | Predicting and recommending with models |
| **Typical tools** | SQL, spreadsheets, BI | SQL, Python, cloud | Python, statistics, ML |
| **Fits people who like** | Business curiosity, communication | Building and automating | Statistics and experiments |
| **Entry door** | The most accessible | Needs more technical grounding | Rarely the first role |

## Which one should you choose to start?

- You enjoy **understanding the business** and turning questions into answers? Start with **data analysis**.
- You enjoy **building things that run on their own** and find satisfaction in automating? Go with **data engineering**.
- You're fascinated by **statistics, hypotheses and prediction**? Start with analysis anyway — and grow into data science once the foundation is in place.

And good news if you're undecided: **all three paths start in the same place — SQL.** It's the most requested skill in the entire field, and nothing you learn is wasted if you switch tracks later.

## How to take the first step

Learn SQL, get genuinely good at spreadsheets and pick one BI tool to practice. Then build two or three projects with real public data (open government datasets are great for this) and publish them — a portfolio counts more than a certificate. The full transition path, including LinkedIn and the job hunt, is in our [guide to starting a tech career with no experience](https://techtelligence.net/en/blog/how-to-start-a-tech-career-with-no-experience).

If you'd rather walk it with structure and guidance, take a look at our [career-transition course](https://techtelligence.net/en/course) and our [1:1 mentorship](https://techtelligence.net/en/mentorship) — built by people who hire and work with data every day.$enb4$,
    array['Carreira', 'Dados'],
    true,
    now() - interval '3 hours'
  );
