# Fluxo de Manutenção — BRL Health (AV2)

> Cobre o item **08** (classificação de 12 tickets pela taxonomia de Swanson) e
> o item **09** (pipeline de liberação segura em 4 passos). Tickets fictícios,
> porém realistas para o domínio BRL Nutri / BRL Fit.

---

## Parte 1 — Classificação de Manutenção (item 08)

> Taxonomia de Swanson: `Corretiva` (corrige defeito), `Adaptativa` (adapta a
> mudança no ambiente externo), `Perfectiva` (nova funcionalidade/melhoria
> pedida) e `Preventiva` (melhora manutenibilidade / previne falhas futuras).

| Nº | Ticket | Classificação |
|---|---|---|
| 1 | O gráfico de evolução de peso não atualiza após registrar um novo peso no "Meu Corpo". | Ticket 1 → Corretiva |
| 2 | Migrar a Minimal API de .NET 9 para .NET 10 (LTS) e atualizar o runtime de produção. | Ticket 2 → Adaptativa |
| 3 | Adicionar a opção de dieta "cetogênica" no passo de Dieta do onboarding. | Ticket 3 → Perfectiva |
| 4 | A meta de água retorna 0 ml quando o peso chega como string vazia do formulário. | Ticket 4 → Corretiva |
| 5 | Ajustar a integração de pagamento ao novo formato de API do provedor (Stripe v2). | Ticket 5 → Adaptativa |
| 6 | Adicionar tema claro/escuro com persistência da preferência do usuário. | Ticket 6 → Perfectiva |
| 7 | O interceptor `401` do axios não limpa a sessão em respostas sem corpo. | Ticket 7 → Corretiva |
| 8 | Adequar exportação e exclusão de dados pessoais às exigências da LGPD. | Ticket 8 → Adaptativa |
| 9 | Permitir exportar a lista de compras em PDF, além de copiar texto. | Ticket 9 → Perfectiva |
| 10 | Cobrir o `NutriPlanCalculator` com testes AAA antes de refatorar as fórmulas. | Ticket 10 → Preventiva |
| 11 | Extrair as queries SQL duplicadas para repositórios Dapper, reduzindo risco de divergência. | Ticket 11 → Preventiva |
| 12 | Criar índices em `(user_id, date)` nas tabelas de tracking para prevenir degradação futura. | Ticket 12 → Preventiva |

**Resumo:** Corretiva = Tickets 1, 4, 7 · Adaptativa = Tickets 2, 5, 8 ·
Perfectiva = Tickets 3, 6, 9 · Preventiva = Tickets 10, 11, 12.

---

## Parte 2 — Pipeline de Liberação Segura (item 09)

> Pipeline aplicado a um ticket de **correção** (ex.: Ticket 1 — gráfico de peso
> que não atualiza). Quatro passos.

### 1. Análise de Impacto

Antes de tocar no código, mapear o que o defeito alcança: o bug do gráfico de
peso vive na aba "Meu Corpo" e depende do `weight_logs` e do estado de cache do
front. Levantar quem consome o mesmo dado (resumo do plano em "Início", progresso
até a meta) para garantir que a correção não quebre telas vizinhas. Saída:
lista de arquivos/endpoints afetados e o risco de regressão por área.

### 2. Teste como Instrumento Cirúrgico

Escrever **primeiro** um teste que reproduz o defeito (registrar peso → o gráfico
deve refletir o novo ponto), confirmando que ele falha (vermelho). O teste é o
bisturi: delimita exatamente a falha e vira a prova de que a correção funcionou,
sem mexer em mais nada além do necessário.

### 3. Feature Toggle

Entregar a correção atrás de um **feature toggle** (ex.: `weightChartV2`),
desligado por padrão. Permite mesclar e implantar o código com o conserto
inativo, ligando-o de forma controlada (primeiro em ambiente interno, depois
gradualmente em produção) e desligando-o na hora se algo der errado, sem rollback
de deploy.

### 4. Estratégia de Release e Regressão

Liberar de forma incremental (canary: uma fração dos usuários primeiro),
monitorando os indicadores da rota e os erros do front. Rodar a **suíte de
regressão** das telas que dependem de peso (Meu Corpo, Início) para garantir que
nada quebrou. Confirmada a estabilidade, promover a 100% e, depois de uma janela
de observação, remover o toggle e o código antigo.
