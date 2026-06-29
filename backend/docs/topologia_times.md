# Topologia de Times — BRL Health (AV2)

> Cobre o item **20** (parte a): mapeamento dos 4 tipos de time do **Team
> Topologies** para o contexto do BRL Health. A parte b (DoD final) está em
> `release_checklist_final.md`, na raiz de `/backend`.

---

## Mapeamento dos times ao projeto

### Stream-aligned

Time alinhado ao fluxo de valor do produto: dono da experiência **BRL Nutri**
ponta a ponta (onboarding, cálculo do plano, cardápio, tracking, consultas e
assinatura). Entrega features para o usuário final e responde pelos endpoints de
negócio (`POST /consultations`, `PUT /me/plan`, `GET /nutri/plan`). É o time que
mais existe e a quem os demais dão suporte.

### Platform

Time de plataforma que oferece a base interna como serviço: banco PostgreSQL
gerenciado, pipeline de CI/CD, observabilidade (logs/métricas/traces),
`DbConnectionFactory`, gestão de segredos e ambientes (dev/homolog/prod). Reduz a
carga cognitiva do time Stream-aligned, que consome essa plataforma sem precisar
operá-la.

### Enabling

Time capacitador, temporário: ajuda o Stream-aligned a adotar boas práticas que
ele ainda não domina — testes AAA, Threat Modeling, parametrização segura de
queries (Dapper) e cultura de SLO/Error Budget. Atua como mentor por um período e
depois se retira, deixando a capacidade instalada.

### Complicated-Subsystem

Time de subsistema complicado, responsável pela parte que exige conhecimento
especializado: o **motor de cálculo nutricional** (Mifflin-St Jeor, TDEE, macros,
distribuição de refeições). É lógica densa, sensível a erro e com regras
científicas; encapsulá-la num time/owner dedicado evita que cada mudança exija
expertise de todos.

---

## Interações principais

- Stream-aligned **consome** a Platform (modo X-as-a-Service).
- Enabling **colabora** temporariamente com o Stream-aligned (mentoria).
- Complicated-Subsystem expõe o motor de cálculo como serviço/biblioteca para o
  Stream-aligned, escondendo a complexidade interna.
