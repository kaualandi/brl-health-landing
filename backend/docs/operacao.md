# Operação — BRL Health (AV2)

> Cobre os itens **12** (matriz de riscos), **13** (gatilhos), **14** (métrica de
> fluxo/DORA), **15** (métrica de qualidade), **16** (SLO) e **17** (Error Budget
> Policy). Conteúdo específico da operação do backend BRL Health.

---

## Matriz de Riscos (itens 12 e 13)

> Colunas padronizadas. `Probabilidade` e `Impacto` ∈ `Alto` / `Médio` / `Baixo`.
> `Estratégia` ∈ `Mitigar` / `Transferir` / `Aceitar` / `Evitar`. A coluna
> `Gatilho` descreve o evento observável e irrefutável que dispara a `Ação
> Planejada`.

| Risco | Probabilidade | Impacto | Estratégia | Ação Planejada | Gatilho |
|---|---|---|---|---|---|
| Motor de cálculo do front (TS) e do back (C#) divergirem e gerarem planos diferentes | Médio | Alto | Mitigar | Suíte de testes comparando as duas saídas para os mesmos insumos; cálculo único no servidor | Teste de paridade falha para ao menos um perfil de usuário no CI |
| Brute-force / abuso no `POST /auth/login` por falta de rate-limit | Médio | Alto | Mitigar | Adicionar rate-limiting e bloqueio temporário por IP/usuário após N tentativas | Mais de 100 tentativas de login falhas por minuto vindas do mesmo IP |
| Vazamento de dados pessoais de saúde (LGPD) | Baixo | Alto | Transferir | Cifrar dados sensíveis, contratar seguro cibernético e firmar DPA com o provedor de nuvem | Auditoria de segurança aponta dado sensível exposto ou acesso indevido detectado |
| Banco PostgreSQL indisponível em produção | Baixo | Alto | Mitigar | Réplica gerenciada com failover automático e backups testados (PITR) | Health check do banco falha por mais de 60 segundos consecutivos |
| Pico de carga no agendamento esgotar o pool de conexões | Médio | Médio | Mitigar | Dimensionar o pool, usar `using` nas conexões e adicionar fila/escala horizontal | Tempo de resposta de `POST /consultations` ultrapassa 2s no p95 por 5 minutos |
| Falha do provedor de pagamento externo no checkout | Baixo | Médio | Aceitar | Exibir mensagem clara e permitir nova tentativa; não bloquear o uso do app | Webhook de pagamento retorna erro 5xx em mais de 10% das chamadas na janela |

---

## Métrica de Fluxo — DORA (item 14)

> Ficha de Definição Operacional (7 campos).

Nome da Métrica: Frequência de Deploy (DORA — Deployment Frequency)

O que Mede: com que frequência a equipe coloca código novo do backend BRL Health
em produção — um indicador de fluxo (throughput) de entrega.

Fórmula: número de deploys bem-sucedidos em produção ÷ período observado (por
semana).

Fonte de Dados: histórico de execuções do pipeline de CI/CD (GitHub Actions) e as
tags de release do repositório.

Frequência de Coleta: semanal (agregada também por mês para tendência).

Limites de Saúde: saudável ≥ 1 deploy/semana; atenção entre 1 deploy/semana e 1
deploy/mês; crítico < 1 deploy/mês (sinal de lotes grandes e Lead Time alto).

Ação se Violado: se cair abaixo do limite, investigar gargalos de Lead Time
(revisões paradas, ambiente de homologação instável) e quebrar entregas em lotes
menores para restabelecer o Throughput.

---

## Métrica de Qualidade (item 15)

> Mesma Ficha de Definição Operacional (7 campos).

Nome da Métrica: Change Failure Rate (Taxa de Falha de Mudança)

O que Mede: a proporção de deploys que causam falha em produção (erro, incidente
ou necessidade de rollback) — qualidade do que é entregue.

Fórmula: (nº de deploys que resultaram em Falha/Erro em produção ÷ nº total de
deploys) × 100.

Fonte de Dados: registros de incidentes, alertas de erro (logs/observabilidade) e
resultados da suíte de Teste e da Cobertura no CI.

Frequência de Coleta: a cada release e consolidada mensalmente.

Limites de Saúde: saudável ≤ 15%; atenção entre 15% e 30%; crítico > 30%
(qualidade insuficiente, Cobertura de Teste provavelmente baixa).

Ação se Violado: se a taxa ultrapassar o limite, elevar a Cobertura de Teste das
áreas que mais falham, reforçar code review e acionar a Error Budget Policy
abaixo.

---

## SLO — Service Level Objective (item 16)

> SLO da rota mais crítica do sistema: `POST /consultations` (agendamento de
> consulta), o coração da regra de negócio.

SLI (Indicador): porcentagem de requisições a `POST /consultations` respondidas
com sucesso (HTTP 2xx ou 400 de validação esperada) em menos de 1 segundo.

Fórmula de Coleta: (requisições válidas em < 1s ÷ total de requisições a
`POST /consultations`) × 100.

Fonte do Dado: métricas de latência e status HTTP do middleware de
observabilidade da API (traces/logs por rota).

Janela de Medição: 30 dias (janela móvel).

Alvo (SLO): 99.5%

---

## Error Budget Policy (item 17)

Error Budget Policy: com a janela de 30 dias e alvo de 99.5%, o orçamento de erro
é de 0,5% das requisições. A resposta é graduada conforme o consumo desse
orçamento:

- Nível 1 (até 50% do orçamento consumido): operação normal. Time segue entregando
  features; apenas monitora os indicadores.
- Nível 2 (50% a 90% do orçamento consumido): alerta. Priorizar correções de
  confiabilidade e revisar mudanças de risco antes de novos deploys; reduzir o
  ritmo de features arriscadas.
- Nível 3 (acima de 90% / orçamento esgotado): **congelamento** de novas
  funcionalidades (Feature Freeze) — Zero novas funcionalidades até o SLO voltar
  ao alvo. Todo o esforço vai para estabilizar a rota crítica.
