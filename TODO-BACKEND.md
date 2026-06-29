# BRL Health — Backend TODO (AV2 + visão de produção)

> Roadmap do **backend** do BRL Health. O frontend está completo e navegável com
> services _mock_ (localStorage); cada mock já marca o endpoint real previsto
> (`// TODO: substituir por api...`). Este documento reconstrói a seção 6 do
> `TODO.md` em volta da **entrega acadêmica AV2**, que dita a stack e os artefatos.
>
> **Stack (exigida pela AV2):** **Minimal API em C# (.NET) + Dapper**, queries 100%
> parametrizadas com `@Parametro`. Banco **PostgreSQL** (Npgsql), trocável.
>
> **Entrega da AV2 = 10 pontos:** 4 requisitos de código + **20 artefatos SDD**
> (0,5 cada). A maior parte da nota é **documentação**, verificada por um corretor
> automático que busca **caminhos e literais exatos** — siga-os ao pé da letra.

**Legenda**
`[ ]` a fazer · `[~]` em andamento · `[x]` feito
🧱 setup · 🗄️ banco · 🔌 endpoint · 🧮 regra de negócio · 🧪 teste · 📄 doc SDD · 🔒 segurança · 🚀 produção

---

## 🟥 0. Regra de ouro (leia antes de começar)

> Estas regras também estão codificadas como **diretriz vinculante** no topo do
> `CLAUDE.md` ("⚙️ Backend (AV2) — regras de desenvolvimento"). Em caso de
> divergência, vale o PDF da AV2.

- **Monorepo:** o backend mora em **`/backend`** (subpasta deste repo), autocontido:
  `/backend/src`, `/backend/tests`, `/backend/docs`, `/backend/release_checklist_final.md`.
- ⚠️ **O corretor da AV2 precisa rodar apontando para `/backend`.** Todos os
  literais do PDF (`/src`, `/tests`, `/docs`, "raiz do repositório") são relativos à
  raiz que o corretor enxergar. Se ele rodar na raiz do front (que tem `src/` em
  TypeScript), os caminhos **não batem**. Trate `/backend` como a raiz da AV2.
- 🧾 **Insumos do professor:** os itens **03 (3 cenários)**, **04 (trecho de código
  C#)** e **08 (12 tickets)** usam material **fornecido no enunciado/plataforma da
  disciplina**. Use exatamente esses insumos — não invente fora do que foi dado, ou
  o conteúdo não casa com o esperado.
- 👥 **WIP ≤ nº de integrantes:** o item 11 exige um limite de WIP numérico **≤ ao
  tamanho do grupo**. Ajuste o número ao seu grupo antes de entregar.
- 🔁 **Reaproveitar a AV1:** se já existe a API da AV1 (que "compila, conecta e faz
  CRUD"), mova-a para `/backend` e evolua a partir dela; senão, comece limpo
  seguindo as mesmas convenções.

---

## 🧱 1. Setup do projeto

- [x] 🧱 Criar solution `.NET` em `/backend` (`BrlHealth.sln`) + projeto
  `src/BrlHealth.Api` (Minimal API) e `tests/BrlHealth.Tests` (xUnit).
- [x] 🧱 Adicionar pacotes: `Dapper`, `Npgsql`, `Microsoft.Extensions.Configuration`
  (sem ORM pesado — Dapper é o micro-ORM da AV2).
- [x] 🧱 **Connection string fora do código** (item 18): `builder.Configuration
  .GetConnectionString("Default")` + `dotnet user-secrets` (dev) / variável de
  ambiente (prod). Nada de `Password=...` literal em `.cs`.
- [x] 🧱 `appsettings.json` / `appsettings.Development.json` sem segredos; commitar
  `appsettings.Example.json`.
- [x] 🧱 Estrutura de pastas: `Endpoints/`, `Domain/`, `Data/` (repos Dapper +
  `DbConnectionFactory`), `Services/` (regras + cálculo), `Validation/`.
- [x] 🧱 `Program.cs`: `WebApplication`, DI (registrar factory + repos + services),
  CORS pro front (`NEXT_PUBLIC_API_URL` aponta pra cá), Swagger.
- [x] 🧱 `README.md` em `/backend`: como subir o banco, rodar migrations, `dotnet run`.

---

## 🗄️ 2. Banco de dados (schema + seed, derivado do front)

> Tabelas derivadas do inventário dos mocks/tipos do front. Todas as queries via
> Dapper **parametrizadas** (`@Parametro`) — nunca interpolação/concatenação.

- [x] 🗄️ Script de schema `Data/schema.sql` (ou migrations) com as tabelas:
  - `users` (`id`, `name`, `email` único, `password_hash`, `email_verified`,
    `created_at`).
  - `nutri_profiles` (FK `user_id`, sexo, idade, altura, peso, peso-alvo, objetivo,
    atividade, dieta, restrições[], refeições/dia, horários acordar/treinar/dormir).
  - `plans` (`free`/`pro`/`family` + preço mensal/anual, features) e `subscriptions`
    (FK `user_id`, `plan_id`, `status`, `current_period_end`).
  - `nutritionists` (nome, CRN, foco, bio, rating, reviews, anos, goals[], diets[]).
  - `consultations` (FK `user_id`, FK `nutritionist_id`, `date`, `time`,
    `status`, `created_at`).
  - `foods` (papel, porção, kcal, macros, diets[], excluded_by[]) e `meals` (opções).
  - Tracking: `weight_logs`, `water_logs`, `sleep_logs`, `step_logs`,
    `measurements`, `habit_logs`, `meal_logs` (todos com `user_id` + `date`).
  - `articles`, `contact_messages`, `waitlist`, `analytics_events`.
- [x] 🗄️ `DbConnectionFactory` (abre `NpgsqlConnection` a partir da config).
- [x] 🗄️ Seed: 32 alimentos (`lib/foods.ts`), 8 refeições (`lib/meals.ts`),
  4 nutricionistas (`lib/nutritionists.ts`), 3 planos, 8 artigos
  (`lib/nutri-content.ts`). _(o `foods.ts` real tem 32, não 34; receitas de
  `RECIPES_CATALOG` ficam pra quando a página `/receitas` sair do roadmap.)_
- [x] 🗄️ Repositórios Dapper por agregado (`UsersRepository`,
  `ConsultationsRepository`, `SubscriptionsRepository`, `TrackingRepository`…),
  todos com `@Parametro`.

---

## ⭐ 3. Requisitos de código da AV2 (pesa na nota)

> **Mínimo exigido pela rubrica** (faça pelo menos isto): **≥2 endpoints de regra de
> negócio** (não-CRUD de 1 tabela), **≥1 com JOIN**, **≥1 com 3+ validações → `400`
> com mensagem específica**, e **tudo parametrizado** (`@Parametro`).

### 🧮 Endpoint multi-validação (Regra 3) — `POST /consultations` (agendar)
- [x] 🧮 Antes do `INSERT`, validar **5 condições** (mais que as 3 exigidas) e
  retornar `400 Bad Request` com mensagem específica em cada falha:
  1. usuário tem **saldo de consultas** no tier (Free 1 / Pro 4 / Family 8) →
     consulta `COUNT` das consultas ativas vs. limite do plano.
  2. **slot livre** — não existe outra consulta do mesmo nutricionista no mesmo
     `date` + `time`.
  3. data **não é domingo**.
  4. `time` **dentro da agenda** do profissional.
  5. data **não está no passado**.
- [x] 🧮 Só após todas passarem, `INSERT` parametrizado. Espelha
  `services/consultations.service.ts` + `lib/nutritionists.ts`.

### 🔌 Endpoint com JOIN (Regra 2) — `GET /consultations/me`
- [x] 🔌 `SELECT ... FROM consultations c INNER JOIN nutritionists n ON
  n.id = c.nutritionist_id INNER JOIN users u ON u.id = c.user_id WHERE
  c.user_id = @UserId` — devolve a consulta já enriquecida (nome/foco/CRN do
  nutricionista). Espelha a tela de consultas agendadas.
  - _Alternativas que também cumprem o JOIN:_ `GET /me/subscription`
    (subscriptions × plans × users), `GET /nutri/diary/{date}` (meal_logs × foods).

### 🧮 2º endpoint de regra de negócio — `PUT /me/plan` (mudar de plano)
- [x] 🧮 Validar antes de gravar (≥3): (1) plano-alvo existe e ≠ atual;
  (2) transição permitida (regras de upgrade/downgrade); (3) cartão válido em
  upgrade — regra do mock: número terminando em `0000` é recusado → `400`;
  (4) sem cobrança pendente. Espelha `services/billing.service.ts` + `PlanManager`.

### 🔒 Regra 4 — queries parametrizadas
- [x] 🔒 Auditar todos os repos: **zero** concatenação/interpolação de string em SQL;
  exclusivamente `@Parametro` no Dapper.

---

## 🧮 4. Motor de cálculo nutricional no servidor

> Portar `src/lib/nutri-plan.ts` para C#. É "regra de negócio de verdade" (não-CRUD)
> e o alvo natural dos testes AAA (item 01/02).

- [x] 🧮 `Services/NutriPlanCalculator`: BMR (**Mifflin-St Jeor**), TDEE por fator de
  atividade (1.2 / 1.375 / 1.55 / 1.725 / 1.9), ajuste por objetivo
  (lose −18% / recomp −5% / gain +12% / performance +8% / health 0%).
- [x] 🧮 Macros: proteína por kg (2.0 / 1.9 / 1.8 / 1.8 / 1.6), gordura 27% das kcal,
  carbo no resto. Água `35ml/kg`. IMC + classificação (Abaixo / Saudável /
  Sobrepeso / Obesidade).
- [x] 🧮 Distribuição de refeições por nº (3→30/40/30, 4, 5, 6) e `autoSchedule` por
  horários acordar/treinar/dormir. (`MealPlanner`; cardápio entra no `NutriPlan`;
  exposto em `POST /nutri/schedule`.)
- [x] 🔌 Usado no onboarding (`POST /auth/register` + `PUT /nutri/profile`) e exposto
  em `GET /nutri/plan`. Confere com os 23 testes que já existem no front
  (`nutri-plan.test.ts`) como tabela-verdade.

---

## 🔌 5. Demais endpoints (espelho dos mocks do front)

> Trocar cada service mock pelo endpoint real. Os shapes de retorno já batem com os
> tipos do front (`src/types`).

| Service / origem | Função | Endpoint |
|---|---|---|
| `auth.service.ts` | `loginUser` | `POST /auth/login` |
| `auth.service.ts` | `registerUser` | `POST /auth/register` |
| `auth.service.ts` | `requestPasswordReset` / `resetPassword` | `POST /auth/forgot` · `POST /auth/reset` |
| `auth.service.ts` | `requestEmailVerification` / `verifyEmail` | `POST /auth/verify/resend` · `POST /auth/verify` |
| `nutri.service.ts` | `completeOnboarding` / perfil | `POST /auth/register` + `GET/PUT /nutri/profile` |
| `nutri.service.ts` | plano calculado | `GET /nutri/plan` |
| `plans.service.ts` | `getPlans` | `GET /plans` |
| `billing.service.ts` | `processPayment` | `POST /billing/checkout` (+ `PUT /me/plan`) |
| `consultations.service.ts` | `scheduleConsultation` | `POST /consultations` · `GET /consultations/me` · `DELETE /consultations/{id}` |
| `contact.service.ts` | `sendContactMessage` | `POST /contact` |
| `waitlist.service.ts` | `joinWaitlist` | `POST /waitlist` |
| `analytics.service.ts` | `track` / `pageView` | `POST /analytics/events` |
| `measurements-store` | medidas | `GET/POST /nutri/measurements` |
| `health-store` | sono / passos | `GET/POST /nutri/sleep` · `/nutri/steps` |
| tracking (água/peso/hábitos/diário) | logs diários | `GET/POST /nutri/water` · `/nutri/weight` · `/nutri/habits` · `/nutri/diary` |

- [x] 🔌 Implementar a tabela acima (auth, perfil/plano, planos, billing, consultas,
  contato, waitlist, analytics, tracking).
- [x] 🔌 Conta demo `demo@brl.com` / `123456` semeada pra bater com o front.
- [x] 🔌 Resposta 401 em token inválido (o axios do front já limpa a sessão no 401).

---

## ⭐ 6. Os 20 artefatos SDD (checklist 1-a-1)

> Cada item vale **0,5**. Respeite **caminho** e **literais** exatamente. Conteúdo
> deve ser específico do BRL Health (não genérico).

### 🧪 Testes (`/backend/tests`)
- [x] 📄 **01 — Padrão AAA:** ≥3 métodos de teste com os comentários `// Arrange`,
  `// Act` e `// Assert`. Bons candidatos: `NutriPlanCalculator`, agendamento de
  consulta, validação de mudança de plano.
- [x] 📄 **02 — Nomenclatura + independência:** nomes
  `Metodo_Cenario_ResultadoEsperado` (ex.:
  `AgendarConsulta_QuandoSemSaldoNoTier_DeveRetornar400`,
  `CalcularPlano_QuandoSexoMasculino_DeveAplicarMaisCinco`,
  `MudarPlano_QuandoCartaoTerminaEm0000_DeveRecusar`). **Nenhum** `if`/`switch`/`for`/
  `foreach`/`while` dentro de método de teste (zera o item).

### 📄 `/backend/docs/analise_arquitetura.md`
- [x] 📄 **03 — Padrões arquiteturais (parte 1):** para os **3 cenários do
  professor**, identificar o padrão provável e dar ≥1 trade-off usando os termos
  `Trade-off:` ou `Positivo:` / `Negativo:`.
- [x] 📄 **04 — Violações arquiteturais (parte 2):** no **trecho C# fornecido**,
  listar **≥5 violações**, cada uma no formato exato: `**Problema:**`,
  `**Evidência:**`, `**Impacto:**`, `**Ação Recomendada:**`.

### 📄 `/backend/docs/adrs/`
- [x] 📄 **05 — ADR:** criar `001-escolha-do-micro-orm.md` com `# Contexto`,
  `# Decisão`, `# Consequências`, campo `Status:` (`Aceito`) e, em Consequências,
  listas `Prós:` (ou `Positivas:`) e `Contras:` (ou `Negativas:`). Tema: **Dapper vs
  EF Core**. (Opcional: ADRs 002 Postgres vs SQLite, 003 cálculo no servidor.)

### 📄 `/backend/docs/registro_divida_tecnica.md`
- [x] 📄 **06 — Registro de dívida (tabela):** colunas `ID da Dívida`,
  `Descrição Técnica`, `Freq. Alteração`, `Risco`, `Esforço`, `Decisão`; **≥6
  dívidas reais** do próprio código; `Freq./Risco/Esforço` ∈ `Alto`/`Médio`/`Baixo`.
  Dívidas reais: seed hardcoded; cálculo nutricional duplicado (TS no front + C# no
  back); sem refresh token; sem paginação nas listas; validação duplicada front/back;
  sem rate-limit; conteúdo em código e não em DB/CMS.
- [x] 📄 **07 — Priorização:** coluna `Decisão` com `Prioridade 1 (Imediato)` /
  `Prioridade 2 (Próxima Sprint)` / `Prioridade 3 (Aceitar/Ignorar)`; **≥1 P1** e
  **≥1 P3**.

### 📄 `/backend/docs/fluxo_manutencao.md`
- [x] 📄 **08 — Classificação de manutenção (parte 1):** classificar os **12 tickets
  fornecidos** (Swanson: `Corretiva`/`Adaptativa`/`Perfectiva`/`Preventiva`), com a
  anotação explícita `Ticket N → Tipo`.
- [x] 📄 **09 — Pipeline de liberação segura (parte 2):** descrever os 4 passos:
  `1. Análise de Impacto`, `2. Teste como Instrumento Cirúrgico`,
  `3. Feature Toggle`, `4. Estratégia de Release e Regressão`.

### 📄 `/backend/docs/plano_iteracao.md`
- [x] 📄 **10 — Plano de iteração:** campos `Objetivo da Iteração:`,
  `Escopo (Backlog Selecionado):`, `Entregáveis (Evidências):`,
  `Risco Principal do Ciclo:` e `Definição de Pronto (DoD):` — todos preenchidos com
  conteúdo do projeto.
- [x] 📄 **11 — Quadro visual + WIP:** quadro com ≥4 colunas (ex.: `Backlog`,
  `Em Desenvolvimento`, `Code Review`, `Concluído`) e limite **`WIP máximo: N`**
  numérico, com **N ≤ nº de integrantes do grupo**.

### 📄 `/backend/docs/operacao.md`
- [x] 📄 **12 — Matriz de riscos:** colunas `Risco`, `Probabilidade`, `Impacto`,
  `Estratégia`, `Ação Planejada`; **≥5 riscos**; `Probabilidade`/`Impacto` ∈
  `Alto`/`Médio`/`Baixo`; `Estratégia` ∈ `Mitigar`/`Transferir`/`Aceitar`/`Evitar`.
- [x] 📄 **13 — Gatilhos:** coluna `Gatilho` em todas as linhas, ≥20 caracteres,
  descrevendo o evento observável que dispara a ação.
- [x] 📄 **14 — Métrica de fluxo (DORA):** ficha com os 7 campos `Nome da Métrica:`,
  `O que Mede:`, `Fórmula:`, `Fonte de Dados:`, `Frequência de Coleta:`,
  `Limites de Saúde:`, `Ação se Violado:`; deve citar `Deploy`/`Lead Time`/
  `Throughput`/`DORA`.
- [x] 📄 **15 — Métrica de qualidade:** mesma ficha de 7 campos; deve citar
  `Falha`/`Erro`/`Teste`/`Change Failure Rate`/`Cobertura`.
- [x] 📄 **16 — SLO:** para a rota mais crítica (`POST /consultations` ou
  `POST /auth/login`): `SLI (Indicador):`, `Fórmula de Coleta:`, `Fonte do Dado:`,
  `Janela de Medição:` (nº + `dias`/`horas`) e `Alvo (SLO):` (% — ex.: `99.5%`).
- [x] 📄 **17 — Error Budget Policy:** `Error Budget Policy:` com `Nível 1`,
  `Nível 2`, `Nível 3`; o `Nível 3` deve conter `congelamento` / `Feature Freeze` /
  `Zero novas funcionalidades`.

### 🔒 Segurança & fechamento
- [x] 🔒 **18 — SSDF (código):** nenhum `.cs` em `/backend/src` com `Password=`,
  `Pwd=`, `User Id=` ou `ConnectionString=` seguidos de literal. Usar
  `builder.Configuration` / `Environment.GetEnvironmentVariable` / `secrets.json`.
- [x] 📄 **19 — Threat Model + Gates** (`/backend/docs/seguranca_ciclo.md`):
  (a) Threat Model da rota de maior risco com `Ativos Protegidos:`,
  `Vetor de Ataque Provável:`, `Falha Arquitetural Potencial:`,
  `Controle de Engenharia (Mitigação):`; (b) `Gate 1`, `Gate 2`, `Gate 3`.
- [x] 📄 **20 — Team Topologies + DoD final:** `/backend/docs/topologia_times.md`
  mapeando `Stream-aligned`, `Platform`, `Enabling`, `Complicated-Subsystem` ao
  projeto; **e** `/backend/release_checklist_final.md` (na raiz de `/backend`) com as
  7 caixas marcadas `[x]`: Fundamentos, Produto Mínimo, Evidência de Qualidade,
  Decisões Documentadas, Evidência de Requisitos, Governança, Segurança.

---

## 🚀 7. Visão de produção (pós-AV2 — sem peso na nota)

> Itens do roadmap de produção, reescritos para o ecossistema .NET. Não contam pra
> AV2, mas ficam registrados.

- [ ] 🚀 **Auth real:** JWT (`Microsoft.AspNetCore.Authentication.JwtBearer`) +
  refresh token, hash de senha (`PasswordHasher`/BCrypt), verificação e reset de
  e-mail de verdade.
- [ ] 🚀 **Pagamento — manter Stripe:** `Stripe.net` (SDK oficial .NET) para
  checkout, webhooks, gestão/cancelamento de assinatura e faturas. _Avaliação: sem
  motivo pra trocar — é a opção mais confortável no .NET._
- [ ] 🚀 **E-mail transacional — trocar Resend** por opção mais .NET-native atrás de
  uma abstração `IEmailSender`: **MailKit** (SMTP, ex. Amazon SES) ou **SendGrid**
  (SDK Twilio); `FluentEmail` como camada opcional. _Resend segue viável via
  HTTP/SDK, mas não é o caminho mais confortável no .NET._ Boas-vindas, verificação,
  reset, recibo, waitlist.
- [ ] 🚀 **Conteúdo:** mover artigos/receitas pra DB ou CMS.
- [ ] 🚀 **Rate limiting** (`Microsoft.AspNetCore.RateLimiting`), **validação
  server-side** (FluentValidation), **logs/observabilidade** (Serilog +
  OpenTelemetry + health checks).
- [ ] 🚀 **LGPD:** exportar/excluir dados, consentimento.
- [ ] 🚀 **Jobs em background** (Hangfire/Quartz) para e-mails e geração de cardápio.
- [ ] 🚀 **IA de cardápio:** geração por LLM atrás de `IMenuGenerator`
  (provider-agnostic, via HTTP), a partir do perfil + banco de alimentos (TACO/USDA).

---

## 📋 8. Ordem de execução sugerida

1. **Setup** (`/backend`, solution, Dapper, config sem segredos).
2. **Banco + seed** (schema, repos parametrizados, conta demo).
3. **Motor de cálculo + auth básica** (onboarding gera o plano).
4. **Endpoints de negócio da AV2** (`POST /consultations` com 5 validações,
   `GET /consultations/me` com JOIN, `PUT /me/plan`).
5. **Testes AAA** (itens 01/02) sobre cálculo + agendamento + mudança de plano.
6. **Demais endpoints** (espelho dos mocks).
7. **Artefatos SDD** (itens 03–20) — a maior parte da nota.
8. **`release_checklist_final.md`** marcado.
9. **Pós-AV2** (produção), quando sobrar fôlego.
