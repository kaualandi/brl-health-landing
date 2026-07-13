# BRL Health

**Ecossistema de saúde que une treino e nutrição que se conversam.** Dois
produtos sob a mesma marca:

- **🥗 BRL Nutri — ativo.** App de nutrição personalizada: monta o cardápio em
  nível de alimento, calcula calorias e macros, e acompanha a evolução (peso,
  água, medidas, sono, passos, hábitos).
- **💪 BRL Fit — em breve.** App de treino adaptativo, hoje uma página de "em
  breve" com lista de espera.

> **Status:** frontend completo e **integrado à API real** (backend .NET em
> [`/backend`](./backend)). Todo dado com endpoint vem do servidor — auth (JWT +
> refresh), perfil/onboarding, assinatura, consultas, tracking, LGPD e catálogos.
> O `localStorage` funciona só como **cache** (write-through pra API). Conteúdo de
> UI sem tabela (FAQ, textos legais, copy de marketing) segue estático de
> propósito. Veja o histórico da integração em
> [`TODO-FRONTEND-INTEGRATION.md`](./TODO-FRONTEND-INTEGRATION.md), o roadmap em
> [`TODO.md`](./TODO.md) e a documentação de produto em [`CLAUDE.md`](./CLAUDE.md).
>
> Dá pra rodar o front **sozinho** (as telas montam e degradam com elegância se a
> API estiver fora), mas os fluxos logados exigem o backend no ar — veja
> [Rodando a stack completa](#rodando-a-stack-completa-com-backend).

---

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **[React 19](https://react.dev)**
- **[Tailwind CSS 4](https://tailwindcss.com)** + **[base-ui](https://base-ui.com)** + **[shadcn](https://ui.shadcn.com)** (componentes)
- **[TanStack Query](https://tanstack.com/query) / [Form](https://tanstack.com/form)** + **[Zod](https://zod.dev)** (dados e validação)
- **[anime.js](https://animejs.com)** (animações), **[lucide-react](https://lucide.dev)** (ícones), **[axios](https://axios-http.com)** (HTTP)
- **[Vitest](https://vitest.dev)** (testes unitários)

> ⚠️ Esta versão do Next.js tem _breaking changes_ em relação a releases
> anteriores. Consulte os guias em `node_modules/next/dist/docs/` antes de mexer
> no código (veja [`AGENTS.md`](./AGENTS.md)).

---

## Pré-requisitos

- **Node.js 20+** (recomendado **22 LTS** — versão usada na CI)
- **npm** (o repositório versiona `package-lock.json`)

---

## Começando

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente (opcional em dev — há defaults)
cp .env.example .env.local

# 3. Subir o ambiente de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Para validar uma build de produção localmente:

```bash
npm run build   # compila a aplicação
npm run start   # serve a build em http://localhost:3000
```

### Login demo

Conta semeada pelo backend (`seed.sql`). Para entrar em `/login` e acessar o
`/nutri`:

- **E-mail:** `demo@brl.com`
- **Senha:** `123456`

---

## Rodando a stack completa (com backend)

Os fluxos logados (login, perfil, tracking, consultas, assinatura) chamam a API
.NET em [`/backend`](./backend). Para exercê-los localmente, suba **Postgres +
backend + front** — três terminais (ou o backend em background).

O front espera a API em `http://localhost:5226` (default do `NEXT_PUBLIC_API_URL`)
e o backend libera **CORS** para `http://localhost:3000` (origem do `next dev`).

```bash
# 1) Postgres descartável em Docker (senha só para dev)
docker run -d --name brl-pg \
  -e POSTGRES_PASSWORD=devsecret -e POSTGRES_DB=brlhealth \
  -p 5432:5432 postgres:16-alpine

# 2) Schema + seed (cria a conta demo, 3 planos e 4 nutricionistas)
docker exec -i brl-pg psql -U postgres -d brlhealth \
  < backend/src/BrlHealth.Api/Data/schema.sql
docker exec -i brl-pg psql -U postgres -d brlhealth \
  < backend/src/BrlHealth.Api/Data/seed.sql

# 3) Backend (.NET 10) em http://localhost:5226
cd backend/src/BrlHealth.Api
ConnectionStrings__Default="Host=localhost;Port=5432;Database=brlhealth;Username=postgres;Password=devsecret" \
ASPNETCORE_URLS="http://localhost:5226" \
ASPNETCORE_ENVIRONMENT=Development \
dotnet run

# 4) Front (noutro terminal, na raiz do repo)
npm run dev
```

`.env.local` já aponta `NEXT_PUBLIC_API_URL=http://localhost:5226`. Detalhes de
configuração do backend (JWT, Resend, OpenAI, Stripe) estão no
[`backend/README.md`](./backend/README.md).

> **Sem backend?** O front sobe e as páginas públicas funcionam; chamadas à API
> falham silenciosamente (caem no cache/estado local). Só não dá pra logar de
> verdade nem persistir dados no servidor.

---

## Scripts

| Script               | O que faz                                              |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Sobe o servidor de desenvolvimento (Next dev).         |
| `npm run build`      | Gera a build de produção.                              |
| `npm run start`      | Serve a build de produção.                             |
| `npm run lint`       | Roda o ESLint (`eslint-config-next`).                  |
| `npm run test`       | Roda os testes unitários uma vez (Vitest).             |
| `npm run test:watch` | Roda os testes em modo _watch_.                        |

---

## Variáveis de ambiente

Documentadas em [`.env.example`](./.env.example). Ambas têm _defaults_ seguros
para desenvolvimento, então não são obrigatórias localmente.

| Variável               | Default                    | Para quê                                             |
| ---------------------- | -------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://brlhealth.com.br` | URL canônica do site (SEO: metadata, sitemap, OG).  |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:5226`    | Base URL da API .NET consumida pelo front.          |

> Por serem `NEXT_PUBLIC_*`, são **embutidas no bundle do cliente** — não coloque
> segredos nelas. Chaves sensíveis (Stripe secret/webhook, Resend, OpenAI, banco,
> JWT) vivem **só no backend**, via ambiente — ver [`backend/README.md`](./backend/README.md).
> O front só conhece a **chave pública** do Stripe, e ainda por cima buscada da
> API (`GET /billing/stripe/config`), nunca hardcoded.

---

## Pagamentos (Stripe)

O checkout tem **dois modos**, decididos em tempo de execução pela resposta de
`GET /billing/stripe/config` — o front nunca precisa saber a chave, só se o
backend está configurado:

| Backend | O que o `/checkout` mostra | Como o plano é ativado |
| --- | --- | --- |
| **Sem `Stripe:SecretKey`** (default) | Formulário de cartão **mock** ("checkout de demonstração") | `POST /billing/checkout` — o backend valida e ativa na hora (cartão terminando em `0000` → recusado). Bom para dev/demo sem conta Stripe. |
| **Com `Stripe:SecretKey`** | Botão **"Pagamento seguro pelo Stripe"** (redireciona pro checkout hospedado) | O usuário paga na página do Stripe; o **webhook** `checkout.session.completed` é a fonte da verdade e ativa o plano. |

> **Sem chave = sem Stripe, e está tudo certo.** É degradação graciosa
> intencional (o backend responde `501` nas rotas `/billing/stripe/*` e o front
> cai no formulário mock). Você só liga o Stripe real quando **quiser** e tiver
> chaves — nada quebra por não ter.

Ao voltar do Stripe, o usuário cai em `/conta?checkout=success` (pago) ou
`/precos?checkout=cancel` (desistiu); o front mostra um toast e limpa o parâmetro
da URL. As URLs de retorno são configuráveis no backend (`Stripe:SuccessUrl`,
`Stripe:CancelUrl`, `Stripe:PortalReturnUrl`).

### Testando o Stripe real localmente

Use **chaves de teste** (`sk_test_`/`pk_test_`) e a [Stripe CLI](https://stripe.com/docs/stripe-cli)
para entregar o webhook na sua máquina (o Stripe não alcança `localhost` sozinho):

```bash
# 1) encaminha os eventos do Stripe pro backend local; imprime o whsec_...
stripe listen --forward-to localhost:5226/billing/stripe/webhook

# 2) suba o backend com as chaves de teste (as três via ambiente)
cd backend/src/BrlHealth.Api
Stripe__SecretKey="sk_test_..." \
Stripe__PublishableKey="pk_test_..." \
Stripe__WebhookSecret="whsec_..." \
ConnectionStrings__Default="Host=localhost;Port=5432;Database=brlhealth;Username=postgres;Password=devsecret" \
ASPNETCORE_URLS="http://localhost:5226" ASPNETCORE_ENVIRONMENT=Development \
dotnet run
```

No `/checkout` o front passa a mostrar o fluxo Stripe. Pague com um cartão de
teste (ex.: `4242 4242 4242 4242`, validade futura, CVV qualquer) → o webhook
ativa o plano → você volta pra `/conta` com o tier atualizado. O **Customer
Portal** (gerir/cancelar) precisa estar ativado no Dashboard do Stripe
(Settings → Billing → Customer portal).

> Detalhes de cada rota (`config`/`checkout`/`portal`/`webhook`) estão no
> [`backend/README.md`](./backend/README.md#pagamento-stripe-opcional).

---

## Estrutura do projeto

```
src/
├── app/                  # App Router (rotas)
│   ├── (marketing)/      # site público: home, sobre, conteúdos, calculadora,
│   │                     #   faq, precos, fit, contato, termos, privacidade, conta
│   ├── (auth)/           # login e cadastro/onboarding
│   ├── nutri/            # app BRL Nutri (logado): abas + perfil + compras
│   ├── checkout/         # contratação de plano
│   ├── layout.tsx        # layout raiz, SEO global, providers
│   ├── manifest.ts · robots.ts · sitemap.ts · opengraph-image.tsx
│   ├── error.tsx · not-found.tsx
│   └── globals.css
├── components/           # UI por domínio (ui, sections, nutri, onboarding,
│                         #   calculator, checkout, account, content, faq, …)
├── lib/                  # lógica pura e stores client-side
│   ├── nutri-plan.ts     # motor de cálculo (BMR/TDEE/macros/IMC/água) — testado
│   ├── site.ts · axios.ts · foods.ts · meals.ts · …
├── services/             # camada de acesso à API (axios) + hidratação de cache
├── hooks/                # hooks de UI e de dados (TanStack Query)
├── providers/            # providers globais (Query, toasts, …)
└── types/                # tipos compartilhados
```

---

## Testes

Os testes unitários cobrem o motor de cálculo nutricional
([`src/lib/nutri-plan.ts`](./src/lib/nutri-plan.ts)) com **Vitest** em ambiente
`node` (funções puras).

```bash
npm run test         # roda uma vez (usado na CI)
npm run test:watch   # modo watch durante o desenvolvimento
```

---

## CI

O workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) roda em todo
`push` e `pull_request` para `main`, no Node 22:

1. `npm ci`
2. `npm run lint`
3. `npx tsc --noEmit`
4. `npm run test`
5. `npm run build`

---

## Deploy

Duas formas suportadas: **Vercel** (só o front, backend hospedado à parte) ou
uma **VPS** rodando a stack inteira (front + backend + Postgres).

### Opção A — Vercel (front)

A Vercel detecta o framework Next.js automaticamente — não há build customizado.

1. Importe o repositório na Vercel (framework **Next.js** é auto-detectado).
2. Configure as variáveis de ambiente do projeto:
   - `NEXT_PUBLIC_SITE_URL` → domínio de produção (ex.: `https://brlhealth.com.br`).
   - `NEXT_PUBLIC_API_URL` → **URL pública** da API (a VPS/servidor do backend).
3. Cada Pull Request ganha um **preview deploy** automático; o merge em `main`
   publica em produção.

O [`vercel.json`](./vercel.json) apenas fixa o framework; o resto é convenção.

### Opção B — VPS (stack completa)

Servidor único (Ubuntu, por exemplo) com **Postgres**, o **backend .NET** e o
**front Next** atrás de um reverse proxy (nginx) com TLS. Sugestão de topologia:
`app.seudominio.com` → front (`:3000`) e `api.seudominio.com` → backend (`:5226`).

**Pré-requisitos na VPS:** Node 22+, .NET SDK 10, PostgreSQL, nginx e (para o
webhook do Stripe) um domínio com HTTPS.

**1) Banco.** Postgres gerenciado ou na própria VPS; rode `schema.sql` + `seed.sql`
(ver [`backend/README.md`](./backend/README.md)) e crie um usuário dedicado.

**2) Backend.** Publique e rode como serviço (`systemd`), com **tudo sensível via
ambiente** — nunca no repo:

```bash
cd backend/src/BrlHealth.Api
dotnet publish -c Release -o /var/www/brl-api
```

```ini
# /etc/systemd/system/brl-api.service
[Service]
WorkingDirectory=/var/www/brl-api
ExecStart=/usr/bin/dotnet /var/www/brl-api/BrlHealth.Api.dll
Environment=ASPNETCORE_URLS=http://127.0.0.1:5226
Environment=ConnectionStrings__Default=Host=localhost;Port=5432;Database=brlhealth;Username=brl;Password=<forte>
Environment=Jwt__Secret=<segredo-forte-32+-bytes>
Environment=Cors__Origin=https://app.seudominio.com
# opcionais (só se for usar): Stripe__*, Resend__ApiKey, OpenAI__ApiKey
Restart=always
[Install]
WantedBy=multi-user.target
```

`sudo systemctl enable --now brl-api`. **`Cors__Origin` deve ser a URL pública do
front**, senão o navegador bloqueia as chamadas.

**3) Front.** ⚠️ `NEXT_PUBLIC_API_URL` é **embutido em tempo de build** — defina-o
**antes** do `npm run build`, apontando pra URL pública da API:

```bash
npm ci
NEXT_PUBLIC_API_URL=https://api.seudominio.com \
NEXT_PUBLIC_SITE_URL=https://app.seudominio.com \
npm run build
npm run start   # serve em 127.0.0.1:3000 (rode via systemd/PM2, igual ao backend)
```

**4) Reverse proxy + TLS.** nginx encaminhando cada subdomínio pro processo local
(`proxy_pass http://127.0.0.1:3000` e `:5226`), com certificado (Let's Encrypt).

**5) Stripe em produção (se for usar).** Exponha o webhook publicamente e
registre-o no Dashboard do Stripe apontando para
`https://api.seudominio.com/billing/stripe/webhook`; use o `whsec_` desse endpoint
em `Stripe__WebhookSecret`. Ajuste `Stripe__SuccessUrl`/`CancelUrl`/`PortalReturnUrl`
para os domínios de produção. **Sem chaves, o backend cai no checkout mock** e o
front se adapta sozinho — ver [Pagamentos (Stripe)](#pagamentos-stripe).

> Só faça deploy de código **revisado e mergeado** no `main`. Rebuild do front é
> obrigatório sempre que uma variável `NEXT_PUBLIC_*` muda (ela é congelada no
> bundle).

---

## Roadmap

Próximos passos estão em [`TODO.md`](./TODO.md); o histórico da integração
front↔backend (o que foi ligado à API e o que ficou estático de propósito) está
em [`TODO-FRONTEND-INTEGRATION.md`](./TODO-FRONTEND-INTEGRATION.md).

## Integrantes
- Lucas Abrahão Anes - 06009881
- Kauã Landi Fernando - 06009262
- Natan de Souza Sampaio - 06010668
- Guilherme da Cunha Sequeira - 06002529
- Murilo de Melo Mouteira - 06010561
- Lucas Gomes Coco da Silva - 06011471
