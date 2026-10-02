# Tickets: BRL Fit — app de treino adaptativo

Tira o BRL Fit do "em breve": catálogo de exercícios (importado do ExerciseDB e traduzido),
perfil de treino, plano gerado e adaptativo, execução do treino, progressão automática,
progresso/conquistas e integração com o BRL Nutri — no mesmo nível do Nutri (padrões de
`docs/_patterns.md`: módulo Elysia + Drizzle + testes de contrato; front espelhando onboarding,
abas, stores com write-through e hidratação 1×/sessão).

Trabalhe o **frontier**: qualquer ticket cujos bloqueadores estejam todos done.

> **ExerciseDB:** os endpoints grátis são "for exploration only and not recommended for
> production" (limites rígidos) — por isso o catálogo é **importado uma vez** pro nosso banco e
> servido pela nossa API, com atribuição. Conteúdo original em inglês → traduzido por IA (T-2).

## T-1 · Catálogo de exercícios importado do ExerciseDB

**Issue:** #166

**O que construir:** os ~1.500 exercícios do ExerciseDB passam a existir no nosso banco e a API
os serve com busca e filtros — base de tudo do Fit.

**Bloqueado por:** Nenhum — pode começar já

- [ ] Tabela de exercícios (id externo, nome, GIF, grupos, músculos-alvo, secundários, equipamentos, passo a passo) via migração Drizzle
- [ ] Script de importação idempotente que pagina a API grátis pelo cursor, respeitando limite de uso (pausa entre páginas) e reexecutável
- [ ] Dicionário PT-BR dos valores fixos: grupos corporais, músculos e equipamentos (rótulo exibido em português; valor original guardado) — é o vocabulário oficial de equipamentos que o perfil de treino (T-4) usa
- [ ] GIFs copiados pro nosso armazenamento/CDN na importação (não depender do CDN do ExerciseDB em produção), mantendo a atribuição exigida pelos termos
- [ ] `GET /exercises` com busca por nome, filtro por grupo/equipamento/músculo e paginação; `GET /exercises/:id` (404 `{ error }`)
- [ ] `GET /exercises/filters` com as listas de grupos/equipamentos/músculos em PT
- [ ] Atribuição ao ExerciseDB documentada (README) e exposta na resposta/tela
- [ ] Testes de contrato (shape, filtros, paginação, 404)

## T-2 · Exercícios em português

**Issue:** #167

**O que construir:** nome e passo a passo de todos os exercícios aparecem em português, com o
inglês como reserva.

**Bloqueado por:** T-1

- [ ] Colunas traduzidas (nome e instruções em PT) via migração
- [ ] Script de tradução em lote por IA (chave via env, nunca no código), idempotente: só traduz o que falta, em lotes, com retentativa
- [ ] Glossário de academia no prompt (ex.: "supino", "remada", "agachamento", "rosca") pra nomes soarem como se fala no Brasil
- [ ] API devolve o PT quando existe e cai pro inglês quando não
- [ ] Amostra revisada à mão (ex.: 30 exercícios) e correções aplicadas
- [ ] Testes do fallback PT → EN

## T-3 · Biblioteca de exercícios no app

**Issue:** #168

**O que construir:** o usuário navega pelos exercícios com busca e filtros e abre o detalhe com
GIF, músculos trabalhados e passo a passo.

**Bloqueado por:** T-1

- [ ] Tela de biblioteca com busca, filtros (grupo, equipamento) e carregamento paginado — rota logada própria, depois absorvida como aba no T-6
- [ ] Detalhe do exercício: GIF, músculos-alvo/secundários, equipamento, passo a passo
- [ ] Estados de carregamento, vazio e erro com a identidade da marca; acessível (alt do GIF, foco)
- [ ] Catálogo via React Query com cache longo, no padrão dos catálogos do Nutri

## T-4 · Onboarding do Fit (perfil de treino)

**Issue:** #169

**O que construir:** o usuário monta seu perfil de treino num wizard curto; quem já tem perfil
no Nutri reaproveita objetivo, idade, peso e horário de treino sem redigitar.

**Bloqueado por:** Nenhum — pode começar já

- [ ] Perfil de treino: nível (iniciante/intermediário/avançado), dias por semana (2–6), local (casa/academia), equipamentos disponíveis (guarda os valores de equipamento do ExerciseDB, lista pública e fixa — não depende do dicionário do T-1), duração da sessão, lesões/limitações
- [ ] `GET/PUT /fit/profile` (auth, upsert, validação com mensagens PT, 404 sem perfil)
- [ ] Wizard no padrão do onboarding do Nutri (passos, revisão editável, rascunho), pulando o que já vem do perfil do Nutri
- [ ] Editar o perfil depois (equivalente à tela de perfil do Nutri)
- [ ] Testes de contrato da API

## T-5 · Gerar o plano de treino

**Issue:** #170

**O que construir:** a partir do perfil, o app gera um plano semanal coerente — divisão por
dias, exercícios escolhidos do catálogo e séries × reps × descanso pelo objetivo.

**Bloqueado por:** T-1, T-4

- [ ] Motor puro e testado: divisão por dias (full body, A/B, ABC, PPL…) conforme dias/semana e nível
- [ ] Seleção de exercícios por músculo, equipamento disponível e nível, evitando lesões informadas
- [ ] Garante que os equipamentos do perfil (T-4) casam com o dicionário do catálogo (T-1), com teste
- [ ] Prescrição por objetivo (hipertrofia, força, emagrecimento, saúde): faixa de reps, séries, descanso
- [ ] Plano persistido (`POST /fit/plan/generate`, `GET /fit/plan`) e regenerado ao editar o perfil
- [ ] Fim do wizard: tela "gerando seu plano" com prévia da semana (como o passo final do Nutri)
- [ ] Testes do motor (casos por objetivo, nível, dias e equipamento) e de contrato

## T-6 · App /fit com abas

**Issue:** #171

**O que construir:** o BRL Fit vira um app logado com abas Hoje · Plano · Progresso · Biblioteca,
e "Hoje" mostra o treino do dia.

**Bloqueado por:** T-3, T-5

- [ ] Rota do app atrás de login (mesmo gate do Nutri), separada da página pública
- [ ] Abas Hoje (treino do dia ou descanso), Plano (semana), Progresso (placeholder até o T-10) e Biblioteca (T-3)
- [ ] Hidratação do perfil e do plano 1×/sessão, no padrão do Nutri
- [ ] Navegação entre Nutri e Fit no menu do usuário

## T-7 · Trocar um exercício do plano

**Issue:** #172

**O que construir:** o usuário troca um exercício do plano por uma alternativa equivalente,
como a troca de alimento do Nutri.

**Bloqueado por:** T-6

- [ ] Sugestões de troca: mesmo músculo-alvo, equipamento disponível, nível compatível
- [ ] Troca persistida no plano e refletida em "Hoje"
- [ ] Testes da regra de equivalência

## T-8 · Registrar o treino

**Issue:** #173

**O que construir:** o usuário executa o treino do dia no app — marca séries com carga e reps,
usa o timer de descanso e conclui a sessão, que vai pro histórico.

**Bloqueado por:** T-6

- [ ] Tela de execução: série a série, carga e reps realizadas, timer de descanso
- [ ] `POST /fit/sessions` e `GET /fit/sessions` (histórico), dia no fuso do app
- [ ] Write-through: funciona com rede instável e sincroniza
- [ ] Testes de contrato

## T-9 · Progressão automática

**Issue:** #174

**O que construir:** depois de cada sessão o app ajusta sozinho a próxima — sobrecarga
progressiva sem planilha — e mostra "na próxima: X kg".

**Bloqueado por:** T-8

- [ ] Regra pura e testada: bateu o topo da faixa em todas as séries → sobe carga (ou rep); falhou repetidas vezes → mantém/reduz
- [ ] Semana de deload periódica
- [ ] Sugestão de carga exibida em "Hoje" e na execução
- [ ] Testes cobrindo subida, manutenção, falha e deload

## T-10 · Progresso e conquistas

**Issue:** #175

**O que construir:** a aba Progresso mostra a evolução do treino e celebra marcos.

**Bloqueado por:** T-8

- [ ] Volume semanal, frequência e sequência (streak) de treinos
- [ ] Recordes pessoais por exercício e gráfico de carga
- [ ] Conquistas do Fit com confete (reaproveita conquistas e confete do Nutri)

## T-11 · Treino ajusta a meta do Nutri

**Issue:** #176

**O que construir:** ao concluir um treino, o gasto estimado entra na meta do dia no Nutri —
"treinou pesado? suas metas se ajustam sozinhas".

**Bloqueado por:** T-8

- [ ] Gasto da sessão estimado (MET × peso × duração) e guardado na sessão
- [ ] Meta de calorias/macros do dia no Nutri soma o gasto do treino, com card "Treinou hoje: +X kcal"
- [ ] Sem dupla contagem: o TDEE do Nutri já inclui o fator do nível de atividade — somar só o excedente sobre o que esse fator já prevê pro dia (ou usar base sem exercício nos dias de treino), com teste desse caso
- [ ] Só no dia do treino (reseta no dia seguinte, fuso do app)
- [ ] Testes do cálculo e do ajuste

## T-12 · Free × Pro no Fit

**Issue:** #177

**O que construir:** os planos passam a valer no Fit como prometido nas páginas de preço —
Free tem o Fit básico; Pro/Família têm progressão automática e integração com o Nutri.

**Bloqueado por:** T-9, T-11

- [ ] Regras de acesso na API (não só no front) por plano
- [ ] Free: plano gerado e registro de treino; sem progressão automática nem ajuste da meta do Nutri
- [ ] Convite pra upgrade discreto e dispensável, no padrão do Nutri
- [ ] Copy de planos/preços revisada pra bater com o que foi entregue
- [ ] Testes das regras por plano

## T-13 · Lançamento do BRL Fit

**Issue:** #178

**O que construir:** o BRL Fit sai do "em breve": a página pública vira porta de entrada e a
lista de espera é avisada.

**Bloqueado por:** T-2, T-10, T-12

- [ ] Página pública do Fit com CTA de cadastro/entrar (sem "em breve")
- [ ] E-mail de lançamento para a lista de espera (Resend), disparo único e idempotente
- [ ] FAQ, home, "sobre" e sitemap atualizados
- [ ] Validação ponta a ponta no navegador (onboarding → plano → treino → progresso → Nutri)
