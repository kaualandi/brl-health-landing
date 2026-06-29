# ADR 001 — Escolha do micro-ORM: Dapper vs EF Core

Status: Aceito

> Architecture Decision Record do backend do BRL Health. Registra a decisão de
> acesso a dados da Minimal API (item 05 da AV2).

## Contexto

O backend do BRL Health é uma Minimal API em C#/.NET que precisa acessar um banco
PostgreSQL para os agregados de usuários, perfis nutricionais, consultas, planos,
assinaturas e tracking (água, peso, sono, passos, medidas, hábitos, diário).

A AV2 exige **queries 100% parametrizadas** (`@Parametro`, sem concatenação) e
valoriza controle explícito sobre o SQL (endpoints de negócio com `JOIN` e
múltiplas validações). A equipe é pequena, o schema é conhecido e estável, e a
performance das consultas de tracking (muitas leituras por `user_id` + `date`)
importa. As opções consideradas foram **Dapper** (micro-ORM) e **Entity
Framework Core** (ORM completo).

## Decisão

Adotar **Dapper** como camada de acesso a dados, com `Npgsql` como provider e uma
`DbConnectionFactory` injetada via DI. Todo SQL é escrito à mão em repositórios
por agregado, sempre com parâmetros nomeados (`@UserId`, `@Date`, …). O EF Core
**não** será usado como ORM principal.

> Observação: a própria AV2 exige Dapper como micro-ORM; esta ADR documenta o
> racional da escolha e suas consequências, e não apenas a obrigação.

## Consequências

Prós:
- Controle total sobre o SQL — facilita os `JOIN`s exigidos e o tuning das
  consultas de tracking.
- Mapeamento explícito e parametrização natural com `@Parametro`, atendendo à
  Regra 4 da AV2 sem esforço extra.
- Superfície pequena, sem "mágica" de change-tracking nem migrations pesadas;
  curva de aprendizado baixa.
- Leituras rápidas e previsíveis, adequadas a um app com muitos `GET` de logs.

Contras:
- Escrever e manter SQL à mão é mais verboso; sem migrations automáticas (o
  schema vive em `Data/schema.sql`).
- Sem change-tracking nem unit-of-work prontos — transações e consistência ficam
  por conta do desenvolvedor.
- Refatorações de schema exigem ajustar queries manualmente (risco mitigado por
  testes e pela centralização nos repositórios).

---

> ADRs complementares previstos (opcionais): `002-postgres-vs-sqlite.md`
> (banco relacional) e `003-calculo-no-servidor.md` (mover o motor de cálculo
> nutricional para o backend).
