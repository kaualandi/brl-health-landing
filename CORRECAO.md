# Correção AV2 — brl-health-landing (BRL Health)

**Grupo:** Não identificado (README sem seção de equipe)

| # | Item de Avaliação | Nota | Justificativa |
|---|-------------------|:----:|---------------|
| 01 | Padrão AAA nos Testes | 0,5 | `ConsultationSchedulingTests.cs` e demais com `// Arrange`, `// Act`, `// Assert`; 5 arquivos de teste |
| 02 | Nomenclatura e Independência | 0,5 | `AgendarConsulta_QuandoTudoValido_DeveRetornarValido` segue `Metodo_Cenario_ResultadoEsperado`; zero condicionais |
| 03 | Padrões Arquiteturais | 0,0 | Pasta `docs/` não existe |
| 04 | Violações Arquiteturais | 0,0 | Pasta `docs/` não existe |
| 05 | ADR | 0,0 | Pasta `docs/` não existe |
| 06 | Dívida Técnica | 0,0 | Pasta `docs/` não existe |
| 07 | Priorização Dívida | 0,0 | Pasta `docs/` não existe |
| 08 | Classificação Manutenção | 0,0 | Pasta `docs/` não existe |
| 09 | Pipeline de Liberação | 0,0 | Pasta `docs/` não existe |
| 10 | Plano de Iteração | 0,0 | Pasta `docs/` não existe |
| 11 | Quadro Kanban e WIP | 0,0 | Pasta `docs/` não existe |
| 12 | Matriz de Riscos | 0,0 | Pasta `docs/` não existe |
| 13 | Gatilhos de Risco | 0,0 | Pasta `docs/` não existe |
| 14 | Métrica DORA | 0,0 | Pasta `docs/` não existe |
| 15 | Métrica de Qualidade | 0,0 | Pasta `docs/` não existe |
| 16 | SLO | 0,0 | Pasta `docs/` não existe |
| 17 | Error Budget Policy | 0,0 | Pasta `docs/` não existe |
| 18 | Segurança SSDF | 0,5 | Nenhuma credencial hardcoded nos 75 arquivos `.cs` |
| 19 | Threat Model e Gates | 0,0 | Pasta `docs/` não existe |
| 20 | Topologia Times e DoD | 0,0 | `topologia_times.md` não existe; `release_checklist_final.md` existe em `/backend/` com 7 `[x]` mas item requer ambos os arquivos |

**Nota Final: 1,5 / 10,0**

---

**Observações:**
- A pasta `docs/` simplesmente não foi criada — zero documentos de arquitetura, qualidade e operação.
- O projeto tem boa estrutura de código (backend/.NET, services, validation) e testes com AAA, mas a AV2 avalia exclusivamente documentação.
- `release_checklist_final.md` está em `/backend/` (não na raiz) e é auto-admitidamente um "placeholder" que declara que as caixas de documentação dependem de "próximo passo do roadmap".
- README não contém nomes nem matrículas dos integrantes.
