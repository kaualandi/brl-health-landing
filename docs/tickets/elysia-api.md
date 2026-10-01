# Tickets: API Elysia (reconstrução a partir do front)

Contrato = o que `apps/web` envia e lê (`apps/web/src/services`, `apps/web/src/lib/*-store.ts`,
`apps/web/src/types`). Regras de negócio antigas (.NET) para referência:
`git show av2-dotnet-final:backend/src/BrlHealth.Api/<arquivo>`. Convenções em `docs/_patterns.md`.
Todo ticket: módulo em `apps/api/src/modules/`, registrado em `app.ts`, com testes de contrato.

## T-1 · Login, cadastro e sessão com refresh rotativo

**Issue:** #143

**O que construir:** módulo de auth: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`,
`POST /auth/logout`, com rate limit em todo `/auth/*`. Habilita todas as rotas logadas do front.
Também cria o helper de teste `signup()` (usuário novo + token) em `apps/api/src/test/users.ts`
e o `apps/api/.env.test` versionado (`AUTH_RATE_LIMIT=1000`, liberar `!.env.test` no `.gitignore`)
para os testes não esbarrarem no rate limit.

**Bloqueado por:** Nenhum — pode começar já

- [x] `POST /auth/login {email,password}` → 200 `{ user:{id:string,name,email}, token, refreshToken }`; senha errada/inexistente → 401 `{ error: "Credenciais inválidas" }`; campos vazios → 400 `{ errors }`
- [x] `POST /auth/register {name,email,password}` → 201 mesmo shape; cria assinatura `free`; e-mail duplicado → 400 `["E-mail já cadastrado."]`; nome vazio/e-mail inválido/senha < 6 → 400
- [x] Senha com `Bun.password` (bcrypt); access token JWT HS256 `sub`=id, 15 min (`jwtPlugin`)
- [x] Refresh token opaco (32 bytes base64url), só o SHA-256 no banco, 30 dias; `POST /auth/refresh {refreshToken}` revoga o antigo e devolve novo par; inválido/expirado/revogado → 401 `{ error: "Sessão expirada. Faça login novamente." }`
- [x] `POST /auth/logout {refreshToken}` → 200 `{ message }` sempre (idempotente), revoga se existir
- [x] `/auth/*` com `rateLimit("auth", config.authRateLimit)` → 429 `{ error }`
- [x] Testes cobrindo cada item acima (incluindo reuso de refresh token já rotacionado → 401) e o login da conta demo

## T-2 · Conta: recuperação de senha, verificação de e-mail e exclusão (LGPD)

**Issue:** #144

**O que construir:** `POST /auth/forgot`, `POST /auth/reset`, `POST /auth/verify/resend`, `POST /auth/verify`
e `DELETE /me/account`, com envio de e-mail via Resend (`fetch`) ou console quando `RESEND_API_KEY` não existe.

**Bloqueado por:** T-1

- [x] `forgot {email}` → 200 `{ message: "Se houver uma conta, enviamos um link de redefinição." }` sempre; se a conta existe, token opaco (hash SHA-256 em `email_tokens`, purpose `reset`, 1h) e e-mail com `${CORS_ORIGIN}/redefinir-senha?token=...`
- [x] `reset {token,password}` → 200 `{ message: "Senha redefinida" }`; troca o hash, consome o token e revoga **todos** os refresh tokens do usuário; token inválido/expirado/usado → 400 `["Link inválido ou expirado"]`; senha < 6 → 400
- [x] `verify/resend` (auth) → 200 `{ message }`; código de 6 dígitos (hash, 15 min), consome códigos anteriores; sem token → 401
- [x] `verify {code}` (auth) → 200 `{ message: "E-mail verificado" }` e `email_verified=true`; formato ≠ 6 dígitos → 400 `["Código inválido. Confira os 6 dígitos."]`; errado/expirado/de outro usuário → 400 `["Código inválido ou expirado. Solicite um novo."]`
- [x] `DELETE /me/account` (auth) → 200 `{ message: "Conta e dados excluídos" }`, apaga em cascata; usuário inexistente → 404 `{ error: "Conta não encontrada" }`
- [x] E-mail: sender único em `apps/api/src/lib/email.ts` (Resend se `RESEND_API_KEY`, senão `console.log`), sem bloquear a resposta
- [x] Testes (capturar o token/código via sender de console mockado ou lendo o banco)

## T-3 · Perfil nutricional (onboarding servidor-autoritativo)

**Issue:** #145

**O que construir:** `GET /nutri/profile` e `PUT /nutri/profile` (upsert) por usuário logado.

**Bloqueado por:** T-1

- [x] `GET` → 200 com `{ sex, age, heightCm, weightKg, goalWeightKg|null, goal, activity, diet, restrictions[], mealsPerDay, waterGlasses, meals:{name,time}[], wakeTime|null, trainTime|null, sleepTime|null }` (números como number); sem perfil → 404 `{ error }`; sem token → 401
- [x] `PUT` mesmo body (ver `apps/web/src/services/nutri.service.ts`) → 200 com o perfil salvo; cria ou substitui; enums validados com `t.Union(t.Literal...)`; valores fora do domínio → 400 `{ errors }`
- [x] `goalWeightKg` mapeia `target_kg`; `meals` em JSONB; `restrictions` em `text[]`
- [x] Testes: round-trip PUT→GET, upsert, 404, 401, 400

## T-4 · Catálogos públicos: alimentos, nutricionistas, artigos e receitas

**Issue:** #146

**O que construir:** `GET /foods`, `GET /nutritionists`, `GET /articles`, `GET /articles/:id`, `GET /recipes`, `GET /recipes/:id` (públicos, do seed).

**Bloqueado por:** Nenhum — pode começar já

- [x] `/foods` → `{ id, name, emoji, role, portion, kcal, protein, carb, fat, diets, excludedBy }[]` (32 itens do seed)
- [x] `/nutritionists` → `{ id, name, avatar, crn, focus, bio, rating:number, reviews, years, goals, diets }[]`
- [x] `/articles` → lista **sem** `body` (`{ id, category, emoji, title, excerpt, readTime, author, goals }`); `/articles/:id` → com `body` (seções); inexistente → 404 `{ error }`
- [x] `/recipes` e `/recipes/:id` no shape `RecipeFull`: `time` (de `prep_time`), `macros:{protein,carbs,fat}` aninhado, `servings`, `diet`, `goals`, `ingredients`, `steps`, `tags`; inexistente → 404
- [x] Testes de shape de cada rota (contra o seed) e dos 404

## T-5 · Contato, lista de espera e analytics

**Issue:** #147

**O que construir:** `POST /contact`, `POST /waitlist`, `POST /analytics/events` (públicos).

**Bloqueado por:** Nenhum — pode começar já

- [x] `contact {name,email,subject,message}` → 201 `{ id: string }`; valida nome ≥ 2, e-mail válido, `subject ∈ duvida|sugestao|parceria|outro`, mensagem 10–500 → 400 `{ errors }` em PT
- [x] `waitlist {email, source?: "fit"|"newsletter"}` → 200 `{ joined: true }`; idempotente (`onConflictDoNothing`); e-mail inválido → 400
- [x] `analytics/events {event, props?}` → 202; nunca quebra o front (props JSONB)
- [x] Testes de sucesso, 400 e idempotência

## T-6 · Planos, assinatura e checkout de demonstração

**Issue:** #148

**O que construir:** `GET /plans`, `GET /me/subscription`, `PUT /me/plan` (4 regras de negócio) e `POST /billing/checkout` (mock).

**Bloqueado por:** T-1

- [x] `/plans` → `{ id, monthlyPrice:number, credits }[]` ordenado por rank
- [x] `/me/subscription` (auth) → `{ planId, credits, hasPendingCharge }` (JOIN subscriptions×plans; sem assinatura → free)
- [x] `PUT /me/plan {target, cardNumber?}` (auth) → 200 `{ plan }`; regras em `modules/plans.rules.ts` → 400 `{ errors }`: "Plano-alvo inexistente.", "Você já está neste plano.", upgrade com cartão inválido/terminando em 0000 → "Pagamento recusado pelo emissor. Tente outro cartão.", "Há uma cobrança pendente. Regularize antes de mudar de plano."; **com `STRIPE_SECRET_KEY` configurada, upgrade → 400 mandando usar o checkout** (downgrade/cancelar segue livre)
- [x] `POST /billing/checkout {planId, card:{holder,number,expiry,cvv}}` (auth) → 200 `{ planId, paidAt }` e ativa o plano; plano inexistente/cartão < 13 dígitos/terminando em 0000 → 400; com Stripe configurado → 400
- [x] Testes de cada regra, do upgrade/downgrade e do bloqueio com Stripe (setando env no teste)

## T-7 · Pagamento real com Stripe

**Issue:** #149

**O que construir:** `GET /billing/stripe/config`, `POST /billing/stripe/checkout`, `POST /billing/stripe/portal`, `POST /billing/stripe/webhook` usando o SDK `stripe`.

**Bloqueado por:** T-6

- [x] `config` → `{ publishableKey, configured }` (público)
- [x] `checkout {planId}` (auth) → `{ url, sessionId }` (Checkout Session `mode: subscription`, preço inline em BRL, metadata `{userId, planId}`, success `${CORS_ORIGIN}/conta?checkout=success`, cancel `${CORS_ORIGIN}/precos?checkout=cancel`); plano free/inexistente → 400; sem chave → 501 `{ error: "Pagamento não configurado." }`
- [x] `portal` (auth) → `{ url }`; sem `stripe_customer_id` → 400 `["Nenhuma assinatura paga para gerenciar."]`; sem chave → 501
- [x] `webhook` valida `stripe-signature` com o corpo cru (`STRIPE_WEBHOOK_SECRET`); `checkout.session.completed` ativa o plano e grava o customer; `customer.subscription.deleted` volta pra free; assinatura inválida → 400
- [x] Testes: 501 sem chave, 400s, e o webhook com evento assinado via `stripe.webhooks.generateTestHeaderString`

## T-8 · Agendamento de consultas com nutricionista

**Issue:** #150

**O que construir:** `POST /consultations` (5 regras), `GET /consultations/me` (JOIN) e `DELETE /consultations/:id`.

**Bloqueado por:** T-1, T-6

- [x] `POST {nutritionistId, date:YYYY-MM-DD, time:HH:MM}` (auth) → 201 `{ id:number }`; regras em `modules/consultations.rules.ts`, todas as violações juntas em 400 `{ errors }`: "Sem saldo de consultas no seu plano." (agendadas ≥ créditos do plano), "Horário já ocupado para este nutricionista.", "Não há atendimento aos domingos.", "Horário fora da agenda do profissional." (agenda: ana-prado 08:00/09:00/10:00/14:00/15:00; rafael-couto 07:00/12:00/18:00/19:00/20:00; bianca-rios 09:00/10:00/11:00/16:00/17:00; diego-martins 08:30/11:30/13:30/16:30/18:30), "A data não pode estar no passado." (comparando com `today()`, não UTC)
- [x] `GET /consultations/me` (auth) → `{ id, nutritionistId, date, time, nutritionistName, nutritionistFocus, crn, userName }[]` só agendadas, ordenado por data+hora (JOIN consultations×nutritionists×users)
- [x] `DELETE /consultations/:id` (auth) → 204 se for do usuário e agendada (status `cancelled`, devolve o crédito); senão 404
- [x] Testes de cada regra, do JOIN e do cancelamento devolvendo saldo

## T-9 · Tracking diário (água, peso, sono, passos, medidas, hábitos, diário)

**Issue:** #151

**O que construir:** GET + POST de `/nutri/water`, `/nutri/weight`, `/nutri/sleep`, `/nutri/steps`, `/nutri/measurements`, `/nutri/habits`, `/nutri/diary` (auth), upsert por (usuário, dia de `today()`).

**Bloqueado por:** T-1

- [x] water: GET `{ ml }` do dia (0 se vazio), POST `{ml}` total absoluto do dia (clamp ≥ 0) → `{ ml }`
- [x] weight/sleep/steps: GET histórico `{date, kg|hours|count}[]` ordenado por data; POST `{kg}` / `{hours}` / `{count}` upsert do dia (clamp ≥ 0) → valor salvo
- [x] measurements: GET `{date, waist, hip, chest, arm, thigh}[]` (null quando vazio); POST parcial mescla com o dia (não apaga o que não veio) → `{ saved: true }`
- [x] habits/diary: GET mapa `Record<string, boolean>` do dia (`{}` se vazio); POST `{done}` substitui o do dia → `{ saved: true }`
- [x] Aceita `date` opcional (YYYY-MM-DD) no body/query; padrão `today()` no fuso do app
- [x] Testes: round-trip de cada métrica, upsert, merge de medidas, 401

## T-10 · Validação ponta a ponta do front contra a API nova

**Issue:** #152

**O que construir:** rodar `apps/web` contra a API e corrigir qualquer divergência de contrato encontrada (na API).

**Bloqueado por:** T-2, T-3, T-4, T-5, T-7, T-8, T-9

- [x] `docker compose up -d db`, API e front no ar; login demo, onboarding de usuário novo, abas do /nutri (tracking grava e reidrata), consulta agendar/cancelar, /precos e /checkout mock, /conta (downgrade), contato e waitlist
- [x] Páginas públicas com dados da API (`/conteudos`, `/receitas`, sitemap)
- [x] Nenhum erro de contrato no console/rede; divergências corrigidas com teste de regressão
