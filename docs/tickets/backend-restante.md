# Tickets: backend BRL Health — trabalho restante

Lacunas do backend (.NET + Dapper + Postgres, em `/backend`) encontradas numa auditoria por tela + transversal em 2026-08-14. O backend já existe e está integrado ao frontend — estes tickets são o que falta, não construção do zero.

Trabalhe o **frontier**: qualquer ticket cujos bloqueadores estejam todos done. Listados em ordem de dependência. Publicados como issues em `kaualandi/brl-health-landing` e no project [BRL Health](https://github.com/users/kaualandi/projects/2/views/1).

> **Restrição vinculante:** `PUT /me/plan` e `POST /consultations` são os dois endpoints de regra de negócio avaliados pela AV2. Não remover nem esvaziar as validações deles — só restringir/complementar.

## Índice por épico

- **Segurança e cobrança** (11) — [#75](#75), [#76](#76), [#77](#77), [#78](#78), [#79](#79), [#80](#80), [#81](#81), [#82](#82), [#83](#83), [#84](#84), [#85](#85)
- **Corretude de dados** (7) — [#86](#86), [#87](#87), [#88](#88), [#89](#89), [#90](#90), [#91](#91), [#92](#92)
- **Estado que só vive no localStorage** (6) — [#93](#93), [#94](#94), [#95](#95), [#96](#96), [#97](#97), [#99](#99)
- **Leitura e escala de dados** (6) — [#98](#98), [#103](#103), [#104](#104), [#105](#105), [#106](#106), [#107](#107)
- **Consultas e nutricionista** (3) — [#100](#100), [#101](#101), [#102](#102)
- **Cardápio e IA** (3) — [#108](#108), [#109](#109), [#110](#110)
- **Conta, sessão e LGPD** (10) — [#111](#111), [#112](#112), [#113](#113), [#114](#114), [#115](#115), [#116](#116), [#117](#117), [#118](#118), [#119](#119), [#120](#120)
- **Formulários públicos** (4) — [#121](#121), [#122](#122), [#123](#123), [#124](#124)
- **Operação e entrega** (8) — [#125](#125), [#126](#126), [#127](#127), [#128](#128), [#129](#129), [#130](#130), [#131](#131), [#132](#132)
- **Produto e monetização** (8) — [#133](#133), [#134](#134), [#135](#135), [#136](#136), [#137](#137), [#138](#138), [#139](#139), [#140](#140)

## Tickets

<a id="75"></a>
### #75 — Exigir autenticação em POST /nutri/menu
**O que construir:** `MenuEndpoints.cs:12` não chama `TryGetUserId` e `Program.cs:142` mapeia sem `RequireAuthorization`. Com `OpenAI:ApiKey` setada, o endpoint chama `OpenAiMenuGenerator` — qualquer um na internet queima crédito da OpenAI. Corrigir: exigir JWT, derivar o perfil do usuário autenticado.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P0 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/75

- [ ] Chamada sem Bearer retorna 401.

<a id="76"></a>
### #76 — Bloquear upgrade pago via PUT /me/plan quando o Stripe estiver configurado
**O que construir:** `PlanChange.Validate` (`Services/PlanChange.cs:33-36`) aceita qualquer cartão com ≥1 dígito que não termine em `0000`, e `PlanEndpoints.cs:59` grava o plano. Bypass de paywall: `{"target":"family", "cardNumber":"1"}` vira Family sem cobrança. Manter o endpoint e as 4 validações (AV2), mas rejeitar `TargetRank > CurrentRank` com 400 "use o checkout" quando `Stripe:SecretKey` existir.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P0 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/76

- [ ] Com Stripe configurado, upgrade por esse endpoint retorna 400; downgrade continua 200.

<a id="77"></a>
### #77 — Falhar o boot em Production se o segredo JWT for o default
**O que construir:** `appsettings.json:16` versiona `dev-only-insecure-jwt-secret-change-me-in-prod-...`. Nada valida no boot que `Jwt__Secret` foi sobrescrito no deploy.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P0 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/77

- [ ] Subir em Production sem `Jwt__Secret` (ou com o default) falha com mensagem clara.

<a id="78"></a>
### #78 — Handler global de exceção com ProblemDetails e request-id
**O que construir:** `Program.cs` não tem `AddProblemDetails`/`UseExceptionHandler`; nenhum try/catch nos Endpoints. Exceção não tratada vira 500 do Kestrel, com risco de vazar stack trace.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P0 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/78

- [ ] Exceção retorna `application/problem+json` sem stack, com `X-Request-Id` correlacionado no Serilog.

<a id="79"></a>
### #79 — Rate-limit por usuário nos endpoints custosos
**O que construir:** `RateLimiting.cs` só limita por IP em `/auth/*`. `/nutri/menu` (IA) e `/billing/*` não têm teto por usuário autenticado — um único usuário pode abusar do custo.

**Bloqueado por:** #75 (Exigir autenticação em POST /nutri/menu)

**Épico:** Segurança e cobrança · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/79

- [ ] Usuário que excede N chamadas/min em `/nutri/menu` recebe 429.

<a id="80"></a>
### #80 — Lockout por conta em brute-force de login
**O que construir:** Rate limit é só por IP (10/min). `POST /auth/login` não conta falhas por conta — ataque distribuído brute-força um e-mail específico sem teto.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/80

- [ ] 6 senhas erradas para o mesmo e-mail (IPs diferentes) bloqueiam a 7ª tentativa por 15 min.

<a id="81"></a>
### #81 — Desligar POST /billing/checkout (mock) quando o Stripe estiver configurado
**O que construir:** `BillingEndpoints.cs:12-31` ativa plano sem gateway real, em paralelo ao fluxo Stripe.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/81

- [ ] Com `Stripe:SecretKey` presente, `/billing/checkout` responde 404/403.

<a id="82"></a>
### #82 — Auditar feature-gating server-side por tier
**O que construir:** Endpoints que dependem do plano (histórico, IA, nº de membros) não têm checagem server-side visível; o tier vem do cliente em vários pontos do front.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/82

- [ ] Cada endpoint restrito valida o tier via `SubscriptionsRepository`; usuário `free` recebe 403.

<a id="83"></a>
### #83 — HTTPS redirection e HSTS em produção
**O que construir:** `Program.cs` não chama `UseHttpsRedirection()` nem `UseHsts()`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/83

- [ ] Em Production, requisição HTTP responde redirect + header HSTS.

<a id="84"></a>
### #84 — Authorization filter explícito no dashboard do Hangfire
**O que construir:** `Program.cs:131-133` protege `/hangfire` só com `IsDevelopment()`, sem `DashboardOptions.Authorization`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/84

- [ ] Dashboard exige auth mesmo se o check de ambiente for removido.

<a id="85"></a>
### #85 — CORS com lista de origens por ambiente
**O que construir:** `Program.cs:117-121` aceita uma única `Cors:Origin` com `AllowAnyHeader().AllowAnyMethod()`. ---

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Segurança e cobrança · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/85

- [ ] Config aceita várias origens separadas por vírgula; origem fora da lista é negada.

<a id="86"></a>
### #86 — Corrigir o timezone do reset diário do tracking
**O que construir:** `TrackingEndpoints.cs:112` cai em `DateOnly.FromDateTime(DateTime.UtcNow)` quando o body não traz `date`, e o front não manda (`src/lib/nutri-tracking.ts:109`). No Brasil (UTC-3), água/hábitos/diário registrados entre 21h e meia-noite caem no dia seguinte.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Corretude de dados · **Prioridade:** P0 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/86

- [ ] Registrar às 22h local aparece no dia local correto; exigir `date` ou timezone no request.

<a id="87"></a>
### #87 — Idempotência do webhook do Stripe
**O que construir:** `StripeEndpoints.cs:75-98` processa qualquer evento validado sem checar reprocessamento. Hoje é inofensivo (UPDATE idempotente), mas quebra assim que B3 adicionar efeitos não-idempotentes.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Corretude de dados · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/87

- [ ] Reenviar o mesmo `event.id` não duplica efeito.

<a id="88"></a>
### #88 — Tratar falha, cancelamento e reembolso no webhook do Stripe
**O que construir:** `StripeEndpoints.cs:75-98` só trata `checkout.session.completed`. Cancelar no Customer Portal não rebaixa o plano no banco.

**Bloqueado por:** #87 (Idempotência do webhook do Stripe)

**Épico:** Corretude de dados · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/88

- [ ] `customer.subscription.deleted` rebaixa para `free`; `invoice.payment_failed` marca pendência.

<a id="89"></a>
### #89 — Expor o status da assinatura em GET /me/subscription
**O que construir:** A coluna `subscriptions.status` existe (`schema.sql:45`) mas `SubscriptionRow` e `PlanEndpoints.cs:24-29` não a devolvem — o front não distingue `active` de `past_due`/`canceled`.

**Bloqueado por:** #88 (Tratar falha, cancelamento e reembolso no webhook do Stripe)

**Épico:** Corretude de dados · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/89

- [ ] `GET /me/subscription` retorna `status` real.

<a id="90"></a>
### #90 — GET /nutri/plan deve considerar dieta, restrições e rotina
**O que construir:** `ProfileEndpoints.cs:104-122` monta o `NutriProfile` só com sexo/idade/altura/peso/atividade/objetivo/ refeições — ignora `Diet`, `Restrictions` e horários salvos. A prévia de `/nutri/perfil` diverge do cardápio real.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Corretude de dados · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/90

- [ ] `GET /nutri/plan` reflete dieta/restrições salvas, igual ao `POST /nutri/plan`.

<a id="91"></a>
### #91 — Downgrade deve reconciliar consultas já agendadas
**O que construir:** `PUT /me/plan` (`PlanEndpoints.cs:59`) só troca `plan_id`; consultas futuras acima do novo saldo ficam órfãs (Family 8 → Free 1 com 5 agendadas).

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Corretude de dados · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/91

- [ ] Downgrade cancela o excedente de forma determinística, ou bloqueia avisando quantas se perdem.

<a id="92"></a>
### #92 — POSTs de tracking devem retornar o valor persistido, não o eco do input
**O que construir:** `TrackingEndpoints.cs:28` devolve `new { ml = body.Ml }` enquanto a escrita aplica `Math.Max(0, ...)`. Mesmo padrão em `/nutri/steps` (linha 67). POST com `ml:-50` responde `-50` e grava `0`. ---

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Corretude de dados · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/92

- [ ] Resposta reflete o valor pós-clamp.

<a id="93"></a>
### #93 — Persistir o cardápio gerado
**O que construir:** `POST /nutri/menu` gera e devolve sem gravar; não há tabela `generated_menus`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Estado que só vive no localStorage · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/93

- [ ] Cardápio do dia sobrevive a reload e troca de dispositivo sem regerar.

<a id="94"></a>
### #94 — Persistir as trocas de alimento do cardápio
**O que construir:** `src/lib/menu-store.ts:7` guarda `swapMenuItem` só em `brl.nutri.menuSwaps`.

**Bloqueado por:** #93 (Persistir o cardápio gerado)

**Épico:** Estado que só vive no localStorage · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/94

- [ ] Trocar item e logar em outro navegador mantém a troca.

<a id="95"></a>
### #95 — Persistir favoritos de artigos e receitas
**O que construir:** `src/lib/favorites-store.ts:10` é localStorage puro; o comentário da linha 6 já prevê `/me/favorites`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Estado que só vive no localStorage · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/95

- [ ] Favoritar num device aparece em outro.

<a id="96"></a>
### #96 — Persistir a lista de compras
**O que construir:** `src/lib/shopping-store.ts:6` guarda os itens marcados só em `brl.nutri.shopping`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Estado que só vive no localStorage · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/96

- [ ] Marcar item comprado sincroniza entre devices.

<a id="97"></a>
### #97 — Persistir streak e conquistas
**O que construir:** `src/lib/nutri-tracking.ts:13` admite "o streak fica só local (sem endpoint)"; `markDayComplete` (linha 240) só escreve localStorage.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Estado que só vive no localStorage · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/97

- [ ] Streak sobrevive a limpar o cache do navegador.

<a id="98"></a>
### #98 — Histórico de hábitos e diário, não só "hoje"
**O que construir:** `GET /nutri/habits` e `/nutri/diary` (`TrackingEndpoints.cs:85,98`) só devolvem uma data.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Leitura e escala de dados · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/98

- [ ] `?from=&to=` devolve série por data em uma chamada.

<a id="99"></a>
### #99 — Derivar o streak no servidor a partir de habit_logs
**O que construir:** `getStreakSnapshot` (`nutri-tracking.ts:219-261`) confia num contador local manipulável. ---

**Bloqueado por:** #97 (Persistir streak e conquistas), #98 (Histórico de hábitos e diário, não só "hoje")

**Épico:** Estado que só vive no localStorage · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/99

- [ ] Streak reportado bate com os dias realmente completos no banco.

<a id="100"></a>
### #100 — Endpoint de disponibilidade do nutricionista
**O que construir:** Não existe GET que devolva horários livres; o front descobre por tentativa-e-erro no `POST /consultations`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Consultas e nutricionista · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/100

- [ ] `GET /nutritionists/{id}/availability?date=` devolve slots livres (agenda menos ocupados).

<a id="101"></a>
### #101 — Mover a agenda do nutricionista para tabela
**O que construir:** `ConsultationsEndpoints.cs:11-17` tem `SlotsByNutri` como dicionário fixo em código — nutricionista não consegue bloquear dia nem variar agenda sem deploy.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Consultas e nutricionista · **Prioridade:** P2 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/101

- [ ] Bloquear um horário no banco reflete no `POST /consultations` sem deploy.

<a id="102"></a>
### #102 — E-mail de confirmação e lembrete de consulta
**O que construir:** `POST /consultations` (`ConsultationsEndpoints.cs:22`) só grava e retorna id, apesar do Resend já estar integrado. ---

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Consultas e nutricionista · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/102

- [ ] Agendar dispara e-mail de confirmação; lembrete N horas antes via job.

<a id="103"></a>
### #103 — Filtro por intervalo de datas nos GETs de tracking
**O que construir:** `TrackingEndpoints.cs:19-108` devolve a série bruta inteira, sem `from`/`to` — cresce sem limite por usuário.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Leitura e escala de dados · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/103

- [ ] `?from=&to=` em weight/sleep/steps/measurements; resposta limitada à janela pedida.

<a id="104"></a>
### #104 — Paginação padronizada nas listas (DT-05)
**O que construir:** Dívida já registrada em `backend/docs/registro_divida_tecnica.md`. `ConsultationsEndpoints.cs:60-64` e os endpoints de tracking retornam tudo sem `LIMIT`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Leitura e escala de dados · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/104

- [ ] Endpoints aceitam `?page=&pageSize=` e têm teto default.

<a id="105"></a>
### #105 — Índices faltantes em FKs e colunas de filtro
**O que construir:** `schema.sql:264-272` cobre tracking/auth. Faltam `subscriptions.user_id`, `consultations.nutritionist_id`, `articles.category`, `recipes.category`, e confirmar UNIQUE em `waitlist.email` (usado em `ON CONFLICT`).

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Leitura e escala de dados · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/105

- [ ] `EXPLAIN ANALYZE` das queries do dashboard não faz seq scan em tabelas >1k linhas.

<a id="106"></a>
### #106 — Filtrar medidas corporais por tipo
**O que construir:** `TrackingRepository.cs:116` devolve uma linha por dia com as 5 colunas juntas; o gráfico por medida precisa filtrar nulls das outras quatro no client.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Leitura e escala de dados · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/106

- [ ] `?key=waist` (ou formato long `date,key,value`) devolve a série de uma medida.

<a id="107"></a>
### #107 — Filtrar artigos por objetivo e dieta no servidor
**O que construir:** `ArticlesEndpoints.cs:11` devolve tudo; a curadoria "pra você" da aba Início é feita no client. ---

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Leitura e escala de dados · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/107

- [ ] `?goal=&diet=` filtra/ordena no SQL.

<a id="108"></a>
### #108 — Geração de cardápio por IA em job assíncrono
**O que construir:** `MenuEndpoints.cs:12` chama `generator.GenerateAsync` inline; com OpenAI ativa é uma chamada de IA síncrona no request, sem timeout nem retry. O Hangfire já existe (`Program.cs:83-89`) mas só serve a fila de e-mail.

**Bloqueado por:** #93 (Persistir o cardápio gerado)

**Épico:** Cardápio e IA · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/108

- [ ] Latência/falha da OpenAI não trava a request além de um timeout configurável; front faz polling.

<a id="109"></a>
### #109 — GET /nutri/menu?date= e regeneração de cardápio
**O que construir:** Só existe o POST que recalcula do zero; não há como reler o cardápio salvo nem regerar preservando o que já foi comido hoje.

**Bloqueado por:** #93 (Persistir o cardápio gerado)

**Épico:** Cardápio e IA · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/109

- [ ] `GET /nutri/menu?date=` lê o salvo; `POST /nutri/menu/regenerate` zera swaps sem apagar `meal_logs`.

<a id="110"></a>
### #110 — Receita do dia determinística por usuário e data
**O que construir:** Não há endpoint nem coluna de seleção diária; a escolha é feita no client a partir de `GET /recipes`. ---

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Cardápio e IA · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/110

- [ ] `GET /nutri/recipe-of-day` devolve a mesma receita o dia todo, muda no dia seguinte, respeita dieta.

<a id="111"></a>
### #111 — Troca de senha com o usuário logado
**O que construir:** Só existe reset por e-mail (`AuthEndpoints.cs:117-119`); não há `PUT /me/password`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/111

- [ ] Valida a senha atual, grava a nova, revoga as outras sessões; senha atual errada → 400.

<a id="112"></a>
### #112 — Gravar o consentimento LGPD no cadastro
**O que construir:** `POST /auth/register` (`AuthEndpoints.cs:40-52`) não grava consentimento nenhum; `POST /me/consent` existe mas o fluxo de registro nunca o chama.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/112

- [ ] Toda conta nova nasce com registro de consentimento da versão vigente dos termos.

<a id="113"></a>
### #113 — Exigir reautenticação (ou soft-delete) em DELETE /me/account
**O que construir:** `LgpdEndpoints.cs:25-32` apaga em cascata na hora, com confirmação só client-side.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/113

- [ ] Exclusão exige senha no body, ou marca `deleted_at` com purga adiada e janela de recuperação.

<a id="114"></a>
### #114 — Bloquear ações sensíveis sem e-mail verificado
**O que construir:** A coluna `email_verified` existe (`schema.sql:9`) mas nenhum endpoint de negócio a consulta.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/114

- [ ] A ação escolhida retorna 403 com mensagem clara quando `email_verified = false`.

<a id="115"></a>
### #115 — Endpoint de logout de todos os dispositivos
**O que construir:** `RevokeAllForUserAsync` já existe mas só é usado no reset de senha; o usuário não tem como disparar.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/115

- [ ] `POST /auth/logout-all` autenticado revoga todos os refresh tokens.

<a id="116"></a>
### #116 — Auditoria de sessões (IP, device) e revogação individual
**O que construir:** `refresh_tokens` guarda só hash e expiração, sem IP/user-agent; não há como listar ou matar uma sessão.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P2 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/116

- [ ] `GET /me/sessions` lista com IP/data; `DELETE /me/sessions/{id}` derruba só aquela.

<a id="117"></a>
### #117 — Troca de e-mail com confirmação no novo endereço
**O que construir:** `UsersRepository` não tem `UpdateEmailAsync`; o front mostra e-mail como dado estático.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/117

- [ ] E-mail só muda após confirmar token no endereço novo (reusar `EmailTokensRepository`, purpose `change_email`).

<a id="118"></a>
### #118 — Resolver a enumeração de e-mail no cadastro
**O que construir:** `AuthEndpoints.cs:44-45` responde "E-mail já cadastrado." — inconsistente com a postura anti-enumeração de `/auth/forgot` (linha 105).

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/118

- [ ] Decisão registrada em ADR; se mitigado, resposta genérica + e-mail de "tentativa de cadastro duplicado".

<a id="119"></a>
### #119 — GET /me para revalidar os dados do usuário
**O que construir:** O front guarda nome/e-mail só no localStorage a partir do payload de login (`auth-store.ts:23-26`); nada revalida durante a sessão.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/119

- [ ] `GET /me` devolve os dados atuais; front chama no boot da sessão.

<a id="120"></a>
### #120 — Segregar a política de rate-limit de /auth/refresh
**O que construir:** `/auth/refresh` divide o teto de 10/min com login/register/forgot pelo mesmo IP — usuários atrás de NAT corporativo se bloqueiam mutuamente. ---

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Conta, sessão e LGPD · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/120

- [ ] Refresh sob carga normal não esgota o budget que protege o login.

<a id="121"></a>
### #121 — Validar formato e tamanho dos campos de /contact e /waitlist
**O que construir:** `EngagementEndpoints.cs:15-27` só checa `IsNullOrWhiteSpace` — `"asd"` é aceito como e-mail, e `Message` não tem teto (mensagens de megabytes vão pro banco).

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Formulários públicos · **Prioridade:** P1 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/121

- [ ] E-mail malformado → 400; name ≤120, subject ≤200, message ≤5000 com erro específico.

<a id="122"></a>
### #122 — Anti-spam em /contact e /waitlist
**O que construir:** Não há honeypot nem captcha em nenhuma das telas, e o rate-limit é global por IP. 200 silencioso sem gravar.

**Bloqueado por:** #121 (Validar formato e tamanho dos campos de /contact e /waitlist)

**Épico:** Formulários públicos · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/122

- [ ] Policy dedicada mais restritiva devolve 429 antes do teto global; honeypot preenchido responde

<a id="123"></a>
### #123 — Limitar o payload de /analytics/events
**O que construir:** `EngagementEndpoints.cs:35-40` aceita `Event` livre e `Props` sem teto, sem auth.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Formulários públicos · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/123

- [ ] `Props` >4KB → 400; `Event` >100 chars rejeitado ou truncado.

<a id="124"></a>
### #124 — Endpoints admin para ler contact_messages e waitlist
**O que construir:** `EngagementRepository.cs:8-30` só faz INSERT — hoje as mensagens só são lidas por SQL direto. ---

**Bloqueado por:** #104 (Paginação padronizada nas listas (DT-05))

**Épico:** Formulários públicos · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/124

- [ ] `GET /admin/contact-messages` e `/admin/waitlist` autenticados por role admin, paginados.

<a id="125"></a>
### #125 — Rodar build e testes do backend no CI
**O que construir:** `.github/workflows/ci.yml` só valida o frontend (`npm ci/lint/test/build`).

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Operação e entrega · **Prioridade:** P0 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/125

- [ ] PR que quebra o backend falha o CI (`dotnet build` + `dotnet test` sobre `BrlHealth.slnx`).

<a id="126"></a>
### #126 — Dockerfile e docker-compose para API + Postgres
**O que construir:** Não existe nenhum Dockerfile/compose no repo; o README manda aplicar `schema.sql` via psql e rodar `dotnet run` à mão.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Operação e entrega · **Prioridade:** P0 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/126

- [ ] `docker compose up` sobe a API respondendo em `/health/ready`.

<a id="127"></a>
### #127 — Migrations versionadas
**O que construir:** Só existe `Data/schema.sql` aplicado manualmente, com `ALTER TABLE ... IF NOT EXISTS` embutidos (`schema.sql:50,63-65`) — sem histórico, sem rollback, sem aplicação automática. Relacionado a DT-04.

**Bloqueado por:** #126 (Dockerfile e docker-compose para API + Postgres)

**Épico:** Operação e entrega · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/127

- [ ] Subir a API contra um banco vazio aplica todas as migrações sem intervenção manual.

<a id="128"></a>
### #128 — Testes de integração de endpoint com Postgres real
**O que construir:** Os 8 arquivos de teste são unitários; o `.csproj` não referencia `Mvc.Testing` nem `Testcontainers` — nenhum teste sobe a API e bate num endpoint HTTP. (usuário A não lê dado de B).

**Bloqueado por:** #125 (Rodar build e testes do backend no CI), #126 (Dockerfile e docker-compose para API + Postgres)

**Épico:** Operação e entrega · **Prioridade:** P1 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/128

- [ ] Suíte de integração no CI cobre `/consultations`, `/nutri/menu`, `/me/plan` e um caso de IDOR

<a id="129"></a>
### #129 — Backup do Postgres e runbook de restore
**O que construir:** Nada em `backend/docs/operacao.md` nem no README define estratégia de backup/restore de produção.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Operação e entrega · **Prioridade:** P1 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/129

- [ ] Runbook de restore testado, com RPO/RTO definidos.

<a id="130"></a>
### #130 — Documentação OpenAPI
**O que construir:** `Program.cs` não tem `AddOpenApi`/`Swagger` — 18 arquivos de endpoint sem doc navegável.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Operação e entrega · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/130

- [ ] `/openapi/v1.json` lista todos os endpoints mapeados.

<a id="131"></a>
### #131 — Compressão de resposta
**O que construir:** Nenhuma referência a `AddResponseCompression` em `Program.cs`.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Operação e entrega · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/131

- [ ] `/foods` volta comprimido quando o cliente manda `Accept-Encoding`.

<a id="132"></a>
### #132 — Atualizar o registro de dívida técnica
**O que construir:** DT-04 (seed hardcoded) e DT-05 (paginação) seguem sem seção de quitação, diferente de DT-02/DT-03. ---

**Bloqueado por:** #127 (Migrations versionadas), #104 (Paginação padronizada nas listas (DT-05))

**Épico:** Operação e entrega · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/132

- [ ] Doc atualizado quando I3 e E3 forem entregues.

<a id="133"></a>
### #133 — Suporte a membros e convites no plano Família
**O que construir:** `schema.sql:41-47` é 1:1 `user_id`→`plan_id`. "Até 4 usuários" e "dashboard familiar" são anunciados na página de planos sem nenhum suporte de dados.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Produto e monetização · **Prioridade:** P1 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/133

- [ ] Titular convida e-mail, convidado aceita e ganha o tier Family sem pagar de novo.

<a id="134"></a>
### #134 — Histórico de faturas e recibos
**O que construir:** Não há tabela de pagamentos; o único acesso é o Customer Portal do Stripe, sem registro próprio para suporte e auditoria.

**Bloqueado por:** #88 (Tratar falha, cancelamento e reembolso no webhook do Stripe)

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** M · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/134

- [ ] Pagamento via webhook grava linha com valor, data e plano; `GET /me/invoices` lista.

<a id="135"></a>
### #135 — Auditoria de mudanças de plano
**O que construir:** `UpdatePlanAsync`/`ActivatePlanAsync` (`SubscriptionsRepository.cs:37-70`) sobrescrevem `plan_id` sem histórico — não dá para responder "quando o usuário fez downgrade".

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/135

- [ ] 3 trocas seguidas geram 3 linhas em `plan_change_log` com origem e timestamp.

<a id="136"></a>
### #136 — Reconciliação Stripe ↔ banco
**O que construir:** Se o webhook falhar, `plan_id` e `has_pending_charge` divergem silenciosamente do Stripe.

**Bloqueado por:** #87 (Idempotência do webhook do Stripe)

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/136

- [ ] Job periódico compara assinaturas ativas no Stripe com o banco e corrige divergências.

<a id="137"></a>
### #137 — Cupom de desconto no checkout
**O que construir:** `StripeCheckoutRequest` (`StripeEndpoints.cs:12`) só recebe `PlanId`; `CreateCheckoutAsync` não aceita código promocional.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** S · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/137

- [ ] Checkout com cupom válido aplica o desconto na sessão Stripe.

<a id="138"></a>
### #138 — Decidir sobre CMS/admin de artigos e receitas
**O que construir:** `ArticlesEndpoints.cs` e `RecipesEndpoints.cs` só têm GET; conteúdo entra por `seed.sql` manual. manter seed manual justificado pelo volume.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/138

- [ ] Decisão registrada em ADR — ou endpoints de escrita com role admin e rascunho/publicado, ou

<a id="139"></a>
### #139 — Login social (OAuth Google/Apple)
**O que construir:** `src/components/forms/login-form.tsx:138-144` já renderiza os botões, que só disparam um toast "em breve". O backend não tem client OAuth nem coluna de provider.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/139

- [ ] Login por Google cria/vincula conta e devolve o mesmo par token/refreshToken.

<a id="140"></a>
### #140 — Segundo fator de autenticação
**O que construir:** Nenhuma tabela, coluna ou endpoint de MFA.

**Bloqueado por:** Nenhum — pode começar já

**Épico:** Produto e monetização · **Prioridade:** P2 · **Tamanho:** L · **Issue:** https://github.com/kaualandi/brl-health-landing/issues/140

- [ ] Usuário habilita TOTP; login passa a exigir o código.
