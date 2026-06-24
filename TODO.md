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

---

## 💡 Brainstorm — inspirado no Smart Fit Nutri (screenshots)

> Ideias destiladas de 5 telas do Smart Fit Nutri (cardápio com IA). ⭐ = maior impacto.
> Tipo: 🎨 frontend · 🔌 integração · 🗄️ backend.

### A. Cardápio em nível de alimento ⭐ (o maior salto)
Hoje o BRL Nutri mostra só "Café da manhã — 600 kcal". O Smart Fit monta a refeição com **alimentos de verdade** (uva passa, leite UHT, omelete com muçarela...).
- [ ] 🎨 Gerar **alimentos por refeição** a partir de dieta + kcal/macros do slot (não só o nome da refeição).
- [ ] 🎨 **Trocar/substituir** cada alimento (lápis por item) por uma opção equivalente em kcal/macros.
- [ ] 🎨 **Banco de alimentos** seed (por grupo) com porção + kcal/macros, pra montar e substituir.
- [ ] 🎨 Sheet/tela de **detalhe da refeição** (alimentos, porções, total do prato).
- [ ] 🗄️ Backend: cardápio gerado por **IA de verdade** (LLM) a partir do perfil + banco de alimentos (TACO/USDA).

### B. Metas e prazo ⭐
- [x] 🎨 **Meta de peso** no perfil (onboarding + editor) — peso atual → peso alvo.
- [x] 🎨 Card de peso mostra **progresso até a meta** (faltam X kg, % do caminho) + **linha da meta** no gráfico.
- [x] 🎨 Estimativa de **tempo pra meta** pelo déficit/superávit do plano (`estimateWeeksToGoal`).
- [ ] 🎨 **Tempo pro objetivo** como entrada do usuário ("sem pressa" / data alvo) — ajustaria o déficit sugerido.

### C. Refeições: tipos, horários e timing inteligente
- [ ] 🎨 **Selecionar quais** refeições você faz (não só a quantidade): Café, Almoço, Jantar, **Ceia, Pré-treino, Pós-treino, Lanche da madrugada**.
- [ ] 🎨 **Horário por refeição** (time picker). Hoje o plano divide por ratio, sem horário.
- [ ] 🎨 **Hora de acordar / dormir / treinar** no perfil → distribui refeições de forma inteligente (pré/pós-treino perto do treino; ceia antes de dormir).
- [ ] 🎨 **Timeline do dia** (refeições por horário) no /nutri.

### D. Fluxo guiado / conversacional + estado de geração
- [ ] 🎨 Variante **conversacional** do onboarding (estilo chat, uma pergunta por vez) — ou enriquecer o wizard com esse tom.
- [ ] 🎨 **Revisão de dados** antes de gerar ("Hora de personalizar seu cardápio"): resumo editável por campo + "Meus dados estão certos / Editar".
- [ ] ✨ **Estado de "gerando cardápio"** com avatar/bot + animação ("Estamos combinando suas escolhas..."). Casa com o item de animação de "gerando plano" já no TODO.
- [ ] 🎨 Opções com **descrição de percepção de esforço** (ex.: "Moderada — coração acelerado, fala com um pouco de esforço"). Já temos descrições; dá pra enriquecer.

### E. Caminho humano: nutricionista 🔌
- [ ] 🎨 Card "Acompanhamento com um nutri" no /nutri — dois caminhos (IA + profissional), como o Smart Fit.
- [ ] 🎨 **Agendar consulta** (UI de agenda/horários) + estado de **saldo de consultas**.
- [ ] 🔌 Agendamento real (Calendly-like) / chat com profissional — backend depois.

### F. Estrutura do app: seções e navegação
- [ ] 🎨 **Navegação por abas** no app logado (Início · Meu Corpo · Nutrição · Saúde). Hoje /nutri é um scroll só.
- [ ] 🎨 **"Meu Corpo"** — medidas (cintura etc.), fotos de progresso, evolução além do peso.
- [ ] 🎨 **"Saúde"** — painel consolidado (sono, passos, hidratação) num lugar só.

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
- [ ] ✨ **Skeletons** consistentes onde há fetch (já existe no Pricing — padronizar num componente reutilizável).
- [ ] 🎨 **Redirecionar logado** pra fora de `/login` e `/cadastro` (hoje só protege o caminho inverso).
- [ ] ✨ **Scroll suave + scroll-spy** na navbar (destacar seção ativa em `/#...`).
- [ ] ✨ **Botão "voltar ao topo"** nas páginas longas.
- [ ] ♿ **Auditoria de acessibilidade** — foco visível, `aria-current` na nav, labels, contraste, navegação por teclado no wizard, `prefers-reduced-motion` (já parcialmente feito).
- [ ] ♿ **Skip-to-content link** no layout.

---

## 2. Novas telas 🎨 (frontend)

### Conteúdo / Blog (dados já existem em `nutri-content.ts`)
- [x] **`/conteudos`** — listagem com busca e filtro por categoria (`ContentExplorer`).
- [x] **`/conteudos/[slug]`** — página de artigo (corpo em seções, tempo de leitura, autor, relacionados, CTA pro Nutri). Estática via `generateStaticParams`.
- [ ] **Receitas** — `/receitas` e `/receitas/[slug]` (expandir o seed de receitas por dieta).

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
- [ ] **`/faq`** — perguntas frequentes (accordion).
- [ ] **`/termos`** e **`/privacidade`** — páginas legais (essencial pra produção).

---

## 3. Funcionalidades 🎨 (frontend, com mock)

- [ ] **Calculadora pública de TDEE/IMC** (`/calculadora`) — lead magnet usando `nutri-plan.ts` sem precisar criar conta; CTA pra salvar criando conta.
- [ ] **Busca + filtros** nos conteúdos (categoria, objetivo, tempo de leitura).
- [ ] **Favoritar** artigos/receitas (localStorage) + aba "Salvos" no `/nutri`.
- [ ] **Comparador de planos** interativo (toggle mensal/anual com desconto).
- [~] **Gamificação** — confete ao completar os hábitos do dia ✅; faltam badges/conquistas e streaks.
- [ ] **Compartilhar plano** — gerar card/imagem ou link de resumo.
- [ ] **Tema claro/escuro** — toggle (hoje é dark-only; tokens já existem em `:root`/`.dark`).
- [~] **Onboarding melhorado** — logado pula o passo de conta ✅; faltam salvar rascunho, revisar/editar a partir do review e animação de "gerando plano".
- [ ] **Estados vazios** ilustrados e consistentes em todas as listas.
- [ ] **PWA** — manifest + ícones + offline básico (instalável no celular).
- [ ] **(opcional) i18n** pt-BR / en — estrutura de mensagens.

---

## 4. Integrações 🔌 (frontend agora, backend no fim)

> Construir a **UI e o service mock** agora, mantendo o `// TODO: substituir por api...`. A troca pro backend está na seção final.

### E-mail
- [x] **Formulário de contato** com estado de sucesso (SuccessCard) e toast de erro.
- [x] **Lista de espera do BRL Fit** (`WaitlistForm` + `waitlist.service` mock).
- [ ] **Newsletter** (rodapé / fim de artigo) — reusar o `WaitlistForm` com `source="newsletter"`.
- [ ] Telas/estados que dependem de e-mail: **verificar e-mail**, **recuperar senha** (`/recuperar-senha`, `/redefinir-senha`).

### Pagamento
- [x] **Fluxo de checkout** (`/checkout?plano=pro`) — resumo + form de cartão (mock `billing.service`), seta o tier no sucesso.
- [x] **Sucesso/erro** — tela de sucesso inline + toast de erro (cartão `...0000` recusa).
- [x] CTAs dos planos abrem `/precos` → checkout (em vez de `/cadastro`).
- [x] Estado de **assinatura** no `/conta` (mostra o tier atual). _Falta próxima cobrança/fatura._
- [ ] **Cancelar/trocar** assinatura pelo `/conta` (hoje só faz upgrade pelo checkout).

### Autenticação
- [ ] Provider/store de auth (ver Fase 1) — já no formato pronto pra trocar mock por API real.
- [ ] **Recuperação de senha** (UI completa, service mock).
- [ ] **Login social** (botões Google/Apple — só UI por enquanto).

---

## 5. Qualidade & Produção 🚀

- [ ] **SEO** — `metadata` por rota, Open Graph/Twitter cards, imagem OG, `sitemap.ts`, `robots.ts`, favicon set, `manifest`.
- [ ] **Performance** — Lighthouse/Core Web Vitals, lazy-load de animações pesadas, `next/image` onde couber.
- [ ] **Analytics** (mock/placeholder de eventos — page views, cliques de CTA, conclusão de onboarding).
- [ ] **Tratamento de erro** consistente (boundaries + mensagens amigáveis em PT-BR).
- [ ] **Variáveis de ambiente** documentadas (`.env.example`) — `NEXT_PUBLIC_API_URL` etc.
- [ ] **Testes** — unit em `nutri-plan.ts` (cálculos) e e2e de smoke nos fluxos críticos (onboarding → nutri, login).
- [ ] **CI** — lint + typecheck + build no pipeline.
- [ ] **README** real do projeto (substituir o boilerplate do create-next-app).
- [ ] **Deploy** — configurar Vercel/host, preview por PR.

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
