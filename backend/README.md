# BRL Health — Backend (AV2)

Minimal API em **C# (.NET 10) + Dapper** sobre **PostgreSQL**. Backend do
ecossistema BRL Health (ver produto no `CLAUDE.md` da raiz). Entrega da **AV2**:
requisitos de código + 20 artefatos SDD (em `docs/`).

## Stack

- **.NET 10** Minimal API
- **Dapper** (micro-ORM) + **Npgsql** (PostgreSQL)
- **xUnit** (testes)
- Queries 100% parametrizadas (`@Parametro`), sem ORM pesado.

## Estrutura

```
backend/
├── BrlHealth.slnx
├── src/BrlHealth.Api/
│   ├── Domain/         # enums + modelos (NutriProfile, NutriPlan)
│   ├── Services/       # regra de negócio pura (cálculo + validações)
│   ├── Data/           # Dapper: factory, repositórios, schema.sql, seed.sql
│   ├── Endpoints/      # mapeamento dos endpoints (Minimal API)
│   └── Program.cs
├── tests/BrlHealth.Tests/   # testes AAA
├── docs/               # 20 artefatos SDD da AV2
└── release_checklist_final.md
```

## Configuração (sem segredos no código — SSDF)

A connection string **nunca** é literal em `.cs`. Em desenvolvimento, use
user-secrets ou `appsettings.Development.json` (não versionado). Em produção, a
variável de ambiente `BRLHEALTH_DB`.

```bash
cd src/BrlHealth.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=brlhealth;Username=postgres;Password=SUA_SENHA"
```

Veja `appsettings.Example.json` para o formato.

### JWT (auth real)

A autenticação usa **JWT (HS256)** + refresh token. O segredo de assinatura vem
da seção `Jwt` da configuração — em dev há um valor de exemplo em
`appsettings.json`; **em produção sobrescreva via ambiente**:

```bash
export Jwt__Secret="<segredo-forte-de-pelo-menos-32-bytes>"
# opcionais: Jwt__AccessTokenMinutes, Jwt__RefreshTokenDays, Jwt__Issuer, Jwt__Audience
```

E-mails (reset de senha / verificação) usam um `IEmailSender`; em dev o
`ConsoleEmailSender` apenas **loga** a mensagem — o provedor real (Resend/SES/SendGrid)
entra atrás do mesmo contrato na fase de produção.

### IA de cardápio (opcional)

`POST /nutri/menu` gera o cardápio via `IMenuGenerator`. Sem chave, usa o
`LocalMenuGenerator` (determinístico). Para gerar por **OpenAI/ChatGPT**, defina a
chave por ambiente (a geração por IA cai no gerador local em qualquer falha):

```bash
export OpenAI__ApiKey="sk-..."
export OpenAI__Model="gpt-4o-mini"   # opcional
```

## Subir o banco

```bash
# com um Postgres rodando em localhost:5432
psql -h localhost -U postgres -d brlhealth -f src/BrlHealth.Api/Data/schema.sql
psql -h localhost -U postgres -d brlhealth -f src/BrlHealth.Api/Data/seed.sql
```

O seed cria a conta demo (`demo@brl.com` / `123456`), os 3 planos e os 4
nutricionistas, para bater com o front.

## Rodar

```bash
dotnet build BrlHealth.slnx
dotnet test  BrlHealth.slnx          # 35 testes AAA
dotnet run --project src/BrlHealth.Api
```

> `GET /health`, `GET /health/live` e `POST /nutri/plan` (motor de cálculo)
> funcionam sem banco; os endpoints de consulta/plano e `GET /health/ready`
> precisam do PostgreSQL configurado.

## Observabilidade e proteção

- **Logs estruturados:** [Serilog](https://serilog.net) no console + request
  logging (`HTTP {Método} {Rota} respondeu {Status} em {ms}`).
- **Health checks:** `GET /health/live` (liveness, sem dependências) e
  `GET /health/ready` (readiness — faz `SELECT 1` no Postgres; `503` se o banco
  estiver fora).
- **Rate limiting** (`Microsoft.AspNetCore.RateLimiting`): teto global de
  120 req/min por IP e política estrita de **10 req/min em `/auth/*`**
  (anti-brute-force); ao exceder, `429` com header `Retry-After`.
- **Validação server-side** ([FluentValidation](https://fluentvalidation.net)):
  os DTOs de entrada (registro, login, reset, consentimento) passam por um
  `ValidationFilter` que devolve `400 { errors: [...] }` antes do handler.
- **Tracing/métricas** ([OpenTelemetry](https://opentelemetry.io)): instrumentação
  de ASP.NET Core, HttpClient e Npgsql. Sem coletor, usa o **console exporter**
  (spans no stdout); para exportar via OTLP, defina `Otel__Endpoint`
  (ex.: `http://localhost:4317`).
- **Jobs em background** ([Hangfire](https://www.hangfire.io)): o envio de e-mail
  (reset/verificação) é **enfileirado** (`IEmailQueue`) e processado por um worker,
  com retry. Painel em `/hangfire` (dev). Storage em memória em dev — em produção,
  trocar por `Hangfire.PostgreSql`.

## Endpoints de negócio (requisitos da AV2)

| Método | Rota | Regra |
|---|---|---|
| `POST` | `/nutri/plan` | Motor de cálculo nutricional (Mifflin-St Jeor, TDEE, macros, água, IMC) + cardápio do dia |
| `POST` | `/nutri/schedule` | Encaixa os horários das refeições na rotina (acordar/treinar/dormir) |
| `POST` | `/nutri/menu` | Gera o cardápio do dia via `IMenuGenerator` (local por padrão; IA quando há chave) |
| `POST` | `/consultations` | Agendamento com **5 validações** → `400` com mensagem específica |
| `GET`  | `/consultations/me` | Consultas do usuário com **INNER JOIN** (consultations × nutritionists × users) |
| `PUT`  | `/me/plan` | Mudança de plano com **4 validações** (cartão `0000` recusado, etc.) |

## Endpoints do espelho dos mocks (§5)

Trocam os _services_ mock do front por API real. Rotas com 🔒 exigem
`Authorization: Bearer <token>` (token inválido/ausente → `401`).

| Método | Rota | Origem (front) |
|---|---|---|
| `POST` | `/auth/login` · `/auth/register` | `auth.service.ts` |
| `POST` | `/auth/refresh` · `/auth/logout` | rotação/encerramento da sessão (refresh token) |
| `POST` | `/auth/forgot` · `/auth/reset` | `auth.service.ts` (token de reset por e-mail) |
| `POST` 🔒 | `/auth/verify/resend` · `/auth/verify` | `auth.service.ts` (código de 6 dígitos por e-mail) |
| `GET`/`PUT` 🔒 | `/nutri/profile` | `nutri.service.ts` |
| `GET` 🔒 | `/nutri/plan` | plano calculado do perfil salvo |
| `GET` | `/plans` | `plans.service.ts` |
| `GET` | `/foods` · `/meals` | catálogo do cardápio (`lib/foods.ts` · `lib/meals.ts`) |
| `GET` | `/articles` · `/articles/{id}` | conteúdo editorial (`lib/nutri-content.ts`) |
| `GET` | `/recipes` · `/recipes/{id}` | catálogo de receitas (`RECIPES_CATALOG`, página `/receitas`) |
| `POST` 🔒 | `/billing/checkout` | `billing.service.ts` |
| `DELETE` 🔒 | `/consultations/{id}` | cancelar (devolve crédito) |
| `POST` | `/contact` · `/waitlist` · `/analytics/events` | contato / waitlist / analytics |
| `GET`/`POST` 🔒 | `/nutri/water` · `/weight` · `/sleep` · `/steps` · `/measurements` · `/habits` · `/diary` | tracking diário |
| `GET`/`DELETE` 🔒 | `/me/data-export` · `/me/account` | LGPD: exportar todos os dados · excluir conta (cascata) |
| `POST`/`GET` 🔒 | `/me/consent` | LGPD: registrar / listar consentimentos |

> **Auth real (§7):** access token **JWT (HS256)** com claim `sub`, **refresh
> token** rotativo (single-use, hash no banco) via `/auth/refresh`, senha em
> **BCrypt** (work factor 12, com migração transparente dos hashes legados) e
> fluxos reais de reset/verificação por e-mail. Falta apenas o **provedor de
> e-mail de produção** (hoje `ConsoleEmailSender`) e a validação server-side
> completa (FluentValidation), itens dos demais bullets da §7.
