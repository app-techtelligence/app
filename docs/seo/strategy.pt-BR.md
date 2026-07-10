# Estratégia de SEO — o passo a passo até 10 mil visitas/dia

> English version: [strategy.md](strategy.md)

**Meta:** 10.000 visitas orgânicas/dia (~300 mil/mês). **Prazo honesto:** 12–24 meses de execução consistente. Este arquivo é o manual do operador — o que *você* faz, na ordem certa. O maquinário (`/seo-strategy`, `/blog-post`, `/blog-cover`, `/seo-audit`) faz o trabalho pesado; o backlog vive em [content-plan.md](content-plan.md).

---

## Fase 0 — Fundações (esta semana, uma única vez)

1. **Google Search Console (GSC)** — a ferramenta mais importante de todas. Mostra quais buscas geram impressões/cliques, sua posição média e problemas de indexação. Sem ela, todo o resto é chute.
   1. Acesse https://search.google.com/search-console e entre com sua conta Google.
   2. "Adicionar propriedade" → escolha o tipo **Domínio** (cartão da esquerda) → digite `techtelligence.net`.
   3. O Google mostra um **registro TXT** (`google-site-verification=...`). Copie.
   4. Painel da Cloudflare → techtelligence.net → **DNS → Registros → Adicionar registro**: Tipo `TXT`, Nome `@`, Conteúdo = o texto copiado. Salve.
   5. De volta ao GSC → **Verificar** (o DNS da Cloudflare propaga em minutos).
   6. No GSC: **Sitemaps** → informe a **URL completa** `https://techtelligence.net/sitemap.xml` → Enviar (propriedades do tipo Domínio rejeitam caminhos relativos como `sitemap.xml`). O status pode mostrar "Não foi possível buscar" por algumas horas — é normal; vira "Sucesso" sozinho.
   7. Daqui em diante, a cada post publicado: **Inspeção de URL** → cole a URL do post → **Solicitar indexação** (URL em PT e em EN). Em domínio novo, isso reduz a descoberta de semanas para dias.
   - Os primeiros dados aparecem em ~2 dias. Relatórios que importam: **Desempenho** (consultas, cliques, impressões, CTR, posição) e **Indexação → Páginas**.
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters → "Importar do Google Search Console" (um clique; tráfego grátis de Bing/DuckDuckGo/buscas com IA).
3. **JSON-LD de Article** — peça ao Claude para implementar os dados estruturados nos posts (lacuna conhecida, apontada pelo `/seo-audit`).
4. **Página da empresa no LinkedIn** pronta, e o hábito do preview de compartilhamento aprendido (CLAUDE.md §5.1: Post Inspector antes de compartilhar qualquer URL já compartilhada antes).

## Fase 1 — Cadência (meses 1–3): publicar 2–3 posts/semana

O ciclo semanal (≈2–4h do seu tempo; o Claude escreve):

| Dia | Ação | Quem |
|---|---|---|
| Seg | `/seo-strategy` — escolher os 2–3 posts da semana no plano | Claude |
| Seg | `/blog-post` — escrever; rodar o SQL no Supabase | Claude / você (SQL) |
| Ter | `/blog-cover` — prompts do Gemini → gerar → soltar os arquivos → subir capas | você + Claude |
| Ter | GSC: **Solicitar indexação** de cada URL nova (PT + EN) | você |
| Qua | Compartilhar cada post no LinkedIn (perfil + página da empresa) | você |
| qualquer | Adicionar 1 link de um post antigo para cada post novo (editor admin ou seed de UPDATE) | você / Claude |

Regras que compõem juros: aprofundar um cluster antes de abrir outro; nunca quebrar a cadência por perfeccionismo — um post bom esta semana vale mais que um post perfeito no mês que vem.

## Fase 2 — Autoridade (meses 3–6): links + decisões guiadas por dados

A essa altura o GSC tem dados reais. Adicione o ciclo mensal:

1. **`/seo-audit`** — checagem técnica de regressões.
2. **Revisão do GSC com o Claude**: exporte as consultas do relatório de Desempenho e cole/mande print; então:
   - posts com impressões mas **CTR < 1%** → reescrever título/resumo (problema de embalagem);
   - posts nas **posições 5–15** → expandir/aprofundar (os quase-vencedores são as vitórias mais baratas);
   - consultas em que você rankeia **sem ter post dedicado** → ideia nova no plano.
3. **Backlinks — 2 a 4 links reais/mês.** Em ordem de esforço/retorno para este nicho:
   - Publicar *artigos* no LinkedIn (não só posts) resumindo um post do blog, com link para o site.
   - Comunidades PT-BR: TabNews, dev.to, Medium — republicar resumos com link canônico para o original.
   - Guest posts em blogs brasileiros de tecnologia/negócios (os ângulos de custo de IA e prontidão viajam bem).
   - Parceiros/clientes/ferramentas que você usa: diretórios, páginas "empresas que usam X", bios de palestrante.
4. **Distribuição além do LinkedIn**: comunidades de WhatsApp/Telegram relevantes (compartilhe quando for genuinamente útil, nunca spam).

## Fase 3 — Escala (meses 6–24): de centenas para milhares/dia

- **Expandir clusters vencedores em série**: ex. "quanto ganha um X" para cada função de dados/TI; "IA para [setor]" para cada indústria — cada um é um post real, acelerado pelo `/blog-post`.
- **Ímãs de links**: um ativo interativo rende mais links que 20 posts — um explorador de salários, um auto-diagnóstico de "prontidão para IA", um PDF de roadmap de carreira em dados. Construir quando a cadência estiver estável.
- **Mercado EN**: o espelho bilíngue começa a puxar cauda longa internacional; confira o relatório de países do GSC e invista se estiver crescendo.
- **Economia de atualização**: todo post com mais de 6 meses passa por revisão (atualizar números, adicionar seções, atualizar `updated_at`) — atualizações frequentemente rendem mais que posts novos.

## Marcos (faixas honestas — meça mensalmente, julgue trimestralmente)

| Quando | Tráfego orgânico esperado | Se estiver abaixo, verifique |
|---|---|---|
| Mês 1–2 | ~0–10/dia (atraso de indexação é normal) | Cobertura no GSC: as páginas estão indexadas? |
| Mês 3 | 30–100/dia | A cadência foi mantida? Títulos/CTR? |
| Mês 6 | 200–800/dia | Backlinks começaram? Profundidade dos clusters? |
| Mês 12 | 1,5 mil–4 mil/dia | Dobrando a aposta nos vencedores do GSC? |
| Mês 18–24 | **10 mil/dia** | Alavancas de escala (série, ímãs de link, EN) |

## Quem faz o quê

| Claude (skills/agentes) | Você |
|---|---|
| Escolher temas, validar SERPs, escrever posts, pipeline de capas, auditorias, JSON-LD e correções de código, seeds de UPDATE | Rodar SQL no Supabase, subir capas, configurar GSC/Bing + solicitar indexação, compartilhar/distribuir, construir relações para backlinks, colar dados do GSC todo mês |

**A única métrica que prevê tudo na fase 1: posts publicados por semana.** Proteja a cadência.
