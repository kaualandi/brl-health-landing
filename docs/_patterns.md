# Padrões do repositório (BRL Health)

Monorepo **Turborepo + Bun workspaces**. Leia também `CLAUDE.md` (regras) e `AGENTS.md`.

## Layout
- `apps/web` — Next.js 16 (App Router). **O contrato da API é definido aqui**:
  `apps/web/src/services/*.ts`, `apps/web/src/lib/*-store.ts`, `apps/web/src/types/index.ts`.
  Não mude o front pra caber na API — a API se adapta ao front.
- `apps/api` — Elysia (Bun) + Drizzle ORM + PostgreSQL.

## API (`apps/api/src`)
- `app.ts` compõe tudo e é exportado (testes usam `app.handle`); `index.ts` só faz `listen`.
- **Um módulo por domínio** em `modules/<dominio>.ts`, exportando uma instância Elysia
  (`export const fooModule = new Elysia().use(auth)...`) registrada em `app.ts` com `.use(fooModule)`.
  Regras puras (validações de negócio) podem ir em `modules/<dominio>.rules.ts` quando crescerem.
- **Banco:** `import { db, schema } from "../db"`. Query builder do Drizzle; `` sql`...` `` só quando
  necessário (sempre parametrizado). Mudou o `db/schema.ts`? Rode `bun run db:generate` e
  commite a migração gerada em `drizzle/`. Catálogos de seed: `db/seed.sql` (idempotente).
- **Auth:** rota protegida declara `{ auth: true }` e recebe `userId` (number) no contexto
  (`lib/auth.ts`). Nunca aceite `userId` do body/query. Assinar token: `jwt.sign({ sub: String(id) })`
  (plugin `jwtPlugin`, 15 min).
- **Validação:** schema `t.Object(...)` do Elysia no `body`/`query`/`params` — falha vira
  `400 { errors: string[] }` automaticamente (`lib/errors.ts`).
- **Erros:** `return status(400, { errors: ["mensagem em PT-BR"] })` para regra de negócio;
  `status(401|403|404|409, { error: "..." })` para o resto. Mensagens em português, voltadas ao usuário.
- **Respostas:** exatamente o shape que o service do front espera. `id` de usuário serializado
  como **string**; datas `YYYY-MM-DD`; horas `HH:MM`; numéricos como `number`.
- **Datas:** "hoje" = `today()` de `lib/date.ts` (fuso `APP_TZ`). Nunca `new Date().toISOString()` p/ dia.
- **Rate limit:** `rateLimit(nome, max)` de `lib/rate-limit.ts` (`/auth/*` usa `config.authRateLimit`).
- **Env:** só via `config.ts`. Integração opcional sem chave degrada (e-mail loga no console;
  Stripe responde `501 { error }`).
- **Referência da API antiga** (.NET, regras de negócio): `git show av2-dotnet-final:backend/src/BrlHealth.Api/<arquivo>`.

## Testes
- `bun test` em `apps/api`, arquivos `modules/<dominio>.test.ts`, contra o Postgres do compose
  (`docker compose up -d db` + `bun run db:migrate && bun run db:seed`).
- Use `api(method, path, body?, token?)` de `test/http.ts`. Cada teste cria seus próprios dados
  (e-mail único via `crypto.randomUUID()`); a conta demo é só leitura.
- Cubra: caminho feliz, 401 sem token, cada 400 de regra de negócio, e o shape da resposta.

## Gates (rodar da raiz)
`bun run lint && bun run typecheck && bun run test && bun run build`

## Git
Branch por ticket a partir do `main`; título de commit em inglês com prefixo conventional,
corpo em português (o porquê). Sem co-autoria do assistente.
