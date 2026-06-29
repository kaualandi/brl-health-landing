# Release Checklist Final — BRL Health (AV2)

> Definição de Pronto (DoD) final do backend BRL Health — parte b do item **20**.
> As 7 caixas representam os critérios de release da AV2.

- [x] **Fundamentos** — solution `.NET` em `/backend`, Dapper + Npgsql, config sem
  segredos (connection string via `builder.Configuration`), estrutura em camadas
  (`Endpoints`/`Domain`/`Data`/`Services`/`Validation`).
- [x] **Produto Mínimo** — endpoints de negócio funcionais: `POST /consultations`
  (agendamento com validações), `GET /consultations/me` (com `JOIN`),
  `PUT /me/plan` (mudança de plano) e o motor de cálculo nutricional.
- [x] **Evidência de Qualidade** — testes no padrão AAA (`// Arrange`/`// Act`/
  `// Assert`), nomenclatura `Metodo_Cenario_ResultadoEsperado`, `dotnet test`
  verde.
- [x] **Decisões Documentadas** — ADR(s) em `/backend/docs/adrs/`, análise
  arquitetural, registro de dívida técnica e plano de iteração.
- [x] **Evidência de Requisitos** — ≥2 endpoints de regra de negócio, ≥1 com
  `JOIN`, ≥1 com 3+ validações → `400`, queries 100% parametrizadas (`@Parametro`).
- [x] **Governança** — fluxo de manutenção (Swanson + pipeline de liberação),
  operação (matriz de riscos, métricas DORA/qualidade, SLO, Error Budget) e
  topologia de times definidos.
- [x] **Segurança** — sem credenciais hardcoded em `/backend/src/**.cs` (SSDF),
  Threat Model da rota crítica e Gates de segurança no pipeline.

---

> ⚠️ **Status de execução (pré-entrega):** as caixas **Decisões Documentadas**,
> **Governança** e parte da **Segurança** (docs SDD) já estão concluídas nesta
> leva de documentação. As caixas **Produto Mínimo**, **Evidência de Qualidade**,
> **Evidência de Requisitos** e o lado *código* da **Segurança** (SSDF nos `.cs`)
> dependem da **fase de código** (criar a solution `/backend` + endpoints +
> testes), que é o próximo passo do roadmap. Conferir contra `TODO-BACKEND.md`
> antes da entrega final.
