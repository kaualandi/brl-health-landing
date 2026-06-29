# Registro de Dívida Técnica — BRL Health (AV2)

> Inventário das dívidas técnicas reais do projeto BRL Health (frontend completo
> com mocks + backend AV2 em construção). Cobre o item **06** (registro em
> tabela, ≥6 dívidas) e o item **07** (priorização na coluna `Decisão`).
>
> Valores padronizados: `Freq. Alteração`, `Risco` e `Esforço` ∈ `Alto` /
> `Médio` / `Baixo`. `Decisão` ∈ `Prioridade 1 (Imediato)` /
> `Prioridade 2 (Próxima Sprint)` / `Prioridade 3 (Aceitar/Ignorar)`.

| ID da Dívida | Descrição Técnica | Freq. Alteração | Risco | Esforço | Decisão |
|---|---|---|---|---|---|
| DT-01 | Motor de cálculo nutricional duplicado: a mesma lógica (Mifflin-St Jeor, TDEE, macros, água, IMC) existe em `src/lib/nutri-plan.ts` (front) e será reescrita em C# no backend, podendo divergir. | Alto | Alto | Médio | Prioridade 1 (Imediato) |
| DT-02 | Ausência de rate-limit nos endpoints de autenticação (`POST /auth/login`, `/auth/register`, `/auth/forgot`), abrindo espaço para brute-force. | Baixo | Alto | Baixo | Prioridade 1 (Imediato) |
| DT-03 | Sessão sem refresh token: o front guarda um token simples e só trata `401` limpando a sessão; não há rotação de credencial. | Baixo | Alto | Médio | Prioridade 2 (Próxima Sprint) |
| DT-04 | Seed de dados (alimentos, refeições, nutricionistas, planos) hardcoded em `Data/schema.sql`/código, sem fonte de verdade externa. | Baixo | Médio | Baixo | Prioridade 2 (Próxima Sprint) |
| DT-05 | Listas sem paginação (consultas, conteúdos, logs de tracking) — retornam tudo de uma vez e degradam com o crescimento dos dados. | Médio | Médio | Baixo | Prioridade 2 (Próxima Sprint) |
| DT-06 | Validação de negócio duplicada front (Zod) e back (C#), com risco de regras saírem de sincronia. | Alto | Baixo | Médio | Prioridade 3 (Aceitar/Ignorar) |
| DT-07 | Conteúdo editorial (artigos e receitas) embutido em código (`src/lib/nutri-content.ts`) em vez de DB/CMS, exigindo deploy para publicar. | Médio | Baixo | Alto | Prioridade 3 (Aceitar/Ignorar) |

## Notas de priorização (item 07)

- **Prioridade 1 (Imediato):** DT-01 e DT-02. A duplicação do cálculo afeta a
  corretude do produto inteiro (plano errado = valor central quebrado) e muda com
  frequência; a falta de rate-limit é um risco de segurança barato de mitigar.
- **Prioridade 2 (Próxima Sprint):** DT-03, DT-04, DT-05 — importantes para
  robustez e escala, mas sem impacto imediato no MVP.
- **Prioridade 3 (Aceitar/Ignorar):** DT-06 e DT-07 — convivemos por ora; a
  validação dupla é uma defesa em profundidade aceitável e o conteúdo em código
  funciona enquanto o volume editorial for baixo.
