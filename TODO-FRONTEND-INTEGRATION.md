# TODO — Integração Frontend ↔ Backend (BRL Health)

> Ligar o frontend Next.js aos **endpoints reais** do backend (`/backend`,
> .NET 10 + Dapper, já pronto e validado e2e). Substitui os **8 services mock**
> em `src/services/*.ts` (cada função tem o marcador `// TODO: substituir por
> api...`) por chamadas reais via `src/lib/axios.ts`. Sessão/token no
> `src/lib/auth-store.ts`.
>
> **Contrato de rotas:** `backend/README.md`. **Auth:** JWT HS256 (claim `sub`) +
> refresh token rotativo single-use. **Ordem:** auth → perfil/onboarding →
> assinatura/planos → consultas → billing → contato/waitlist/analytics →
> tracking → conteúdo (opcional).

## ✅ Status (2026-06-30) — integração CONCLUÍDA ("tudo via API, sem mocks")

**Tudo que é dado-com-endpoint vem do backend.** 19 PRs mergeados no `main`
(#53–#71), validados via `tsc`+`lint`+`build` e e2e contra Postgres em Docker
(contratos/HTML por `curl`). Auditoria final: **zero** service mock; **zero**
catálogo de dado estático que tenha endpoint.

### Integração core — os 8 services mock viraram reais
| Fase | O quê | PR(s) |
|---|---|---|
| 0+1 | Infra (axios refresh/erro, refresh token, `.env`→`:5226`) + **auth** JWT | #53 |
| 2 | **Perfil/onboarding** servidor-autoritativo (+ backend persiste restrições/água/refeições) | #55, #54 |
| 3+5 | **Assinatura/tier** + **checkout** (+ backend `GET /me/subscription`, `PUT /me/plan` via JWT) | #57, #56 |
| 4 | **Consultas** agendar/listar/cancelar (+ backend `nutritionistId` no JOIN) | #59, #58 |
| 6 | **Contato/waitlist/analytics** | #60 |
| 7 | **Tracking** (água/peso/sono/passos/medidas/hábitos/diário) write-through + hidratação | #61 |
| 8 | **Excluir conta** (LGPD `DELETE /me/account`, cascata) | #62 |
| — | docs (marco do core) | #63 |

### "Tudo via API" — catálogos e o último mock
| O quê | PR(s) |
|---|---|
| Receitas/Conteúdos **públicos** (`/receitas`, `/conteudos`) via `GET /recipes`,`/articles` — **SSG/ISR** (`generateStaticParams` async + `revalidate 3600`) | #64, #65 |
| **getPlans** → `GET /plans` (era o **último service mock**: tinha `wait`+TODO) | #66 |
| **Nutricionistas** → novo backend `GET /nutritionists` (+colunas avatar/goals/diets) + front React Query | #67, #68 |
| **foods** → `GET /foods` (meal-diary) | #69 |
| **Dashboard** (recomendados + favoritos) → `/articles`,`/recipes` (React Query) | #70 |
| **sitemap** via API + **removeu `ARTICLES`/`RECIPES_CATALOG`** e 7 funções-lib mortas (nutri-content 742→126 linhas) | #71 |

### Padrões de arquitetura (seguir nas próximas sessões)
- **Sessão/erros:** `src/lib/axios.ts` — anexa Bearer, faz **refresh rotativo no 401**
  (repete a request 1×), e converte `{error}`/`{errors[]}` do backend em
  `error.message` **preservando `error.status`** (services distinguem 404/400).
- **Hidratação servidor→cache** 1×/usuário/sessão: `ensure*Hydrated(user)` +
  `is*Hydrated(user)`. Perfil+tier gateados no `RequireAuth`; tracking no
  `ReadyHome`; consultas no `NutriCoach`. `logout` limpa **todos** os caches +
  hidratações (`clear*` + `reset*Hydration`).
- **Escrita write-through:** setter grava local na hora + dispara `POST`
  best-effort (otimista). Tracking: `set*` (POST) vs `hydrate*` (só local, sem eco).
- **Catálogos de referência (client):** **React Query** (`useNutritionists`,
  `useFoods`, `useArticles`, `useRecipes`; `staleTime 1h`) + helpers puros
  `*From(lista, …)` (ex.: `recommendedNutritionist(list, …)`, `buildMealFoods(catalog, …)`).
- **Catálogos com página de SEO (server):** `fetch` nativo + ISR em
  `content.service.ts` (`fetchRecipes`/`fetchArticles`); `generateStaticParams`
  async. Next em **modo clássico** (sem Cache Components). Gotcha: `/recipes` já
  devolve a forma do `RecipeFull` (mapear de `time`/`macros`, não do row do DB).

### Fica estático **de propósito** (NÃO é mock — não migrar sem decisão de produto)
- **`meals.ts` (`MEAL_OPTIONS`)** — os pesos alimentam `buildScheduledMeals`
  **dentro do `computeNutriPlan`** (cálculo instantâneo que o usuário quis manter
  **local**); migrar tornaria o cálculo assíncrono.
- **`nutri-plan.ts`** — cálculo puro (Mifflin-St Jeor), decisão: **local**.
- **`recipeForDiet`** (teaser por dieta), **`QUICK_TIPS`**, **`DAILY_HABITS`**,
  **`faq.ts`**, **`legal.ts`** (Termos/Privacidade), **`nutri-options.ts`** (labels),
  **`achievements.ts`**, **copy de marketing dos planos** (nome/tagline/features) —
  conteúdo de UI **sem tabela no backend** (usuário optou por não virar CMS).
- **`shopping-list.ts`** — geração da lista (lógica de cliente).

### Estado de usuário só-local (fora do escopo combinado — sem endpoint)
`favorites-store` (artigos/receitas salvos), `menu-store` (trocas de alimento),
`shopping-store` (itens marcados). Drafts (`calc-draft`/`onboarding-draft`) e
`theme-store` são UI/transientes — ficam locais.

### 🔜 Só sobrou opcional (precisa decisão/insumo do usuário)
- **Export/consent LGPD** (`GET /me/data-export`, `POST/GET /me/consent`): features
  novas (não são mock→real). Backend pronto; falta UI no front.
- **`POST /nutri/menu` (IA):** o front já calcula o cardápio igual localmente —
  ganho só com chave OpenAI no backend.
- **Stripe Checkout real** (`/billing/stripe/{config,checkout,portal}`): **precisa o
  usuário setar test keys** no backend; substitui o mock `/billing/checkout` (#57).
- **Estado de usuário no servidor** (favorites/menu/shopping): exigiria endpoints novos.
- **Conteúdo de UI no banco** (FAQ/legal/copy/tips): viraria um CMS — decisão de produto.

### ⚠️ Validação pendente
**Click-through no browser do app logado nunca rodou** (a extensão do Chrome não
conectou nesta sessão). Tudo foi validado por `build` + **contratos/HTML via `curl`**.
Recomendado testar manualmente (`localhost:3000`, demo `demo@brl.com`/`123456`) ou
conectar a extensão. As páginas públicas de SEO foram conferidas no HTML renderizado.

### Como rodar a stack de teste
1. Postgres descartável: `docker run -d --name brl-pg -e POSTGRES_PASSWORD=devsecret -e POSTGRES_DB=brlhealth -p 5432:5432 postgres:16-alpine`
2. Schema+seed: `docker exec -i brl-pg psql -U postgres -d brlhealth < backend/src/BrlHealth.Api/Data/schema.sql` (e `seed.sql`)
3. API: `cd backend/src/BrlHealth.Api && ConnectionStrings__Default="Host=localhost;Port=5432;Database=brlhealth;Username=postgres;Password=devsecret" ASPNETCORE_URLS="http://localhost:5226" dotnet run` (sobe em `:5226`)
4. Front: `npm run dev` (`:3000`; `.env.local` aponta `NEXT_PUBLIC_API_URL=http://localhost:5226`). CORS do backend libera `:3000`.

## Decisões travadas (2026-06-30)

1. **Gaps do backend → estender o backend** (PRs/commits próprios, mesmo
   monorepo). Três adições (ver **Apêndice A**): `GET /me/subscription`,
   `nutritionistId` no view de `GET /consultations/me`, e persistir
   `restrictions`/`waterGlasses`/`meals[]` no perfil.
2. **Checkout → mock `/billing/checkout`** (drop-in; mantém o form de cartão
   atual). Stripe Checkout fica como item posterior (Fase 9).
3. **Execução:** o TODO cobre tudo; a implementação começa por **Fase 0 + Fase 1
   (auth) + Fase 2 (perfil/onboarding)** nesta leva.

## ⚠️ Gotchas que valem para todas as fases

- **Porta/CORS:** API .NET sobe em `http://localhost:5226` (launchSettings); CORS
  default dela é `http://localhost:3000` (origem do `next dev`). Alinhar
  `NEXT_PUBLIC_API_URL` (hoje `.env.example` aponta pra `:3333`, errado) e o
  `Cors:Origin` do backend. → **Fase 0**.
- **Shape de erro do backend ≠ o que o axios lê hoje.** O interceptor lê
  `error.response.data.message`, mas o backend devolve `{ error: "..." }` (401) e
  `{ errors: [ "..." ] }` (400 validação). Sem ajustar, **toda mensagem de erro
  vira o texto genérico**. → **Fase 0**.
- **`AGENTS.md`:** é **Next.js 16 com breaking changes** — ler
  `node_modules/next/dist/docs/` antes de mexer em rota/route handler/config.
- **SSR-safe stores:** os stores usam `useSyncExternalStore` lendo `localStorage`.
  A estratégia de migração é **localStorage como cache + write-through pra API**
  (carrega do servidor no mount, escreve nos dois). Não quebrar o `getServerSnapshot`.
- **Chaves (Stripe/Resend/OpenAI)** NÃO estão no repo; sem elas o backend cai em
  fallback (email=console, IA=local, Stripe→501). Mock `/billing/checkout`,
  consultas, perfil, tracking e auth **não precisam de chave**.
- **Workflow:** branch por fase, commit título inglês + corpo PT, **sem
  co-autoria do Claude**, push + PR (merge do usuário). Typecheck + lint + build +
  testes antes de commitar.

---

## Fase 0 — Infra base (pré-requisito de tudo)

- [ ] **0.1 — `.env`:** criar `.env.local` (e corrigir `.env.example`) com
  `NEXT_PUBLIC_API_URL` apontando pra URL real da API (ex.: `http://localhost:5226`).
- [ ] **0.2 — CORS do backend:** garantir que `Cors:Origin` aceita a origem do
  front (`http://localhost:3000`). Documentar no README do backend se mudar.
- [ ] **0.3 — `src/lib/axios.ts` — extração de mensagem de erro:** ler
  `data.error` → `data.errors?.[0]` → `data.message` → `error.message`, nessa
  ordem. Manter o `Error(message)` rejeitado (os forms já exibem `error.message`).
- [ ] **0.4 — `src/lib/axios.ts` — refresh rotativo no 401:** no interceptor de
  resposta, se `401` e há `refreshToken` salvo e a rota não é `/auth/*`, chamar
  `POST /auth/refresh { refreshToken }`, salvar o novo par e **repetir a request
  original uma vez**. Se o refresh falhar, `clearAuth()` (limpa sessão). Evitar
  loop (flag `_retry`) e corridas (uma única promessa de refresh compartilhada).
- [ ] **0.5 — `src/lib/auth-store.ts` — persistir refreshToken:** nova chave
  `brl.auth.refresh`; `setAuth(user, token, refreshToken)`, `getRefreshToken()`,
  `clearAuth()` apaga as três chaves. `AuthState` ganha `refreshToken`.
- [ ] **0.6 — Tipos (`src/types/index.ts`):** `AuthResponse` ganha
  `refreshToken: string`. Conferir que `User.id` é `string` (backend devolve
  `id` como string — ok).

---

## Fase 1 — Auth (JWT) 🔒 **[começar aqui]**

Substitui `src/services/auth.service.ts` inteiro por chamadas reais. Consumidores:
`login-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`,
`verify-email-form.tsx`, `use-auth.ts` (hook central), e `nutri.service.ts`
(`registerUser` é chamado dentro de `completeOnboarding`).

| Função (service) | Endpoint | Body → Resposta |
|---|---|---|
| `loginUser(email, pass)` | `POST /auth/login` | `{email,password}` → `{user,token,refreshToken}` |
| `registerUser(name,email,pass)` | `POST /auth/register` | `{name,email,password}` → `{user,token,refreshToken}` (201) |
| `requestPasswordReset(email)` | `POST /auth/forgot` | `{email}` → `{message}` (sempre 200, não revela cadastro) |
| `resetPassword(token, pass)` | `POST /auth/reset` | `{token,password}` → `{message}` (400 se inválido) |
| `requestEmailVerification()` 🔒 | `POST /auth/verify/resend` | **sem body** (usa JWT) → `{message}` |
| `verifyEmail(code)` 🔒 | `POST /auth/verify` | `{code}` → `{message}` (400 se inválido) |

- [ ] **1.1 — `loginUser` / `registerUser`** → `api.post`. Remover demo
  hardcoded e o `wait()`. Resposta já bate com `AuthResponse` (após Fase 0.6).
- [ ] **1.2 — `use-auth.ts` / `auth-store`:** `login(user, token, refreshToken)`
  passa a guardar o refresh token. `logout()` deve chamar `POST /auth/logout
  { refreshToken }` (best-effort) **antes** de `clearAuth()`.
- [ ] **1.3 — `requestPasswordReset` / `resetPassword`** → `api.post`. Os forms
  (`forgot-password-form`, `reset-password-form`) já tratam sucesso/erro.
- [ ] **1.4 — ⚠️ `verify/resend` mudou de contrato:** é **autenticado e sem
  body** (o backend pega o e-mail pelo JWT). Ajustar a assinatura de
  `requestEmailVerification` (não recebe mais `email`) e o
  `verify-email-form.tsx` (que hoje passa `email`). Confirmar que a tela de
  verificação só roda com sessão ativa.
- [ ] **1.5 — `verifyEmail(code)`** → `POST /auth/verify { code }`. Em sucesso,
  refletir `emailVerified` se a UI usar (hoje é só mensagem).
- [ ] **1.6 — Rate limit `/auth/*` (10/min → 429):** tratar `429` nos forms com
  mensagem amigável ("muitas tentativas, aguarde"). O interceptor pode mapear
  `429` → mensagem específica.
- [ ] **1.7 — Validar e2e:** subir backend (Postgres Docker) + front; login com
  `demo@brl.com`/`123456`, registro novo, forgot (link no log do
  ConsoleEmailSender), reset, resend+verify (código no log), e expiração/refresh
  (forçar 401 e ver o retry).

---

## Fase 2 — Perfil / Onboarding 🔒 **[nesta leva]**

`src/services/nutri.service.ts` — hoje o perfil só vive no localStorage
(`brl.nutri.profile`). Consumidores: `onboarding-wizard.tsx` (linhas ~601-603),
`profile-editor.tsx:294`, `account-view.tsx` (clear), e leituras em
`nutri-home`, `shopping-list`, `share-plan`.

**Contrato (após Apêndice A.3 — campos novos):**
- `GET /nutri/profile` 🔒 → `ProfileRow` (`sex, age, heightCm, weightKg,
  targetKg, goal, activity, diet, mealsPerDay, wakeTime, trainTime, sleepTime`
  **+ `restrictions`, `waterGlasses`, `meals`** após A.3). **Não inclui
  name/email** (esses vêm do `user` da sessão).
- `PUT /nutri/profile` 🔒 → mesma `ProfileRow`. Upsert.
- `GET /nutri/plan` 🔒 → `NutriPlan` calculado no servidor (opcional — o front já
  calcula igual em `lib/nutri-plan.ts`; manter cálculo local como fonte primária,
  endpoint como conferência).

- [ ] **2.1 — Backend A.3 primeiro** (ver Apêndice): adicionar
  `restrictions text[]`, `water_glasses int`, `meals jsonb` em `nutri_profiles` +
  no `ProfileRow`/`ProfileRequest`. Sem isso esses 3 campos se perdem no
  round-trip.
- [ ] **2.2 — `completeOnboarding`:** trocar por `POST /auth/register` → `setAuth`
  → `PUT /nutri/profile` (sem name/email no body; o backend liga ao `sub` do
  JWT). Mapear `NutriProfile` (front) ↔ `ProfileRequest` (back):
  `goalWeightKg`→`goalWeightKg`/`targetKg`, manter snake/camel conforme o JSON do
  .NET (System.Text.Json serializa PascalCase→camelCase por default — **conferir**).
- [ ] **2.3 — `saveNutriProfileForCurrentUser`** (usuário logado refazendo o
  plano) → `PUT /nutri/profile`.
- [ ] **2.4 — `saveNutriProfile`** (profile-editor) → `PUT /nutri/profile`.
- [ ] **2.5 — Leitura do perfil:** carregar de `GET /nutri/profile` no mount e
  hidratar o store (localStorage vira cache). Mesclar `name`/`email` da sessão
  (`useAuth().user`). Default seguro para `restrictions` (`[]`) em perfis antigos.
- [ ] **2.6 — `clearNutriProfile` (account-view "excluir conta"):** alinhar com
  LGPD `DELETE /me/account` (Fase 8) — por ora só limpa o cache local.
- [ ] **2.7 — Validar e2e:** onboarding completo cria conta + perfil no banco;
  recarregar a página puxa o perfil do servidor; editar no profile-editor
  persiste; `restrictions`/`waterGlasses`/`meals` sobrevivem ao reload.

---

## Fase 3 — Assinatura / Planos / Tier

`src/services/plans.service.ts` + `src/lib/plan-store.ts` (hoje tier em
`localStorage: brl.plan.tier`). Consumidores: `pricing.tsx`, `plans-board.tsx`,
`plan-manager.tsx`, `checkout.tsx`, `upgrade-nudge.tsx`.

- [ ] **3.1 — Backend A.1:** `GET /me/subscription` 🔒 → `{ planId, credits,
  ... }` (tier atual). Hoje **não existe** GET do tier — destrava créditos de
  consulta e destaque de plano.
- [ ] **3.2 — `plan-store` do servidor:** `setPlanTier` deixa de ser fonte da
  verdade; carregar o tier de `GET /me/subscription` no mount. `dismissed`
  (nudges) pode continuar local (é só UX).
- [ ] **3.3 — `getPlans`:** o backend `GET /plans` só devolve `{id, monthlyPrice,
  credits}` (a copy de marketing fica no front — dívida DT-07). **Manter** o
  array estático `PLANS` para nome/tagline/features e **mesclar** preço/créditos
  da API (opcional). `getPlanById` continua síncrono local.
- [ ] **3.4 — Mudança de plano `PUT /me/plan`:** usado no downgrade/cancelamento
  em `plan-manager`/`account-view`. ⚠️ O body exige `userId` (`ChangePlanRequest`
  não usa JWT) → passar `useAuth().user.id`. Resposta `{plan}`; atualizar o store.
  *(Avaliar no Apêndice A se vale proteger via JWT como os outros.)*
- [ ] **3.5 — Validar e2e:** tier reflete o banco após login; downgrade/cancelar
  persiste; créditos de consulta batem com o plano.

---

## Fase 4 — Consultas 🔒

`src/services/consultations.service.ts` + `src/lib/consultations-store.ts`
(`localStorage: brl.nutri.consultations`). Consumidor: `nutri-coach.tsx:175`.

| Ação | Endpoint | Notas |
|---|---|---|
| Agendar | `POST /consultations` 🔒 | `{nutritionistId,date,time}` → `{id}` (5 validações → 400) |
| Listar | `GET /consultations/me` 🔒 | INNER JOIN → `ConsultationView[]` |
| Cancelar | `DELETE /consultations/{id}` 🔒 | devolve crédito; 204/404 |

- [ ] **4.1 — Backend A.2:** incluir `nutritionistId` no `ConsultationView` — o
  JOIN hoje devolve nome/foco/CRN mas **não o id**, então o front não consegue
  casar com `lib/nutritionists.ts`. (Alternativa: casar por nome — frágil.)
- [ ] **4.2 — `scheduleConsultation`** → `POST /consultations`. Resposta é só
  `{id}` (number) → montar o `Consultation` do front a partir do input + `id`
  (converter `id` pra string; `createdAt` = agora). Tratar os 400 (sem crédito,
  slot ocupado, data passada, etc.) exibindo `errors[0]`.
- [ ] **4.3 — Listagem:** carregar `GET /consultations/me` no mount do
  `nutri-coach`/store. Mapear `ConsultationView` → o que a UI mostra (id→string).
- [ ] **4.4 — Cancelar** → `DELETE /consultations/{id}` → `removeConsultation`.
- [ ] **4.5 — Créditos:** derivar do tier real (Fase 3) × consultas ativas.
- [ ] **4.6 — Validar e2e:** agendar consome crédito, slot duplicado → 400,
  cancelar devolve crédito, lista persiste no reload.

---

## Fase 5 — Billing / Checkout (mock) 🔒

`src/services/billing.service.ts`. Consumidor: `checkout.tsx:73`; sucesso chama
`plan-store.setPlanTier`.

- [ ] **5.1 — `processPayment(planId, card)`** → `POST /billing/checkout
  { planId, card:{holder,number,expiry,cvv} }` → `{planId, paidAt}`. O backend
  valida o cartão (número terminando em `0000` → 400) e **ativa o plano**.
- [ ] **5.2 — Pós-sucesso:** o tier agora vem do servidor — recarregar de
  `GET /me/subscription` (Fase 3) em vez de só setar local.
- [ ] **5.3 — Validar e2e:** cartão normal ativa plano (free→pro/family); cartão
  `...0000` → erro exibido; tier atualiza.

---

## Fase 6 — Contato / Waitlist / Analytics (fáceis, sem auth)

- [ ] **6.1 — `sendContactMessage(data)`** → `POST /contact
  { name, email, subject, message }` → `{id}` (201). `contact-form.tsx:95`.
- [ ] **6.2 — `joinWaitlist(email, source)`** → `POST /waitlist { email, source }`
  → `{joined}`. Manter o dedup local como conveniência de UX.
  `waitlist-form.tsx:31`, `newsletter-form.tsx:25`.
- [ ] **6.3 — `track(event, props)`** → `POST /analytics/events { event, props }`
  (202). **Fire-and-forget**: não `await` no caller, engolir erro (analytics
  nunca quebra a UX). `pageView` segue por cima. `analytics-tracker.tsx:17`.

---

## Fase 7 — Tracking diário 🔒 (maior superfície)

Stores localStorage → write-through API. Endpoints (todos 🔒):

| Dado | GET | POST | Store/Hook |
|---|---|---|---|
| Água | `/nutri/water?date=` → `{ml}` | `{ml,date?}` | `nutri-tracking` / `use-nutri-tracking` |
| Peso | `/nutri/weight` → `[{date,kg}]` | `{kg,date?}` | `nutri-tracking` |
| Sono | `/nutri/sleep` → `[{date,hours}]` | `{hours,date?}` | `health-store` / `use-health` |
| Passos | `/nutri/steps` → `[{date,count}]` | `{count,date?}` | `health-store` |
| Medidas | `/nutri/measurements` → `[...]` | `{date?,waist,hip,chest,arm,thigh}` | `measurements-store` |
| Hábitos | `/nutri/habits?date=` → mapa JSON | `{done:{},date?}` | `nutri-tracking` |
| Diário | `/nutri/diary?date=` → mapa JSON | `{done:{},date?}` | `nutri-tracking` |

- [ ] **7.1 — Padrão de migração:** para cada store, `loadFromServer()` no mount
  (hidrata o snapshot) + `POST` em cada escrita. Manter reset diário onde faz
  sentido (data = hoje). Não quebrar `useSyncExternalStore`.
- [ ] **7.2 — Água** (`setWaterMl`) → GET/POST `/nutri/water`.
- [ ] **7.3 — Peso** (`addWeight`) → GET/POST `/nutri/weight`.
- [ ] **7.4 — Sono** (`recordSleep`) → GET/POST `/nutri/sleep`.
- [ ] **7.5 — Passos** (`setSteps`/`addSteps`) → GET/POST `/nutri/steps`.
- [ ] **7.6 — Medidas** (`recordMeasurements`) → GET/POST `/nutri/measurements`.
- [ ] **7.7 — Hábitos** (`setHabits`) → GET/POST `/nutri/habits`.
- [ ] **7.8 — Diário** (`setMeals`) → GET/POST `/nutri/diary`.
- [ ] **7.9 — Sem endpoint (decidir):** `menu-store` (swaps de cardápio),
  `shopping-store` (itens marcados), `favorites-store` (favoritos) **não têm
  endpoint**. Decisão: deixar local **ou** abrir tickets de backend. Registrar.
- [ ] **7.10 — Validar e2e:** registrar cada métrica, recarregar, conferir que
  veio do servidor; gráficos/semana batem.

---

## Fase 8 — LGPD / Conta 🔒

- [ ] **8.1 — `DELETE /me/account`** (cascata) na ação "excluir conta" do
  `account-view` → depois `clearAuth()` + `clearNutriProfile()`.
- [ ] **8.2 — `GET /me/data-export`** (portabilidade) → botão "exportar meus
  dados" (baixar JSON). UI nova, opcional.
- [ ] **8.3 — `POST /me/consent`** ao aceitar termos/privacidade (onboarding/
  cadastro). `GET /me/consent` para histórico. Opcional.

---

## Fase 9 — Conteúdo & Stripe real (opcional / posterior)

- [ ] **9.1 — Catálogos via API** (substituir libs estáticas, opcional):
  `GET /foods`, `/meals`, `/articles`(+`/{id}`), `/recipes`(+`/{id}`). Hoje vêm
  de `lib/*.ts`. Baixa prioridade (conteúdo estável, bom pra SSG).
- [ ] **9.2 — `POST /nutri/menu` (IA):** gerar cardápio do dia pelo backend
  (local/IA conforme chave) em vez de só client-side.
- [ ] **9.3 — Stripe Checkout real:** `GET /billing/stripe/config` +
  `POST /billing/stripe/checkout` → redirect; `POST /billing/stripe/portal`
  (gerir/cancelar). Precisa de test keys no backend. Substitui a Fase 5 quando
  ativado.

---

## Apêndice A — Mudanças necessárias no backend (decisão: estender)

> Mesmo monorepo, mas **commits/PRs focados** e próprios. Cada um com migração de
> schema + ajuste de repo/endpoint + teste.

- [ ] **A.1 — `GET /me/subscription` 🔒** (Fase 3): novo endpoint que devolve o
  tier atual do usuário (`planId`, `credits`, status). Usa
  `SubscriptionsRepository.GetSubscriptionAsync` (já existe) + `GetPlanAsync`.
- [ ] **A.2 — `nutritionistId` no `ConsultationView`** (Fase 4): adicionar
  `c.nutritionist_id AS NutritionistId` ao SELECT do JOIN e ao record. Sem
  quebrar o teste do JOIN.
- [ ] **A.3 — Persistir `restrictions`/`waterGlasses`/`meals`** (Fase 2):
  `ALTER TABLE nutri_profiles ADD restrictions text[]`, `water_glasses int`,
  `meals jsonb`; estender `ProfileRow` + `ProfileRequest` +
  `ProfilesRepository.GetAsync/UpsertAsync`. Cuidar do mapeamento Dapper de
  `text[]` (usar classe `get;set;`, não record posicional — gotcha conhecido).
- [ ] **A.4 — (avaliar) proteger `PUT /me/plan` via JWT** em vez de `userId` no
  body, alinhando com os demais endpoints autenticados. Opcional, mas mais seguro.

---

## Ordem de execução (resumo)

`Fase 0 (infra)` → **`Fase 1 (auth)`** → **`Fase 2 (perfil + A.3)`** →
`Fase 3 (tier + A.1)` → `Fase 4 (consultas + A.2)` → `Fase 5 (checkout)` →
`Fase 6 (contato/waitlist/analytics)` → `Fase 7 (tracking)` → `Fase 8 (LGPD)` →
`Fase 9 (opcional)`.
