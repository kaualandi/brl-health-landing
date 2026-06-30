# Plano de Iteração — BRL Health (AV2)

> Cobre o item **10** (plano da iteração) e o item **11** (quadro visual + limite
> de WIP). Iteração focada na entrega do backend AV2 (endpoints de negócio +
> motor de cálculo + artefatos SDD).

---

## Plano da Iteração (item 10)

Objetivo da Iteração: entregar o núcleo de negócio do backend BRL Health —
agendamento de consultas com validações, mudança de plano e o motor de cálculo
nutricional no servidor — atendendo aos 4 requisitos de código da AV2 e aos 20
artefatos de SDD.

Escopo (Backlog Selecionado): `POST /consultations` (5 validações → `400`),
`GET /consultations/me` (com `INNER JOIN`), `PUT /me/plan` (≥3 validações),
`NutriPlanCalculator` (Mifflin-St Jeor/TDEE/macros), seed da conta demo
(`demo@brl.com`) e os documentos SDD em `/backend/docs`.

Entregáveis (Evidências): solution `.NET` em `/backend` que compila
(`dotnet build`), testes verdes (`dotnet test`) com padrão AAA, queries
parametrizadas (sem concatenação), e os arquivos de `/backend/docs` +
`release_checklist_final.md` preenchidos.

Risco Principal do Ciclo: divergência entre o motor de cálculo do front (TS) e o
do back (C#) gerar planos diferentes para o mesmo usuário (dívida DT-01),
quebrando a confiança no produto.

Definição de Pronto (DoD): código revisado em PR, `dotnet build` e `dotnet test`
verdes, endpoints exercitados manualmente contra o banco, queries 100%
parametrizadas, nenhuma credencial hardcoded em `/backend/src/**.cs` e os
artefatos SDD do escopo commitados.

---

## Quadro Visual e Limite de WIP (item 11)

Quadro Kanban da iteração (5 colunas):

| Backlog | Em Desenvolvimento | Code Review | Em Teste | Concluído |
|---|---|---|---|---|
| `PUT /me/plan` (mudança de plano) | `POST /consultations` (validações) | `NutriPlanCalculator` | — | Setup `/backend` |
| Demais endpoints (tracking) | — | — | — | Artefatos SDD (docs) |
| Seed completo do banco | — | — | — | `GET /consultations/me` (JOIN) |

**WIP máximo: 6 tarefas** por coluna de trabalho ativo (Em Desenvolvimento /
Code Review / Em Teste).

> O limite de WIP (6) é **menor ou igual ao número de integrantes do grupo**
> (6 pessoas).

**Equipe (6 integrantes):**

| Integrante | Matrícula |
|---|---|
| Lucas Abrahão Anes | 06009881 |
| Kauã Landi Fernando | 06009262 |
| Natan de Souza Sampaio | 06010668 |
| Guilherme da Cunha Sequeira | 06002529 |
| Murilo de Melo Mouteira | 06010561 |
| Lucas Gomes Coco da Silva | 06011471 |
