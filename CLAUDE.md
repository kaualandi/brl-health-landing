@AGENTS.md

<!--
  Instruções de engenharia (para agentes de IA) ficam acima, no @AGENTS.md.
  O conteúdo abaixo é a DOCUMENTAÇÃO DE PRODUTO do BRL Health — pensada para
  virar slides. Explica cada tela e cada funcionalidade, em PT-BR.
-->

# ⚙️ Backend (AV2) — regras de desenvolvimento — OBRIGATÓRIO

> **Sim, o backend segue a avaliação AV2** (`AV2 Avaliação.pdf`). Estas regras são
> **vinculantes** para qualquer trabalho no backend e sobrepõem qualquer suposição
> de stack feita no `TODO.md` antigo. O checklist completo, item a item (incluindo
> os **20 artefatos SDD**), está no **`TODO-BACKEND.md`**.

**Stack (não negociável — exigida pela AV2):**
- Minimal API em **C# (.NET)** + **Dapper** (micro-ORM). **Não** usar EF Core como
  ORM principal.
- Banco **PostgreSQL** (Npgsql) — trocável, registrar como ADR.
- Backend autocontido em **`/backend`** (monorepo): `/backend/src`,
  `/backend/tests`, `/backend/docs`, `/backend/release_checklist_final.md`.
- ⚠️ O corretor automático da AV2 roda **apontando para `/backend`**; todos os
  caminhos literais do PDF (`/src`, `/tests`, `/docs`, raiz) são relativos a essa raiz.

**Requisitos de código (valem nota — ver `TODO-BACKEND.md §3`):**
1. **≥2 endpoints de regra de negócio** (não CRUD simples de 1 tabela).
2. **≥1 endpoint com JOIN** (`INNER`/`LEFT JOIN`) entre 2+ tabelas.
3. **≥1 endpoint com 3+ validações de negócio** antes de gravar → `400 Bad Request`
   com mensagem específica.
4. **Todas** as queries parametrizadas com `@Parametro` — proibido concatenar ou
   interpolar string em SQL.
5. **Sem credenciais hardcoded** em `.cs` (item 18 da AV2): connection string só via
   `builder.Configuration` / `Environment.GetEnvironmentVariable` / user-secrets.
   Nunca `Password=`, `Pwd=`, `User Id=` ou `ConnectionString=` com valor literal.

**20 artefatos SDD (a maior parte da nota):** produzir **todos** os documentos em
`/backend/docs` (+ testes em `/backend/tests`, `release_checklist_final.md` na raiz
de `/backend`) respeitando **os caminhos e literais exatos** do PDF — ver
`TODO-BACKEND.md §6`. Conteúdo específico do BRL Health, não genérico.

**Insumos do professor:** os itens **03, 04 e 08** usam material fornecido no
enunciado (3 cenários, trecho de código C#, 12 tickets). Usar exatamente esses — não
inventar fora do que foi dado.

---

# BRL Health — Documentação do Produto

> Material de apoio para apresentação/slides. Descreve **o que é o produto**, a
> **jornada do usuário** e **cada tela e funcionalidade**, do site público ao app.
>
> **Status:** frontend completo e navegável, com dados/serviços _mock_
> (persistência local no navegador). Backend é a próxima fase. Tudo roda hoje
> ponta a ponta no navegador.

---

## 1. Visão geral

**BRL Health** é um ecossistema de saúde que une **treino e nutrição que se
conversam**. São dois produtos sob a mesma marca:

- **🥗 BRL Nutri — ativo.** App de nutrição personalizada: monta o cardápio,
  calcula calorias e macros, e acompanha a evolução (peso, água, medidas, sono,
  passos, hábitos).
- **💪 BRL Fit — em breve.** App de treino adaptativo. Hoje é uma página de
  "em breve" com lista de espera.

**Proposta de valor:** o que você come e como você treina no mesmo ritmo — do
objetivo à conquista.

**Diferenciais (vs. apps genéricos):**
- Cardápio em **nível de alimento** (não só "almoço — 600 kcal"), com troca de
  itens compatível com a dieta.
- **Dois caminhos** de acompanhamento: cardápio por **IA** + consulta com
  **nutricionista de verdade**.
- **Calculadora pública** gratuita como porta de entrada (lead magnet).
- Plano que se ajusta à **rotina real** (horários de refeição, treino, sono).

---

## 2. Jornada do usuário

```
Visitante
   │
   ├─ Descobre pelo site (landing, conteúdos, calculadora gratuita)
   │
   ├─ Calculadora pública → vê suas metas na hora → "Montar meu plano"
   │       (as respostas são levadas pro cadastro, sem redigitar)
   │
   ├─ Cadastro / Onboarding (8 passos) → gera o plano personalizado
   │
   ▼
Usuário BRL Nutri
   ├─ App /nutri (Início · Meu Corpo · Nutrição · Saúde)
   ├─ Acompanha progresso e segue o cardápio
   ├─ Pode falar com um nutricionista (consulta por vídeo)
   └─ Gerencia plano/assinatura em Minha conta (upgrade / downgrade / cancelar)
```

---

## 3. Identidade visual (design system)

- **Tema:** dark (fundo `#0d0d1a`).
- **Cores da marca:** roxo `#9656a1` (primária), laranja `#ff8906` (destaque),
  verde `#004643`.
- **Tipografia:** **Syne** (títulos/display, encorpada) + **Inter** (texto).
- **Linguagem visual:** cards arredondados, bordas sutis, gradientes suaves,
  microanimações que respeitam "reduzir movimento" (acessibilidade).
- **Feedback:** toasts globais (sucesso/erro/info), estados de carregamento,
  páginas de erro e 404 com a identidade da marca.

---

## 4. Telas do site (público)

### 4.1. Home — `/`
**O que é:** a porta de entrada / landing page.
**Destaques:** Hero com proposta de valor, seção de **Produtos** (BRL Nutri e
BRL Fit), **Como funciona**, **Planos** (resumo) e CTA para começar grátis.

### 4.2. Sobre — `/sobre`
**O que é:** a história e a credibilidade da marca.
**Destaques:** origem ("a história por trás do shape"), métricas, stack/tecnologia,
os dois produtos e um CTA final.

### 4.3. Conteúdos — `/conteudos` e `/conteudos/[slug]`
**O que é:** blog/área de conteúdo educacional sobre nutrição.
**Destaques:** lista com **busca e filtro** por categoria; cada artigo tem página
própria (corpo em seções, tempo de leitura, autor, relacionados e CTA pro Nutri).

### 4.4. Calculadora — `/calculadora` _(lead magnet)_
**O que é:** calculadora pública de **calorias, TDEE, macros, IMC e água**, sem
precisar criar conta.
**Destaques:** preenche sexo, idade, altura, peso, nível de atividade e objetivo
e vê o resultado **na hora**, atualizando ao vivo. CTA "Montar meu plano grátis"
leva pro cadastro **já com as respostas preenchidas** (sem redigitar).

### 4.5. FAQ — `/faq`
**O que é:** perguntas frequentes em accordion.
**Destaques:** temas Geral, BRL Nutri, Planos & cobrança, Conta & privacidade;
com dados estruturados (rich results no Google).

### 4.6. Planos — `/precos`
**O que é:** página dedicada de planos.
**Destaques:** comparação **Free / Pro / Família**; destaca o plano atual do
usuário (quando logado) e leva ao checkout.

### 4.7. BRL Fit — `/fit`
**O que é:** teaser do produto de treino, ainda não lançado.
**Destaques:** proposta de valor, prévia de recursos e **lista de espera**.

### 4.8. Contato — `/contato`
**O que é:** canal de contato.
**Destaques:** formulário com estado de sucesso + infos de contato.

### 4.9. Páginas legais — `/termos` e `/privacidade`
**O que é:** Termos de Uso e Política de Privacidade.
**Destaques:** Termos com isenção clara de saúde (não substitui profissional);
Privacidade alinhada à **LGPD** (direitos do titular).

---

## 5. Acesso

### 5.1. Login — `/login`
**O que é:** entrada de usuários.
**Destaques:** formulário com mostrar/ocultar senha; persiste a sessão e
redireciona pro app. (Conta demo: `demo@brl.com` / `123456`.)

### 5.2. Cadastro / Onboarding — `/cadastro`
**O que é:** o coração da personalização — um wizard que monta o plano.
**8 passos:**
1. **Conta** (nome, e-mail, senha — com medidor de força).
2. **Você** (sexo, idade, altura, peso e peso-alvo).
3. **Objetivo** (perder gordura, recomposição, ganhar massa, performance, saúde).
4. **Atividade** (5 níveis, cada um com descrição de esforço percebido).
5. **Dieta** (onívoro, vegetariano, vegano, low carb, mediterrâneo).
6. **Restrições** (lactose, glúten, oleaginosas, frutos do mar, ovo…).
7. **Rotina** (refeições do dia + horários de acordar/treinar/dormir).
8. **Revisão** (resumo editável) → animação de **"gerando cardápio"** → app.
**Destaques:** quem já está logado pula o passo de conta; quem veio da
calculadora já chega com vários campos preenchidos.

---

## 6. App BRL Nutri (logado)

### 6.1. Dashboard — `/nutri` (navegação por **abas**)
Barra fixa com quatro seções:

- **🏠 Início** — saudação personalizada, **resumo do plano** (meta de calorias,
  TDEE, macros, IMC, água, metabolismo basal), card **"Acompanhamento"** (IA +
  nutricionista), conteúdos recomendados, dicas e teaser do BRL Fit.
- **⚖️ Meu Corpo** — **peso** (registro + gráfico de evolução + progresso até a
  meta) e **medidas corporais** (cintura, quadril, peito, braço, coxa) com
  variação e mini-gráfico por medida.
- **🍽️ Nutrição** — **diário do dia** (marca o que comeu, soma calorias vs.
  meta), **receita do dia**, **linha do tempo** das refeições por horário, e
  atalho pra **lista de compras**.
- **❤️ Saúde** — **água** (copos vs. meta), **sono** (horas + semana), **passos**
  (meta + kcal estimadas) e **hábitos do dia** (com streak 🔥 e confete ao
  completar tudo).

### 6.2. Detalhe da refeição (sheet)
**O que é:** abre ao tocar numa refeição.
**Destaques:** macros do prato, **lista de alimentos** com porção e kcal, e
**troca** de cada alimento por alternativa compatível com a dieta/restrições.

### 6.3. Acompanhamento com nutricionista
**O que é:** o caminho "humano" do app.
**Destaques:** escolher profissional (com **recomendação** pelo seu objetivo +
dieta) → dia → horário; **saldo de consultas por plano** (Free 1, Pro 4, Família
8); agendar consome um crédito e cancelar devolve. Sem saldo, vira convite pra
upgrade.

### 6.4. Editar perfil — `/nutri/perfil`
**O que é:** ajustar os dados do plano.
**Destaques:** recalcula o plano **ao vivo** (prévia) antes de salvar.

### 6.5. Lista de compras — `/nutri/compras`
**O que é:** lista gerada a partir da dieta + restrições.
**Destaques:** organizada por categoria, itens marcáveis (persistem), copiar e
limpar.

### 6.6. Minha conta — `/conta`
**O que é:** central da conta e da assinatura.
**Destaques:** dados pessoais, resumo do BRL Nutri, **gestão de assinatura**
(upgrade vai pro checkout; **downgrade** e **cancelamento** acontecem ali mesmo,
com aviso do que muda — ex.: queda das consultas), refazer plano, sair e excluir
conta.

### 6.7. Checkout — `/checkout`
**O que é:** contratação de plano pago.
**Destaques:** resumo do plano + formulário de cartão (mock); sucesso ativa o
tier; há caminho de erro (cartão recusado).

---

## 7. Funcionalidades-chave (transversais)

- **Motor de cálculo nutricional:** BMR por **Mifflin-St Jeor**, TDEE pelo nível
  de atividade, ajuste calórico por objetivo, macros (proteína por kg), meta de
  água e IMC com classificação.
- **Cardápio em nível de alimento:** banco de alimentos por papel (proteína,
  carbo, vegetal, fruta, gordura, laticínio, bebida), respeitando dieta e
  restrições, com substituição de itens.
- **Timing inteligente:** distribui as refeições pela rotina (acordar/treinar/
  dormir) e mostra a **linha do tempo** do dia.
- **Acompanhamento (tracking):** água, peso, medidas, sono, passos e hábitos —
  tudo com histórico e reset diário onde faz sentido; **streak** e **confete**
  para engajamento.
- **Planos e monetização:** Free / Pro / Família, upsell discreto e dispensável,
  checkout e **gestão completa de assinatura** (upgrade/downgrade/cancelar).
- **Lead magnet:** calculadora pública que converte em cadastro com os dados já
  preenchidos.
- **SEO & compartilhamento:** metadados ricos, **imagem de compartilhamento (OG)**
  gerada, `sitemap`, `robots` e `manifest` (instalável).

---

## 8. Stack técnica

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4** + **base-ui** + **shadcn** (componentes)
- **TanStack Query/Form** + **Zod** (dados e validação)
- **anime.js** (animações), **lucide-react** (ícones), **axios** (HTTP)
- Persistência atual: **localStorage/sessionStorage** (mock) — pronta pra trocar
  por API real (cada serviço mock já marca o endpoint previsto).

---

## 9. Status & próximos passos

**✅ Pronto (frontend, navegável hoje):**
todas as telas acima — site, calculadora, FAQ, páginas legais, onboarding, app
/nutri com 4 abas e tracking completo, nutricionista, planos/checkout, gestão de
assinatura e SEO.

**🔜 Próximo (frontend):**
recuperação de senha e verificação de e-mail, tema claro/escuro, página de
receitas, favoritar conteúdos, README + variáveis de ambiente, testes, deploy/CI.

**🗄️ Última fase (backend — AV2):**
Minimal API em **C# (.NET) + Dapper** sobre **PostgreSQL**, autocontida em
`/backend` (ver as regras vinculantes no topo deste arquivo). A entrega da AV2 =
requisitos de código (endpoints de negócio com JOIN + validações, queries
parametrizadas) + **20 artefatos SDD**. A visão de produção (autenticação real,
pagamento via Stripe, e-mail transacional, cardápio por **IA de verdade**, LGPD)
fica **pós-AV2**. O checklist completo e o mapa _mocks → endpoints_ estão no
**`TODO-BACKEND.md`**.
