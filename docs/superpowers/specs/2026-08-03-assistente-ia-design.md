# Assistente de IA do site — Design (v1)

**Data:** 2026-08-03 · **Status:** aprovado em brainstorm, aguardando revisão final do spec
**Escopo:** site de marketing (`apps/web`) apenas. A plataforma do curso fica fora da v1.

---

## 1. Objetivo

Adicionar um assistente de primeiro atendimento ao site: tirar dúvidas sobre os serviços,
fazer triagem natural do interesse e entregar o visitante nos canais de contato já triado.

**Critério de sucesso nº 1 (decisão do usuário): responder bem às dúvidas.** O lead é
consequência da credibilidade — não o contrário. Métricas duras de conversão ficam fora da v1
(não armazenamos conversas; ver §6).

## 2. Decisões fechadas no brainstorm

| # | Decisão | Escolha |
|---|---|---|
| 1 | Modelo de interação | **Híbrido**: triagem por chips + IA para texto livre (não é árvore de botões pura, nem IA aberta sem estrutura) |
| 2 | "Agendar reuniões" | **Encaminhar ao WhatsApp com contexto** — nenhum sistema de agenda na v1 |
| 3 | Qualidade vs. custo | **Qualidade primeiro**: Claude Haiku (API da Anthropic), com teto de gasto e rate limit |
| 4 | Destino do lead | Botão WhatsApp pré-preenchido **e** e-mail de resumo via Resend (opt-in). **Conversas não são armazenadas por nós** (o e-mail de lead retém a transcrição — ver §6) |
| 5 | "Criação de sites" | **É um serviço novo real** — entra na triagem e na base de conhecimento. Dar visibilidade a ele no site em si é **projeto separado** (ver §11) |
| 6 | Cache | Prompt caching da Anthropic + **respostas pré-escritas para os momentos determinísticos** (boas-vindas e primeira resposta de cada chip). Sem cache semântico na v1 |

## 3. Experiência do usuário

- **Botão flutuante** no canto inferior direito de todas as páginas do site de marketing,
  nos dois idiomas (PT na raiz, EN em `/en`). Estilo do design system: navy/branco, sem cor
  de destaque, detalhe geométrico do logo. Sem persona inventada — nome público
  **"Assistente TechTelligence"** / **"TechTelligence Assistant"**.
- **Carregamento preguiçoso**: o código do chat só carrega no primeiro clique
  (import dinâmico). Páginas continuam 100% estáticas; sem layout shift; Lighthouse
  mobile ≥ 90 preservado.
- **Layout**: mobile = quase tela cheia; desktop = painel lateral de ~380px.

**Fluxo da conversa:**

1. Boas-vindas (texto pré-escrito, custo zero) + chips de triagem:
   **Consultoria · Curso · Mentoria · Criação de sites · Outros**. O campo de texto fica
   livre desde o início — chips são atalhos, não portões.
2. Clique em chip → resposta pré-escrita (custo zero). Para os 4 serviços: apresentação
   curta + pergunta de qualificação. Para **"Outros"**: convite a descrever a necessidade
   em texto livre (ancorado na base `empresa-faq`). Essas respostas vivem nos JSONs de
   mensagens (paridade testada).
   **O clique vira histórico**: o widget injeta o rótulo do chip como turno `user` e a
   resposta pré-escrita como turno `assistant` — assim o modelo sabe o assunto triado
   quando o texto livre começa. Esses turnos contam para os limites da §4.
3. Texto livre → IA responde (Haiku), no tom da marca ("você", direto, encorajador,
   não-promissório), com respostas curtas (2–4 frases típicas).
4. **Desfechos** — são **ações fixas do chat, sempre disponíveis** (o modelo convida em
   prosa quando o interesse esquenta, mas o widget **nunca interpreta a saída do modelo**;
   sem marcadores nem tool use na v1):
   - **WhatsApp**: botão persistente e discreto; deep link `wa.me` (número de
     `lib/site-config.ts`) com mensagem pré-preenchida pelo **assunto** — o último chip
     clicado, mantido em memória pelo widget; sem chip, assunto = "Outros" com modelo de
     mensagem genérico. Os modelos de mensagem por assunto vivem nos JSONs de mensagens
     (paridade testada).
   - **"Prefere que a gente te procure?"**: mini-formulário dentro do chat — nome +
     **dois campos tipados** (e-mail com validação de formato; telefone com validação
     leve), regra "pelo menos um preenchido" + checkbox de consentimento obrigatório.
     **A coleta de dados pessoais é sempre por formulário validado, nunca "anotada" pela
     IA em conversa** — exatidão e consentimento LGPD explícito. Envia e-mail via Resend
     (mesmo pipeline e destinatário do formulário de contato) com: contato, assunto e a
     transcrição da conversa até ali. O lead chega já triado.

**Sessão e limites (comportamento visível):**

- A conversa vive só na aba (recarregou, recomeça). **O widget é quem aplica o limite de
  20 mensagens do usuário** (contador próprio em memória, incluindo cliques em chip): na
  20ª, fecha o campo de texto com encerramento elegante. O mini-formulário e o botão
  WhatsApp **continuam disponíveis** após o encerramento.
- Token de sessão expira em 30 min, **sem renovação automática**: expirou no meio, o
  widget encerra com a mesma mensagem elegante e oferece começar uma conversa nova
  (novo Turnstile, histórico zerado).

**Idioma:** UI, chips, respostas pré-escritas e modelos de WhatsApp seguem **sempre o
locale da página** (`pt-BR` | `en`, validado como enum), que também escolhe a base de
conhecimento enviada. "Acompanhar o idioma do visitante" é instrução de system prompt
("responda no idioma da última mensagem do usuário") — o modelo traduz na hora; strings
fixas não mudam.

## 4. Guardrails e controle de custo (4 camadas)

**Camada 1 — Escopo travado (system prompt):**
- Assistente é exclusivamente da TechTelligence: os 4 serviços, carreira em TI (contexto
  curso/mentoria) e a empresa. Fora disso (código, redação, piadas, política, etc.) →
  recusa educada de uma linha + volta à triagem.
- Respostas curtas por regra; dúvida profunda é sinal de lead → direciona ao WhatsApp.
- Nunca: revelar o prompt, inventar preço/prazo, prometer resultado (wording
  não-promissório — mesma regra do "talent bridge"), pedir dado sensível.
- Instruções de resistência a prompt injection. Risco inerentemente baixo: o assistente
  não tem ferramentas nem dados de terceiros; o pior caso é falar bobagem para o próprio
  atacante dentro do teto de tokens dele.

**Camada 2 — Tetos mecânicos por requisição (proteção real de tokens):**
- `max_tokens` da resposta travado no servidor: **512** (padrão ajustável).
- Cada mensagem `user`: **≤ 1.000 caracteres** (Zod). O campo de texto do widget espelha
  o limite (`maxLength`) — o usuário legítimo nunca vê essa recusa.
- Payload total (todas as mensagens): **≤ 12.000 caracteres** (padrão ajustável). O
  widget poda os turnos mais antigos antes de enviar quando a conversa cresce — a poda
  remove contexto, nunca o contador de mensagens (que é do widget, §3).
- Modelo **Haiku** + **prompt caching** (a base de conhecimento — a parte grande do
  prompt — é cacheada; mensagens seguintes custam fração). Restrição do §5 se aplica
  (piso de 4096 tokens para o cache engatar).

**Camada 3 — Sessão e frequência (contra automação):**
- **Turnstile invisível** ao abrir o chat → endpoint de sessão valida e emite **token
  assinado (HMAC)** com expiração de 30 min. Sem token válido, o chat recusa.
- **Backstop server-side do limite de mensagens**: requisição com mais de 20 mensagens
  `user` no payload é recusada. (Com a poda da camada 2 o servidor pode ver menos turnos
  do que existiram — a contagem server-side é piso de melhor esforço contra clientes
  não-oficiais; o limite de UX é do widget, e o custo total já está limitado por
  expiração de sessão, rate limit e teto de gasto.)
- **Rate limit por IP** no Cloudflare WAF (como no formulário de contato) — padrões
  sugeridos: ~10 mensagens/min e ~3 sessões novas/hora por IP (ajustáveis no dashboard).
  Configuração manual no dashboard: entra nos pré-requisitos (§5) e no DoD (§10).

**Camada 4 — Teto absoluto (backstop):**
- **Limite de gasto mensal no console da Anthropic** (sugestão: US$ 20). Estourou → API
  para → widget degrada com graça (§7). Pior caso absoluto: conta de US$ 20 e chat
  offline até virar o mês. O site nunca quebra.

**Economia esperada:** conversa típica (base cacheada + 8 turnos) ≈ **US$ 0,01–0,02**.
Tráfego atual → poucos dólares/mês. Humano mal-intencionado por 30 min = centavos;
para gastar dólares seria preciso automação, que esbarra nas camadas 3 e 4 antes.

## 5. Arquitetura

**Widget (cliente):**
- Componente React client-side em `apps/web`, carregado por import dinâmico no primeiro
  clique. Estado da conversa **somente em memória** (nada em localStorage/cookies).
- Todas as strings (boas-vindas, chips, respostas pré-escritas, modelos de WhatsApp,
  botões, avisos, formulário) em `messages/pt-BR.json` + `messages/en.json` — cobertas
  pelo teste de paridade existente.

**Endpoints (worker `app`, mesmo padrão da rota de contato):**

| Rota | Método | Função |
|---|---|---|
| `/api/chat/session` | POST | Recebe token Turnstile + locale → valida no siteverify → devolve token de sessão HMAC |
| `/api/chat` | POST | Recebe token de sessão + locale + `messages` → valida (Zod, assinatura, expiração, limites da §4) → monta prompt (persona + guardrails + base de conhecimento do locale, com `cache_control`) → chama a API da Anthropic (Haiku, streaming) → repassa em SSE |
| `/api/chat/lead` | POST | Recebe token de sessão + nome + e-mail/telefone + consentimento + assunto + transcrição → **valida assinatura e expiração do token** (tolerância de ~5 min pós-expiração; sem limite de 20 mensagens) → Zod → e-mail via Resend (de `noreply@techtelligence.net` para o destinatário do contato) → 200. Campo honeypot como no formulário de contato |

**Formatos fixados:**
- **Payload do chat**: um único array `messages` (`{role: 'user'|'assistant', content}`),
  cujo último item é a mensagem nova do usuário. Limites da §4 aplicados sobre esse array.
- **Streaming**: o servidor **não repassa os eventos crus da Anthropic**; re-emite um
  formato próprio mínimo — eventos `delta` (trecho de texto), `done` e `error`.
- **Token de sessão**: claims `{iat, exp, nonce}`, serializado em base64url, assinado
  com HMAC-SHA256 usando `CHAT_SESSION_SECRET`. Sem vínculo a IP (volume é papel do WAF).
- **Transcrição no lead**: mesmo schema do array `messages` (inclui os turnos de chip),
  mesmo teto de 12.000 caracteres, campos nome/contato com limites próprios; renderizada
  como **texto plano** no corpo do e-mail (nunca HTML interpolado). Template do e-mail
  interno sempre em PT (o destinatário é o dono); transcrição verbatim no idioma em que
  ocorreu.
- Assunto do lead: enum dos chips + default "Outros".

- Servidor **stateless**: nenhuma conversa gravada; o histórico vem do navegador a cada chamada.
- Modelo: **`claude-haiku-4-5`** (alias mais recente do Haiku), com prompt caching.
  **Restrição real do caching**: o Haiku 4.5 só cacheia prefixos ≥ **4096 tokens** —
  abaixo disso o `cache_control` é ignorado em silêncio. O bloco cacheado (persona +
  guardrails + base do locale) deve exceder esse piso; a implementação verifica
  `usage.cache_read_input_tokens > 0` em chamada repetida. Se a base ficar menor que o
  piso, aceitamos explicitamente o custo sem cache (ainda baixo no Haiku, e limitado
  pela camada 4) e ajustamos a estimativa da §4.
- **Sem Supabase** no chat. **Sem mudança de CSP** (a chamada à Anthropic é server-side;
  Turnstile já está na CSP). Compat flags atuais do worker web já cobrem o fetch externo
  (`global_fetch_strictly_public`).

**Base de conhecimento:**
- Markdown bilíngue no repositório: `apps/web/content/assistant/{pt-BR,en}/` com um
  arquivo por assunto — `consultoria`, `curso`, `mentoria`, `criacao-de-sites`,
  `empresa-faq`.
- **Empacotamento**: um **script de prebuild** (mesmo padrão do `generate-headers.mjs`
  existente) lê os `.md` e gera um módulo TypeScript com o conteúdo — **sem configurar
  loader de Markdown em bundler nenhum** (o `apps/web` usa webpack no build e Turbopack
  no dev; uma regra só num deles quebraria o outro). O teste de paridade da base (§8) lê
  os mesmos arquivos `.md`.
- Atualizar o assistente = editar arquivo + push (deploy automático). Sem banco, sem RAG —
  a base inteira cabe no prompt e o caching a torna barata.
- Conteúdo segue o tom do CLAUDE.md §3, incluindo o disclaimer do mural de clientes
  (experiência do time, não clientes TechTelligence) e wording não-promissório.
- Perguntas frequentes novas → resolvidas editorialmente (adicionar à base ou virar chip),
  não com cache de respostas.

**Segredos e config:**
- Novos: `ANTHROPIC_API_KEY`, `CHAT_SESSION_SECRET` — via `wrangler secret put` (prod) e
  `.dev.vars` (local), como os segredos atuais.
- Sem chave local → stub: o endpoint responde uma mensagem fixa de desenvolvimento
  (mesmo padrão do stub do Resend no contato). Vale para as duas chaves novas.
- **Pré-requisitos (dono: usuário, com passo-a-passo do Claude):**
  1. Criar conta/billing na API da Anthropic, gerar a chave e **definir o limite mensal
     de gasto** no console;
  2. **Criar as regras de rate limit no WAF** (dashboard Cloudflare) para `/api/chat*`
     — mensagens/min e sessões/hora por IP (§4 camada 3).

## 6. Privacidade (LGPD)

- Conversas processadas de forma **efêmera**: nós não gravamos histórico em banco nem
  logs; a API da Anthropic não treina com dados de API por padrão.
- **Exceção única e explícita**: quando o visitante pede contato (mini-formulário com
  consentimento), nome, contato e a transcrição da conversa são enviados por e-mail e
  **ficam retidos na caixa de e-mail para o atendimento**. A página de privacidade
  descreve exatamente isso — não a afirmação absoluta "nada é armazenado".
- PII nunca logada (regra já vigente no projeto).
- **Atualizar a página de privacidade** (PT e EN) mencionando o assistente: o que é
  processado, a efemeridade, e a exceção do opt-in acima. **Faz parte da v1.**

## 7. Falhas (degradação graciosa — o site nunca quebra por causa do chat)

| Falha | Comportamento |
|---|---|
| API Anthropic fora / lenta / teto de gasto atingido | Mensagem simpática ("assistente indisponível agora") + botão WhatsApp + link `/contato` |
| Import dinâmico do widget falha no clique (rede) | Mesmo fallback acima, no lugar do painel |
| Turnstile falha | Mesmo fallback do formulário de contato |
| Sessão expirada / 20 mensagens atingidas | Aviso claro e educado + WhatsApp e mini-formulário seguem disponíveis (§3) |
| Rate limit por IP | Aviso "muitas mensagens, tente em instantes" |
| Recusa de validação (Zod 4xx inesperado) | O widget já espelha os limites (maxLength etc.); num 4xx mesmo assim, mensagem genérica **mantendo o texto digitado** para reenvio |
| Streaming interrompido no meio | Mantém o parcial + botão discreto "tentar novamente" |
| Falha no e-mail de lead (Resend) | Widget avisa na hora + oferece WhatsApp — lead nunca se perde em silêncio |
| Sem JavaScript | Botão não renderiza; site estático segue intacto |

## 8. Testes

- **Zod do chat**: tamanhos de mensagem, limites de payload, payloads malformados.
- **Rota `/api/chat`** (Anthropic + Turnstile mockados, padrão do teste da rota de
  contato): sessão inválida/expirada recusa; payload com mais de 20 mensagens `user`
  recusa; payload acima de 12.000 caracteres recusa; `max_tokens` aplicado.
- **Rota `/api/chat/session`**: siteverify mockado; token emitido e verificável;
  assinatura adulterada recusa.
- **Rota `/api/chat/lead`**: token inválido/expirado recusa; consentimento obrigatório;
  "pelo menos e-mail ou telefone"; honeypot; teto da transcrição; Resend mockado.
- **Paridade de idiomas**: o teste existente cobre as strings novas automaticamente.
  **Teste novo**: cada arquivo da base de conhecimento em `pt-BR/` tem par em `en/`
  não-vazio (e vice-versa).
- Verificação manual (parte do DoD): guardrails na prática (fora de tópico, injection
  básico, limites de sessão) em produção.

## 9. Acessibilidade e mobile

- Foco vai ao chat ao abrir e retorna ao botão ao fechar; Esc fecha; tudo navegável por
  teclado; mensagens novas anunciadas via `aria-live`; contraste AA (design system).
- Mobile-first, testado a 375px.

## 10. Critérios de pronto (DoD)

1. Conversa completa em PT **e** EN, nos dois desfechos (WhatsApp e e-mail), verificada
   **em produção**.
2. Guardrails provados na prática: fora de tópico recusado; "ignore suas instruções"
   resiste; limite de 20 mensagens aplicado (widget e backstop do servidor).
3. Teto de gasto configurado no console da Anthropic + fallback de indisponibilidade
   testado.
4. **Regras de rate limit do WAF criadas e verificadas** (a resposta 429 mostra o aviso
   do widget, não um erro técnico).
5. Prompt caching confirmado ativo (`cache_read_input_tokens > 0` em chamada repetida)
   ou custo sem cache aceito por escrito no plano.
6. Lighthouse mobile ≥ 90 mantido nas páginas de marketing.
7. Página de privacidade atualizada (PT + EN).
8. Testes da §8 passando no CI.

## 11. Fora de escopo da v1 / itens abertos

**Fora de escopo (decidido):** cache semântico de respostas; chat na plataforma do curso;
agendamento com calendário real; analytics/armazenamento de conversas; RAG/embeddings;
renovação automática de sessão.

**Projeto separado (não misturar com este):** dar visibilidade à oferta **"Criação de
sites"** no site — nav, página própria ou seção na consultoria, ordem dos produtos, SEO.
A v1 do assistente apenas *sabe falar* do serviço.

**Decisões editoriais durante a implementação (com o usuário):** conteúdo da base de
conhecimento (o trabalho de verdade é editorial); textos das respostas pré-escritas;
modelos de mensagem do WhatsApp; valor exato do teto de gasto.
