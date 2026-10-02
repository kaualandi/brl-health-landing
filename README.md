# BRL Health

**Ecossistema de saúde que une treino e nutrição que se conversam.** Dois
produtos sob a mesma marca:

- **🥗 BRL Nutri — ativo.** App de nutrição personalizada: monta o cardápio em
  nível de alimento, calcula calorias e macros, e acompanha a evolução (peso,
  água, medidas, sono, passos, hábitos).
- **💪 BRL Fit — em breve.** App de treino adaptativo, hoje uma página de "em
  breve" com lista de espera.

> **Status:** monorepo **Turborepo** com o front Next.js (`apps/web`) e a API
> **Elysia + Drizzle + PostgreSQL** (`apps/api`), reconstruída a partir do que o
> front consome. O `localStorage` do front funciona só como **cache**
> (write-through pra API). Conteúdo de UI sem tabela (FAQ, textos legais, copy de
> marketing) segue estático de propósito. Documentação de produto em
> [`CLAUDE.md`](./CLAUDE.md); backlog da API nas
> [issues do GitHub](https://github.com/kaualandi/brl-health-landing/issues).


---

## Stack

**Front (`apps/web`)**
- **[Next.js 16](https://nextjs.org)** (App Router) + **[React 19](https://react.dev)**
- **[Tailwind CSS 4](https://tailwindcss.com)** + **[base-ui](https://base-ui.com)** + **[shadcn](https://ui.shadcn.com)**
- **[TanStack Query](https://tanstack.com/query) / [Form](https://tanstack.com/form)** + **[Zod](https://zod.dev)**, **axios**, **anime.js**, **lucide-react**
- **[Vitest](https://vitest.dev)** (testes unitários)

**API (`apps/api`)**
- **[Bun](https://bun.sh)** + **[Elysia](https://elysiajs.com)** (validação com `t`/TypeBox)
- **[Drizzle ORM](https://orm.drizzle.team)** + **PostgreSQL 16** (migrações com `drizzle-kit`)
- JWT (`@elysiajs/jwt`) + refresh token rotativo, senhas com `Bun.password` (bcrypt)
- Stripe e Resend opcionais (sem chave, degradam com elegância)

**Monorepo:** Bun workspaces + **[Turborepo](https://turborepo.com)**; Postgres e API em **docker compose**.

> ⚠️ Esta versão do Next.js tem _breaking changes_. Consulte
> `node_modules/next/dist/docs/` antes de mexer no front (ver [`AGENTS.md`](./AGENTS.md)).

---

## Pré-requisitos

- **Bun 1.3+** (gerenciador de pacotes e runtime da API)
- **Docker** (Postgres e, opcionalmente, a API)

---

## Começando

```bash
# 1. Dependências (todas as apps)
bun install

# 2. Banco em Docker (porta 5433 no host, pra não brigar com outro Postgres)
cp .env.example .env                    # JWT_SECRET usado pelo compose
docker compose up -d db

# 3. API: env, migrações e seed
cp apps/api/.env.example apps/api/.env  # ajuste JWT_SECRET (32+ caracteres)
cd apps/api && bun run db:migrate && bun run db:seed && cd -

# 4. Sobe front (:3000) e API (:3333) juntos
bun run dev
```

Ou suba **banco + API** inteiros em containers: `docker compose up -d --build`
(a API roda migrações e seed no boot) e depois só o front com `bun run dev --filter web`.

### Login demo

Conta semeada (`apps/api/src/db/seed.sql`): **`demo@brl.com`** / **`123456`**.

---

## Scripts (raiz, via Turborepo)

| Script              | O que faz                                                 |
| ------------------- | --------------------------------------------------------- |
| `bun run dev`       | Front (Next dev) + API (Bun watch) em paralelo.            |
| `bun run build`     | Build de produção do front.                                |
| `bun run lint`      | ESLint do front.                                           |
| `bun run typecheck` | `tsc --noEmit` em todas as apps.                           |
| `bun run test`      | Vitest (front) + `bun test` (API, precisa do Postgres up). |

Da API (`cd apps/api`): `db:generate` (gera migração a partir do `schema.ts`),
`db:migrate`, `db:seed`.

---

## Variáveis de ambiente

**Front** — [`apps/web/.env.example`](./apps/web/.env.example):

| Variável               | Default                    | Para quê                                            |
| ---------------------- | -------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://brlhealth.com.br` | URL canônica do site (SEO: metadata, sitemap, OG).  |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3333`    | Base URL da API.                                    |

**API** — [`apps/api/.env.example`](./apps/api/.env.example): `DATABASE_URL`,
`JWT_SECRET` (obrigatórias), `PORT`, `CORS_ORIGIN`, `TRUST_PROXY`, `APP_TZ`
(default `America/Sao_Paulo` — define o "hoje" do tracking) e as opcionais
`STRIPE_*`, `RESEND_API_KEY`, `EMAIL_FROM`. Nenhuma credencial fica no código.

> `NEXT_PUBLIC_*` vai pro bundle do cliente — nunca coloque segredos nelas.

---

## Pagamentos (Stripe)

O `/checkout` decide o modo pela resposta de `GET /billing/stripe/config`:

| API | O que o `/checkout` mostra | Como o plano é ativado |
| --- | --- | --- |
| **Sem `STRIPE_SECRET_KEY`** (default) | Formulário de cartão **mock** | `POST /billing/checkout` valida e ativa (cartão terminando em `0000` → recusado). |
| **Com `STRIPE_SECRET_KEY`** | Botão **"Pagamento seguro pelo Stripe"** | O webhook `checkout.session.completed` ativa o plano. Upgrade pelo mock fica bloqueado. |

Teste local: `stripe listen --forward-to localhost:3333/billing/stripe/webhook`
e suba a API com `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` e
`STRIPE_WEBHOOK_SECRET` (o `whsec_` impresso). Cartão de teste `4242 4242 4242 4242`.

---

## Estrutura

```
apps/
├── web/                 # Next.js (App Router)
│   └── src/{app,components,lib,services,hooks,providers,types}
└── api/                 # Elysia
    ├── src/
    │   ├── app.ts       # composição dos módulos (exportado pros testes)
    │   ├── index.ts     # listen
    │   ├── config.ts    # env validado
    │   ├── db/          # schema.ts (Drizzle), migrate.ts, seed.ts/.sql
    │   ├── lib/         # auth (JWT macro), errors, rate-limit, date
    │   └── modules/     # um arquivo de rotas por domínio (+ *.test.ts)
    └── drizzle/         # migrações geradas
docker-compose.yml       # db (+ api)
turbo.json
```

---

## CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml): Bun + serviço Postgres →
`bun install` → migrações/seed → `lint` → `typecheck` → `test` → `build`.

---

## Deploy

- **Front (Vercel):** importe o repo com **Root Directory = `apps/web`**; defina
  `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_API_URL` (embutidas no build).
- **API + banco (VPS/qualquer host Docker):** `docker compose up -d --build` com
  `.env` de produção (`JWT_SECRET` forte, `POSTGRES_PASSWORD`, `CORS_ORIGIN` = URL
  pública do front, `TRUST_PROXY=true` atrás do proxy, chaves Stripe/Resend se usar), atrás de um proxy com TLS. O
  webhook do Stripe aponta pra `https://<api>/billing/stripe/webhook`.

> Só faça deploy de código **revisado e mergeado** no `main`.

---

## Integrantes
- Lucas Abrahão Anes - 06009881
- Kauã Landi Fernando - 06009262
- Natan de Souza Sampaio - 06010668
- Guilherme da Cunha Sequeira - 06002529
- Murilo de Melo Mouteira - 06010561
- Lucas Gomes Coco da Silva - 06011471

## Créditos

O catálogo de exercícios (nomes, instruções e GIFs) vem do
[ExerciseDB](https://github.com/ExerciseDB/exercisedb-api). Os endpoints gratuitos são só para
exploração, por isso importamos o conteúdo uma vez (`bun run db:import-exercises --media` em
`apps/api`) e o servimos pela nossa API. O código do projeto deles é AGPL-3.0; o conteúdo
importado segue os termos de uso do ExerciseDB e a atribuição "Dados e GIFs: ExerciseDB" deve ser
mantida (exposta em `GET /exercises/filters`).
