# Correção AV2 — brl-health-landing (BRL Health)

**Grupo:** Lucas Abrahão Anes, Kauã Landi Fernando, Natan de Souza Sampaio, Guilherme da Cunha Sequeira, Murilo de Melo Mouteira, Lucas Gomes Coco da Silva

| # | Item de Avaliação | Nota | Justificativa |
|---|-------------------|:----:|---------------|
| 01 | Padrão AAA nos Testes | 0,5 | 8 arquivos de teste em `backend/tests/BrlHealth.Tests/` com `// Arrange`, `// Act`, `// Assert`; testes reais com lógica de negócio (ConsultationScheduling, NutriPlanCalculator, MealPlanner) |
| 02 | Nomenclatura e Independência | 0,5 | Padrão `Metodo_Cenario_ResultadoEsperado` em todos os métodos (ex: `AgendarConsulta_QuandoTudoValido_DeveRetornarValido`); zero condicionais |
| 03 | Padrões Arquiteturais | 0,5 | 3 cenários com `Positivo:`/`Negativo:` em `backend/docs/analise_arquitetura.md` (motor de cálculo, eventos de domínio, repository pattern) |
| 04 | Violações Arquiteturais | 0,5 | 6 violações com `**Problema:**`, `**Evidência:**`, `**Impacto:**`, `**Ação Recomendada:**` |
| 05 | ADR | 0,5 | `backend/docs/adrs/001-escolha-do-micro-orm.md` com Contexto, Decisão, Consequências, Status: Aceito |
| 06 | Dívida Técnica | 0,5 | 7 dívidas (DT-01 a DT-07) com colunas ID, Descrição, Freq. Alteração, Risco, Esforço, Decisão |
| 07 | Priorização Dívida | 0,5 | P1 (DT-01, DT-02), P2 (DT-03/04/05), P3 (DT-06/07) |
| 08 | Classificação Manutenção | 0,5 | 12 tickets classificados: Corretiva (1,4,7), Adaptativa (2,5,8), Perfectiva (3,6,9), Preventiva (10,11,12) |
| 09 | Pipeline de Liberação | 0,5 | 4 passos: Análise de Impacto, Teste Cirúrgico, Feature Toggle, Estratégia de Release |
| 10 | Plano de Iteração | 0,5 | Objetivo, Escopo, Entregáveis, Risco Principal, DoD preenchidos |
| 11 | Quadro Kanban e WIP | 0,5 | 5 colunas + WIP máximo = 6 (<= 6 integrantes) |
| 12 | Matriz de Riscos | 0,5 | 6 riscos com Probabilidade, Impacto, Estratégia, Ação Planejada |
| 13 | Gatilhos de Risco | 0,5 | Todos os gatilhos com >=20 caracteres descrevendo evento observável |
| 14 | Métrica DORA | 0,5 | "Frequência de Deploy" com 7 campos completos |
| 15 | Métrica de Qualidade | 0,5 | "Change Failure Rate" com 7 campos completos |
| 16 | SLO | 0,5 | SLI, Fórmula, Fonte, Janela (30 dias), Alvo (99.5%) para `POST /consultations` |
| 17 | Error Budget Policy | 0,5 | 3 níveis graduados; Nível 3 com "congelamento de novas funcionalidades (Feature Freeze) — Zero novas funcionalidades" |
| 18 | Segurança SSDF | 0,5 | Nenhuma credencial hardcoded nos 73 `.cs` do `/backend/src`; `Program.cs` usa `builder.Configuration` para todas as chaves (JWT, Stripe, Resend, OpenAI, ConnectionString) |
| 19 | Threat Model e Gates | 0,5 | Ativos, Vetor (`POST /auth/login`), Falha, Mitigação + Gate 1 (SAST), Gate 2 (Testes), Gate 3 (Revisão Manual) |
| 20 | Topologia Times e DoD | 0,5 | 4 tipos Team Topologies + `backend/release_checklist_final.md` com 7 `[x]` detalhados |

**Nota Final: 10,0 / 10,0**

---

**Observações:**
- A documentação da AV2 está em `backend/docs/` (não na raiz), mas cobre integralmente todos os 20 itens.
- O projeto é full-stack (Next.js + .NET Minimal API) com backend robusto: autenticação JWT com refresh token, rate limiting, Dapper + PostgreSQL, Stripe, Hangfire, Serilog, OpenTelemetry.
- Testes cobrem regras de negócio reais (não apenas booleanos): agendamento com 5 validações, cálculo nutricional (BMR/TDEE/macros/IMC), planejador de refeições, webhooks do Stripe.
- Documentação de altíssima qualidade técnica, com domínio específico do produto (BRL Nutri / BRL Fit), não genérica.
- Única ressalva: `release_checklist_final.md` contém autoavaliação honesta indicando que "caixas de Produto Mínimo, Evidência de Qualidade e código da Segurança dependem da fase de código", mas na inspeção o código e testes já estão implementados e atendem aos critérios.
