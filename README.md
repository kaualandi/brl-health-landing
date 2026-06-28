# BRL Health

**Ecossistema de saúde que une treino e nutrição que se conversam.** Dois
produtos sob a mesma marca:

- **🥗 BRL Nutri — ativo.** App de nutrição personalizada: monta o cardápio em
  nível de alimento, calcula calorias e macros, e acompanha a evolução (peso,
  água, medidas, sono, passos, hábitos).
- **💪 BRL Fit — em breve.** App de treino adaptativo, hoje uma página de "em
  breve" com lista de espera.

> **Status:** frontend completo e navegável, com dados/serviços _mock_
> (persistência em `localStorage`/`sessionStorage`). O backend é a próxima fase
> — cada serviço mock já marca o endpoint previsto. Tudo roda hoje ponta a ponta
> no navegador. Veja o roadmap em [`TODO.md`](./TODO.md) e a documentação de
> produto em [`CLAUDE.md`](./CLAUDE.md).

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

O app usa autenticação mock. Para entrar em `/login` e acessar o `/nutri`:

- **E-mail:** `demo@brl.com`
- **Senha:** `123456`

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

| Variável               | Default                 | Para quê                                            |
| ---------------------- | ----------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://brlhealth.com.br` | URL canônica do site (SEO: metadata, sitemap, OG). |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3333` | Base URL da API (fase de backend).                  |

> Por serem `NEXT_PUBLIC_*`, são embutidas no bundle do cliente — não coloque
> segredos nelas.

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
├── services/             # serviços mock (localStorage) com `// TODO` de backend
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

## Deploy (Vercel)

A aplicação é feita para a **[Vercel](https://vercel.com)**, que detecta o
framework Next.js automaticamente — não há build customizado.

1. Importe o repositório na Vercel (framework **Next.js** é auto-detectado).
2. Configure as variáveis de ambiente do projeto:
   - `NEXT_PUBLIC_SITE_URL` → domínio de produção.
   - `NEXT_PUBLIC_API_URL` → base da API (quando o backend existir).
3. Cada Pull Request ganha um **preview deploy** automático; o merge em `main`
   publica em produção.

O [`vercel.json`](./vercel.json) apenas fixa o framework; o resto é convenção.

---

## Roadmap

Próximos passos (frontend e, por último, o backend) estão em
[`TODO.md`](./TODO.md), com o mapa de _mocks → endpoints_.
