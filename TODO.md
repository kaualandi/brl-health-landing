# BRL Health — Roadmap & TODO

> Documento vivo de ideias e tarefas para evoluir o projeto até ficar **100% funcional e pronto pra produção**.
> Estratégia: **frontend primeiro** (com services mock que já têm marcadores `// TODO: substituir por api...`), e **backend por último** (seção no fim).
> Foco atual declarado: **usabilidade e frontend**. BRL Fit fica como **"em breve"**.

**Legenda**
`[ ]` a fazer · `[~]` em andamento · `[x]` feito
🎨 frontend · 🔌 integração (front agora, back depois) · 🗄️ backend (fase final) · ✨ polish/UX · ♿ acessibilidade · 🚀 produção

---

## ✅ Entregue nesta leva

- **Auth de verdade no client:** `auth-store` + `useAuth()`, login persiste sessão e redireciona, `RequireAuth` protege `/nutri` e `/conta`.
- **Header dinâmico:** menu de usuário (avatar + dropdown) quando logado.
- **Feedback global:** `ToastProvider` fiado em login, contato e waitlist.
- **Estados de rota:** `not-found` (404), `error` global e `loading` do marketing.
- **Telas novas:** `/fit` (em breve + waitlist), `/conteudos` (lista + busca/filtro), `/conteudos/[slug]` (artigo completo, estático), `/conta`.
- **Services mock novos:** `waitlist.service` (com `// TODO` de backend).
- Tudo validado no browser (login → guarda → /nutri, waitlist, menu, artigos) e com **typecheck + lint + build verdes**.

**2ª leva:**
- **Onboarding inteligente:** logado pula o passo de criar conta (não pede e-mail/senha de novo) e salva o plano pro usuário atual.
- **Medidor de senha lúdico** (`PasswordStrength`) no cadastro — não obriga, só incentiva. Toggle de senha também no onboarding.
- **Upsell escalonado e dispensável** (`UpgradeNudge` + `plan-store`): Free→Pro (cita Família), Pro→Família, Família→nada. No `/nutri` e no `/conta`.
- **Confete** ao completar todos os hábitos do dia (`Confetti`, respeita reduced-motion).
- **Fix:** cards de conteúdo no `/nutri` agora são clicáveis (viram `/conteudos/[slug]`).

**3ª leva:**
- **Tela de planos própria** (`/precos`) — LP virou só apresentação que linka pra cá. Tier-aware: plano atual com botão disabled ("Você está aqui, mas pode melhorar 💪" no Free).
- **Checkout com form de pagamento** (`/checkout?plano=`) — resumo + cartão (mock `billing.service`), seta o tier no sucesso, guardado por auth. Cartão terminando em 0000 recusa (caminho de erro).
- **`/cadastro` não re-onboarda** quem já tem plano (manda direto pro `/nutri`); "refazer" continua funcionando (limpa antes).
- **Barra do `/nutri`** enxuta: só logo + menu de conta (saiu "Ir pro site" e "Refazer plano" — refazer vive no `/conta`).
- Nav/footer "Planos", nudge e CTAs dos planos agora apontam pro `/precos`.

**4ª leva — app /nutri mais fundo:**
- **Store de tracking** (`nutri-tracking` + hooks) com reset diário: água, peso e hábitos persistidos.
- **Tracker de água** interativo (copos de hoje vs meta do plano, +/-, pips), persistido.
- **Registro de peso** + gráfico SVG de evolução (seed com o peso do perfil).
- **Hábitos persistidos** + **streak** de dias completos (🔥), mantendo o confete.
- **`/nutri/perfil`** editável — recalcula o plano ao vivo (prévia) e salva.

**5ª leva — caminho humano (nutricionista):**
- **Card "Acompanhamento"** no `/nutri` com dois caminhos: cardápio por IA (já ativo) + consulta com nutricionista de verdade.
- **Agendar consulta** num sheet guiado (escolher profissional → dia → horário), com profissional **recomendado** pelo objetivo + dieta, agenda derivada da data atual (pula domingo) e horários por profissional.
- **Saldo de consultas por tier** (Free 1, Pro 4, Família 8): agendar consome crédito, cancelar devolve; sem saldo, o card vira upsell pro `/precos`.
- Stores/serviços novos: `consultations-store` (persistido), `consultations.service` (mock com `// TODO`), `lib/nutritionists.ts` (seed + agenda).

**6ª leva — navegação por abas:**
- **`/nutri` virou abas** (Início · Meu Corpo · Nutrição · Saúde) com barra sticky e `aria-current` — antes era um scroll único.
- Seções redistribuídas por aba; **Meu Corpo** e **Saúde** ganharam casa própria (peso/meta e água/hábitos), com placeholders "em breve" pra medidas/fotos e sono/passos.

**7ª leva — medidas corporais:**
- **"Meu Corpo" deixou de ser placeholder:** card de **medidas** (cintura, quadril, peito, braço, coxa) com registro por sheet, tiles mostrando valor atual + variação vs. 1º registro + **sparkline** por medida.
- Store novo `measurements-store` (persistido, upsert do dia) + `lib/measurements.ts` (defs/helpers) + `MeasurementsCard`. Falta fotos de progresso.

**8ª leva — Saúde (sono + passos):**
- **A aba Saúde fechou:** cards de **sono** (registro de horas com presets, barras da semana, meta 8h) e **passos** (meta diária, progresso + kcal estimadas, barras da semana, +/- rápido). Acabaram os placeholders "em breve" do app.
- Store novo `health-store` (sono + passos, persistidos, histórico por dia) + `use-health` + `HealthCards`.

**9ª leva — receitas, tema, recuperar senha e base de produção:**
- **Receitas públicas:** `/receitas` (lista com busca por ingrediente + filtro por categoria) e `/receitas/[slug]` (SSG) — catálogo `RECIPES_CATALOG` com 10 receitas por dieta/categoria, cada uma com ingredientes, modo de preparo, kcal e macros. O `RECIPES`/`recipeForDiet` do app logado ficou intacto. Links no header/footer + sitemap.
- **Tema claro/escuro:** toggle persistido, sem flash e respeitando o sistema (dark continua padrão). `:root` passou a guardar a paleta clara e `.dark` a escura; store SSR-safe (`theme-store` + `use-theme`) espelhando o `auth-store`, script inline anti-flash e `ThemeWatcher` global.
- **Recuperar senha (UI + mock):** `/recuperar-senha` e `/redefinir-senha` espelhando o login (TanStack Form + Zod), com `requestPasswordReset`/`resetPassword` mock (`// TODO` p/ `POST /auth/forgot` · `/auth/reset`), link no login e bloqueio no `robots`.
- **Base de produção:** README real, `.env.example`, **Vitest** com 23 testes no `nutri-plan`, **CI** (GitHub Actions: lint · typecheck · test · build no Node 22) e `vercel.json`.
- Entregue em **4 PRs separados** (#18 recuperar-senha · #19 receitas · #20 produção · #21 tema), cada um com typecheck + lint + build verdes.

**10ª leva — frontend completo (a11y, favoritos/gamificação, comercial, SEO/PWA, auth) + fixes:**
- **Acessibilidade & navegação:** skip-to-content, scroll-spy + scroll suave na navbar (`aria-current`, IntersectionObserver na home), botão "voltar ao topo", `Skeleton` reutilizável e polimento de foco/labels. **Navbar enxuta:** Sobre, Contato, Conteúdos e Receitas saíram do header (seguem no rodapé). Sweep de tema: utilitárias dark-only (`white/X`) viraram `foreground/X`, corrigindo o claro sem mexer no escuro.
- **Favoritos & gamificação:** `favorites-store` SSR-safe + `use-favorites`, botão de salvar em conteúdos/receitas, aba **"Salvos"** no `/nutri`, **conquistas/badges** derivadas dos stores (peso, medidas, água, hábitos, streak, favoritos) com confete, e `EmptyState` reutilizável.
- **Comercial:** toggle **mensal/anual** (o tipo `Plan` ganhou `annualPrice`) em `/precos` e na home, **newsletter** no footer (`joinWaitlist` source `newsletter`), **login social** Google/Apple (só UI) e **compartilhar plano** na conta (Web Share API + fallback pro clipboard).
- **SEO/PWA/performance:** `metadata` + **OG por rota**, `viewport`/`themeColor`, ícones dinâmicos (`icon`/`apple-icon`), manifest enriquecido + **service worker offline** + `offline.html`, **analytics mock** (`track`/`pageView`), error boundary amigável e `next.config` avif/webp. **CLS:** `font-display: optional` na Syne eliminou o reflow do headline do hero (0,36 → 0 na 1ª visita, medido no Chrome).
- **Auth flows:** **`/verificar-email`** (UI + mock `requestEmailVerification`/`verifyEmail`, `// TODO` p/ `POST /auth/verify` · `/auth/verify/resend`), **rascunho do onboarding** persistido (retoma após refresh) e `RedirectIfAuth` no `/login`.
- **Fix de preços:** o valor do plano escala com a largura do card (container query `@container` + `clamp(…cqi…)`) — acaba o estouro da borda; **`/mês` sempre na linha de baixo**, padronizado (mensal e anual).
- Entregue em **6 PRs** (#23 a11y/nav · #24 favoritos/gamificação · #25 comercial · #26 SEO/PWA · #27 auth · #28 fix preços), cada um com tsc + lint + build + 23 testes verdes; integração dos 5 primeiros validada no browser (Lighthouse + smoke) antes do merge.

---

## 💡 Brainstorm — inspirado no Smart Fit Nutri (screenshots)

> Ideias destiladas de 5 telas do Smart Fit Nutri (cardápio com IA). ⭐ = maior impacto.
> Tipo: 🎨 frontend · 🔌 integração · 🗄️ backend.

### A. Cardápio em nível de alimento ⭐ (o maior salto)
Hoje o BRL Nutri mostra só "Café da manhã — 600 kcal". O Smart Fit monta a refeição com **alimentos de verdade** (uva passa, leite UHT, omelete com muçarela...).
- [x] 🎨 Gerar **alimentos por refeição** (por papel/dieta/restrição) — diário expansível mostra cada alimento + porção + kcal.
- [x] 🎨 **Trocar/substituir** cada alimento (🔄) por alternativa compatível, persistido (`menu-store`).
- [x] 🎨 **Banco de alimentos** seed (`lib/foods.ts`) por papel (proteína, carbo, vegetal, fruta, gordura, laticínio, bebida) com porção + kcal + dieta + restrições.
- [x] 🎨 Sheet/tela de **detalhe da refeição** dedicada (abre ao tocar na refeição) com **macros por prato** + alimentos + troca.
- [ ] 🗄️ Backend: cardápio gerado por **IA de verdade** (LLM) a partir do perfil + banco de alimentos (TACO/USDA).

### B. Metas e prazo ⭐
- [x] 🎨 **Meta de peso** no perfil (onboarding + editor) — peso atual → peso alvo.
- [x] 🎨 Card de peso mostra **progresso até a meta** (faltam X kg, % do caminho) + **linha da meta** no gráfico.
- [x] 🎨 Estimativa de **tempo pra meta** pelo déficit/superávit do plano (`estimateWeeksToGoal`).
- [ ] 🎨 **Tempo pro objetivo** como entrada do usuário ("sem pressa" / data alvo) — ajustaria o déficit sugerido.

### C. Refeições: tipos, horários e timing inteligente
- [x] 🎨 **Selecionar quais** refeições você faz (Café, Lanche manhã, Almoço, Lanche tarde, **Pré-treino, Pós-treino**, Jantar, Ceia) — `lib/meals.ts`.
- [x] 🎨 **Horário por refeição** (time picker) no onboarding + editor; plano distribui kcal por peso e ordena por horário; diário + detalhe mostram o horário.
- [x] 🎨 **Hora de acordar / dormir / treinar** no perfil → distribui refeições de forma inteligente (auto-timing) — onboarding + editor, botão "Sugerir horários" (`autoScheduleMeals`).
- [x] 🎨 **Timeline do dia** (refeições por horário) no /nutri — régua vertical proporcional (`DayTimeline`) com âncoras acordar/treino/dormir, marcador "agora" e destaque da próxima refeição.

### D. Fluxo guiado / conversacional + estado de geração
- [ ] 🎨 Variante **conversacional** do onboarding (estilo chat, uma pergunta por vez) — ou enriquecer o wizard com esse tom.
- [x] 🎨 **Revisão de dados** antes de gerar ("Hora de personalizar seu cardápio"): resumo editável por campo + "Editar" que pula pro passo certo.
- [x] ✨ **Estado de "gerando cardápio"** com bot 🤖 + animação e mensagens rotativas; segura ~2,4s antes de cair no /nutri (respeita reduced-motion).
- [x] 🎨 Opções de atividade com **descrição de percepção de esforço** ("Moderado — coração acelera, falar já exige um esforço").

### E. Caminho humano: nutricionista 🔌
- [x] 🎨 Card "Acompanhamento com um nutri" no /nutri — dois caminhos (IA já ativo + profissional), como o Smart Fit.
- [x] 🎨 **Agendar consulta** (sheet: escolher profissional → dia → horário) + estado de **saldo de consultas** por tier (Free 1, Pro 4, Família 8); cancelar devolve o crédito. Profissional recomendado pelo objetivo + dieta (`lib/nutritionists.ts`, `consultations-store`, `consultations.service` mock).
- [ ] 🔌 Agendamento real (Calendly-like) / chat com profissional — backend depois.

### F. Estrutura do app: seções e navegação
- [x] 🎨 **Navegação por abas** no app logado (Início · Meu Corpo · Nutrição · Saúde) — barra sticky abaixo do header, troca o conteúdo sem recarregar, `aria-current` na aba ativa (`NutriTabs` em `nutri-home`). Seções existentes redistribuídas: Início (resumo + acompanhamento + conteúdos/dicas + upsell/Fit), Nutrição (diário + receita + timeline + lista de compras), Meu Corpo (peso/meta), Saúde (água + hábitos).
- [~] 🎨 **"Meu Corpo"** — aba com peso/meta/gráfico + **medidas corporais** (cintura, quadril, peito, braço, coxa): registro num sheet, tiles com valor + variação vs. 1º registro + sparkline por medida (`measurements-store`, `lib/measurements.ts`, `MeasurementsCard`). Falta só **fotos de progresso**.
- [x] 🎨 **"Saúde"** — aba com água + hábitos + **sono** (registro de horas, barras da semana, meta 8h) e **passos** (meta diária, % + kcal estimadas, barras da semana, +/- rápido). Stores `health-store` + `use-health` + `HealthCards`.

### G. Preferências e detalhe da atividade
- [ ] 🎨 **Preferências culinárias** (cozinhas favoritas, alimentos que não curte) além do estilo de dieta — afina as sugestões.
- [ ] 🎨 **Detalhe da atividade física**: duração, frequência (x/semana) e intensidade — hoje só o "nível". Refina o TDEE.

**Top picks pra atacar primeiro:** A (cardápio em alimentos) + B (meta de peso) — são os que mais aproximam o BRL Nutri de um app de nutrição "de verdade" e reaproveitam muito do que já existe (plano, refeições, card de peso).

---

## 0. Estado atual (baseline)

**Telas existentes**
- `/` — landing (Hero · Produtos · Como funciona · Planos · CTA)
- `/sobre` — origem, métricas, stack, produtos, CTA
- `/contato` — form + infos de contato
- `/login` — form mock (`demo@brl.com` / `123456`)
- `/cadastro` — wizard de onboarding (8 passos) que calcula e salva o plano
- `/nutri` — home personalizada do BRL Nutri (lê o perfil do localStorage)

**Infra já pronta**
- Next 16 + React 19, App Router, Tailwind 4, base-ui, shadcn, TanStack Query/Form, Zod, anime.js, axios.
- Design system dark (roxo `#9656a1`, laranja `#ff8906`, verde `#004643`), fonts Syne (display) + Inter (body).
- Services mock: `auth`, `nutri`, `contact`, `plans` — todos com `// TODO` apontando o endpoint real.
- Cálculo nutricional real (`lib/nutri-plan.ts`): BMR, TDEE, macros, água, IMC, distribuição de refeições.
- Conteúdo seedado (`lib/nutri-content.ts`): artigos, dicas, hábitos, receitas por dieta.
- Persistência de perfil via `localStorage` + `useSyncExternalStore` (SSR-safe).

**Lacunas já identificadas** (viram tarefas abaixo)
- Login não persiste sessão nem redireciona (só `console.log`).
- `/nutri` não tem guarda de autenticação.
- Artigos têm dados mas **nenhuma página de detalhe**.
- Não existe página do BRL Fit (`/fit`).
- Sem `not-found`, `loading`, `error` boundaries.
- Hábitos e água em `/nutri` não persistem.
- CTAs dos planos vão todos pra `/cadastro` — sem fluxo de checkout.
- Sem SEO completo (OG, sitemap, robots), sem `/termos` e `/privacidade`.

---

## 1. Fundação de usabilidade ✨ (frontend, alta prioridade)

- [x] 🎨 **Estado de autenticação real (client)** — `auth-store` (`useSyncExternalStore`) + hook `useAuth()` lendo `localStorage`. `login-form` persiste sessão de verdade.
- [x] 🎨 **Guarda de rotas** — `RequireAuth` protege `/nutri` e `/conta`, redireciona pra `/login?next=...`.
- [x] 🎨 **Login → redireciona** pra `/nutri` (ou `next`) e persiste token + user.
- [x] 🎨 **Menu de usuário no header** — logado mostra avatar + dropdown (Meu Nutri, Minha conta, Sair); deslogado mostra Entrar/Começar grátis.
- [x] ✨ **Toaster global** — `ToastProvider` no layout raiz, fiado em login, contato e waitlist.
- [x] ✨ **`not-found.tsx`** (404 com identidade BRL e CTAs).
- [x] ✨ **`loading.tsx` + `error.tsx`** — marketing tem `loading`; `error.tsx` global na raiz.
- [x] ✨ **Toggle de senha** (mostrar/ocultar) no login. _Falta replicar no onboarding/cadastro._
- [x] ✨ **Skeletons** — componente `Skeleton` reutilizável (respeita reduced-motion), com o `loading` do marketing usando-o. _PR #23._
- [~] 🎨 **Redirecionar logado** — `RedirectIfAuth` tira o logado do `/login` ✅ (_PR #27_). No `/cadastro` quem decide é o próprio wizard (logado **com** plano → `/nutri`; logado **sem** plano precisa do onboarding), então a guarda cega ali ficou de fora de propósito.
- [x] ✨ **Scroll suave + scroll-spy** na navbar — seção ativa via IntersectionObserver na home, `aria-current` + scroll suave (respeita reduced-motion). _PR #23._
- [x] ✨ **Botão "voltar ao topo"** flutuante nas páginas longas (acima da camada de toasts). _PR #23._
- [~] ♿ **Auditoria de acessibilidade** — foco visível, `aria-current` na nav e labels feitos nos arquivos tocados; falta varredura completa (contraste, teclado no wizard). _parcial, PR #23._
- [x] ♿ **Skip-to-content link** no layout marketing (`#conteudo` focável). _PR #23._

---

## 2. Novas telas 🎨 (frontend)

### Conteúdo / Blog (dados já existem em `nutri-content.ts`)
- [x] **`/conteudos`** — listagem com busca e filtro por categoria (`ContentExplorer`).
- [x] **`/conteudos/[slug]`** — página de artigo (corpo em seções, tempo de leitura, autor, relacionados, CTA pro Nutri). Estática via `generateStaticParams`.
- [x] **Receitas** — `/receitas` (busca/filtro) e `/receitas/[slug]` (SSG), catálogo `RECIPES_CATALOG` com ingredientes/macros por dieta. _PR #19._

### BRL Fit (deixar "em breve")
- [x] **`/fit`** — landing "em breve" com proposta de valor, features e **lista de espera** (`WaitlistForm` → `waitlist.service` mock).
- [x] Teaser do BRL Fit na home (card de Produtos) aponta pra `/fit`. _Falta atualizar o teaser dentro do `/nutri`._

### App BRL Nutri (expandir o dashboard)
- [x] **`/nutri/perfil`** — edita os dados e **recalcula o plano** ao vivo (prévia) + salva.
- [x] **Tracker de água interativo** + persistência (copos vs meta do plano, +/-, pips, reset diário).
- [x] **Registro de peso** + **gráfico de evolução** SVG (seed com o peso do perfil, reset N/A).
- [x] **Hábitos persistidos** + **streak** (🔥 dias seguidos) com reset diário.
- [x] **Diário de refeições** — marca refeições do dia, totaliza kcal consumidas vs meta com barra de progresso. Persistido + reset diário.
- [x] **Lista de compras** (`/nutri/compras`) gerada da dieta + restrições, por categoria, itens marcáveis e persistidos, com copiar/limpar.
- [ ] **Tela "Meu plano" detalhada** — substituição de alimentos, ver macros por refeição.

### Conta & comercial
- [x] **`/conta`** — dados pessoais, plano/assinatura (Free), refazer plano, sair, excluir conta. Guardado por auth.
- [x] **`/precos`** — página dedicada de planos, tier-aware (plano atual destacado/disabled). _Falta tabela comparativa detalhada + FAQ de cobrança._
- [x] **`/faq`** — perguntas frequentes em accordion (Geral, BRL Nutri, Planos & cobrança, Conta & privacidade), com dados estruturados `FAQPage` (JSON-LD) pra rich results e link no footer. Conteúdo em `lib/faq.ts`.
- [x] **`/termos`** e **`/privacidade`** — páginas legais (conteúdo-base PT-BR com isenção de saúde nos Termos e seção LGPD na Privacidade; linkadas no footer numa coluna "Legal"). Texto ainda pede revisão jurídica antes do go-live.

---

## 3. Funcionalidades 🎨 (frontend, com mock)

- [x] **Calculadora pública de TDEE/IMC** (`/calculadora`) — lead magnet sem login: reusa `computeNutriPlan` e exibe o resultado pelo `PlanSummary` (meta/TDEE/macros/IMC/água/BMR), atualizando ao vivo conforme preenche; CTA pra salvar criando conta. No sitemap e no footer.
- [ ] **Busca + filtros** nos conteúdos (categoria, objetivo, tempo de leitura).
- [x] **Favoritar** artigos/receitas (`favorites-store` SSR-safe + `use-favorites`) + aba **"Salvos"** no `/nutri` (com `EmptyState`). _PR #24._
- [x] **Comparador de planos** — toggle mensal/anual com desconto (2 meses grátis) em `/precos` e na home. _PR #25._
- [x] **Gamificação** — confete ✅ + **conquistas/badges** derivadas dos stores (peso, medidas, água, hábitos, streak, favoritos) com progresso. _PR #24._
- [x] **Compartilhar plano** — resumo do plano via Web Share API com fallback pro clipboard, na conta. _PR #25._
- [x] **Tema claro/escuro** — toggle persistido, sem flash, respeita o sistema (dark padrão); `:root` claro / `.dark` escuro, store SSR-safe + script anti-flash. _PR #21._ Utilitárias dark-only (`white/X`) migradas pra `foreground/X` no sweep da 10ª leva. ✅
- [x] **Onboarding melhorado** — logado pula o passo de conta ✅, revisão editável ✅, animação de "gerando plano" ✅, **rascunho** persistido (retoma após refresh) ✅. _PR #27._
- [~] **Estados vazios** — componente `EmptyState` reutilizável criado e usado na aba "Salvos" (_PR #24_); falta aplicar em todas as listas.
- [x] **PWA** — manifest enriquecido + ícones + **service worker** offline (`offline.html`), instalável. _PR #26._
- [ ] **(opcional) i18n** pt-BR / en — estrutura de mensagens.

---

## 4. Integrações 🔌 (frontend agora, backend no fim)

> Construir a **UI e o service mock** agora, mantendo o `// TODO: substituir por api...`. A troca pro backend está na seção final.

### E-mail
- [x] **Formulário de contato** com estado de sucesso (SuccessCard) e toast de erro.
- [x] **Lista de espera do BRL Fit** (`WaitlistForm` + `waitlist.service` mock).
- [x] **Newsletter** no rodapé — `NewsletterForm` reusando `joinWaitlist(email, "newsletter")`. _PR #25._ _Falta a variante de fim de artigo._
- [x] Telas/estados que dependem de e-mail: **recuperar senha** ✅ (_PR #18_) e **verificar e-mail** ✅ (`/verificar-email` — UI + mock `requestEmailVerification`/`verifyEmail`, _PR #27_).

### Pagamento
- [x] **Fluxo de checkout** (`/checkout?plano=pro`) — resumo + form de cartão (mock `billing.service`), seta o tier no sucesso.
- [x] **Sucesso/erro** — tela de sucesso inline + toast de erro (cartão `...0000` recusa).
- [x] CTAs dos planos abrem `/precos` → checkout (em vez de `/cadastro`).
- [x] Estado de **assinatura** no `/conta` (mostra o tier atual). _Falta próxima cobrança/fatura._
- [x] **Ajustes de plano no `/conta`** — `PlanManager` lista os 3 planos com a ação certa por relação: upgrade vai pro checkout, **downgrade** e **cancelar** (ir pro Free) são imediatos, com painel de confirmação avisando os efeitos (queda das consultas por tier + perda dos recursos do plano atual). Substitui o `UpgradeNudge` que ficava ali. _Falta: próxima cobrança/fatura e agendar o downgrade pro fim do ciclo (hoje vale na hora, mock)._

### Autenticação
- [ ] Provider/store de auth (ver Fase 1) — já no formato pronto pra trocar mock por API real.
- [x] **Recuperação de senha** (UI completa + service mock: `requestPasswordReset`/`resetPassword` com `// TODO` p/ `/auth/forgot`·`/auth/reset`). _PR #18._
- [x] **Login social** (botões Google/Apple — só UI, toast "chega em breve"). _PR #25._

---

## 5. Qualidade & Produção 🚀

- [x] **SEO** — base no layout raiz (metadataBase, Open Graph, Twitter, keywords, robots, canonical, OG image), `sitemap.ts`, `robots.ts`, `manifest.ts`; **`metadata`/OG por rota** e **ícones dinâmicos** (`icon`/`apple-icon` via `ImageResponse`) entregues. _por rota/ícones: PR #26._
- [~] **Performance** — `next.config` avif/webp + checagem de Core Web Vitals no Chrome; **CLS 0,36 → 0** (`font-display: optional` na Syne). Falta lazy-load de animações pesadas. _PR #26/#28._
- [x] **Analytics** — service mock (`track`/`pageView`) + tracker de pageview por rota. _PR #26._ _Falta fiar cliques de CTA/conclusão de onboarding._
- [~] **Tratamento de erro** — `error.tsx` global mais amigável e theme-aware. _PR #26._ Falta boundary por rota (ex.: `/nutri`).
- [x] **Variáveis de ambiente** documentadas (`.env.example`) — `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_API_URL`. _PR #20._
- [~] **Testes** — unit em `nutri-plan.ts` (cálculos) com **Vitest** (23 testes) ✅ _PR #20_; falta e2e de smoke nos fluxos críticos (onboarding → nutri, login).
- [x] **CI** — GitHub Actions: lint + typecheck + test + build (Node 22). _PR #20._
- [x] **README** real do projeto (substituiu o boilerplate do create-next-app). _PR #20._
- [x] **Deploy** — `vercel.json` + passos no README ✅ _PR #20_; **Vercel conectado** (checks de preview por PR + deploy de produção a partir do `main`).

---

## 6. Backend 🗄️ (deixar por ÚLTIMO)

> Quando chegar aqui, cada item troca um service mock pela API real. O mapa de mocks→endpoints está logo abaixo.

- [ ] **API** (NestJS/Express/Fastify ou Next Route Handlers) com os endpoints mapeados.
- [ ] **Banco de dados** (Postgres + Prisma) — usuários, perfis nutri, planos, assinaturas, logs de peso/água/hábitos.
- [ ] **Autenticação real** — JWT/BetterAuth, refresh token, hash de senha, verificação de e-mail, reset de senha.
- [ ] **Persistência do perfil/plano** no servidor (hoje em localStorage) com sync.
- [ ] **E-mail transacional** (Resend) — boas-vindas, verificação, reset, recibo de pagamento, lista de espera.
- [ ] **Pagamento** (Stripe) — checkout, webhooks, gestão de assinatura, cancelamento, faturas.
- [ ] **Conteúdo** — mover artigos/receitas pra CMS ou DB.
- [ ] **Rate limiting, validação server-side, logs, observabilidade.**
- [ ] **LGPD** — exportar/excluir dados, consentimento.

### Mapa de mocks → endpoints (já marcados no código)
| Service / arquivo | Função | Endpoint real previsto |
|---|---|---|
| `services/auth.service.ts` | `loginUser` | `POST /auth/login` |
| `services/auth.service.ts` | `registerUser` | `POST /auth/register` |
| `services/nutri.service.ts` | `completeOnboarding` | `POST /auth/register` + `PUT /nutri/profile` |
| `services/nutri.service.ts` | perfil (get/save) | `GET/PUT /nutri/profile` |
| `services/contact.service.ts` | `sendContactMessage` | `POST /contact` |
| `services/plans.service.ts` | `getPlans` | `GET /plans` |
| `lib/axios.ts` | `baseURL` | apontar `NEXT_PUBLIC_API_URL` p/ API real |
| _(novo)_ | checkout | `POST /billing/checkout` + webhooks |
| _(novo)_ | waitlist BRL Fit | `POST /waitlist` |
| `services/consultations.service.ts` | `scheduleConsultation` | `POST /consultations` (+ agenda real) |
| `lib/measurements-store.ts` | `recordMeasurements` | `GET/POST /nutri/measurements` |
| `lib/health-store.ts` | `recordSleep` / `setSteps` | `GET/POST /nutri/sleep` · `/nutri/steps` |
| _(novo)_ | recuperar senha | `POST /auth/forgot` · `POST /auth/reset` |

---

## Sugestão de ordem de execução

1. **Fase 1** (fundação de usabilidade) — destrava tudo: auth client, guarda, toaster, 404/loading/error.
2. **Conteúdo/Blog** + **`/fit`** — muito valor visível, dados já existem, baixo risco.
3. **Expansão do `/nutri`** (perfil editável, água, peso, hábitos persistidos).
4. **Checkout + `/precos` + `/conta`** (integração de pagamento no front).
5. **E-mail flows** (recuperar senha, waitlist, newsletter).
6. **Qualidade & produção** (SEO, testes, README, deploy).
7. **Backend** (seção 6) — por último, trocando os mocks pelos endpoints reais.
