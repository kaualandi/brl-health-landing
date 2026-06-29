# Análise de Arquitetura — BRL Health (AV2)

> Documento de análise arquitetural do backend do BRL Health (Minimal API em
> C#/.NET + Dapper sobre PostgreSQL). Cobre os itens **03** (padrões
> arquiteturais em 3 cenários) e **04** (violações arquiteturais num trecho de
> código). Conteúdo específico do domínio BRL Nutri / BRL Fit.

---

## Parte 1 — Padrões Arquiteturais (item 03)

> Para cada cenário real do produto, identificamos o **padrão arquitetural
> provável** e descrevemos pelo menos um **trade-off** (com um ponto positivo e
> um negativo).

### Cenário 1 — Motor de cálculo nutricional reusável e intercambiável

**Contexto:** o `NutriPlanCalculator` (BMR por Mifflin-St Jeor, TDEE, macros,
água, IMC) precisa rodar de forma idêntica no app (hoje em TypeScript) e no
backend (C#), e a equipe quer poder trocar a fórmula de gasto energético
(Mifflin-St Jeor → Harris-Benedict) sem reescrever o restante do fluxo de
onboarding.

**Padrão provável:** **Strategy** (cada fórmula de BMR é uma estratégia
plugável) sobre uma **Arquitetura em Camadas** (o cálculo vive na camada de
domínio/`Services`, isolado de HTTP e de banco).

**Trade-off:** isolar o cálculo atrás de uma interface (`IBmrFormula`) torna o
algoritmo testável e substituível.
- `Positivo:` a regra de negócio fica coberta por testes unitários puros (sem
  banco), e adicionar uma nova fórmula não toca nos endpoints.
- `Negativo:` há custo de indireção e duplicação conceitual — a mesma lógica
  existe em TS (front) e em C# (back), exigindo disciplina para mantê-las
  sincronizadas (ver dívida DT-01 em `registro_divida_tecnica.md`).

### Cenário 2 — Agendar consulta dispara efeitos colaterais

**Contexto:** ao agendar uma consulta (`POST /consultations`), o sistema precisa
debitar um crédito do plano, marcar o slot do nutricionista e, no futuro,
enviar e-mail de confirmação e criar um evento de calendário. A equipe quer
desacoplar **quem agenda** de **quem reage ao agendamento**.

**Padrão provável:** **Arquitetura Orientada a Eventos** (Event-Driven /
Publish-Subscribe), com um evento de domínio `ConsultaAgendada` consumido por
handlers independentes (débito de crédito, notificação, calendário).

**Trade-off:** publicar um evento em vez de chamar serviços diretamente reduz o
acoplamento entre os módulos.
- `Positivo:` adicionar um novo efeito (ex.: webhook para o nutricionista) é só
  registrar mais um assinante, sem alterar o endpoint de agendamento.
- `Negativo:` o fluxo passa a ser assíncrono e indireto, dificultando depurar
  "o que aconteceu" e exigindo tratamento de consistência eventual e reentrega.

### Cenário 3 — Trocar o banco sem reescrever as regras

**Contexto:** o backend nasce em PostgreSQL (Npgsql), mas a equipe quer poder
migrar para outro provedor relacional sem reescrever as regras de agendamento,
billing e tracking. O acesso a dados é feito com Dapper.

**Padrão provável:** **Repository Pattern** + **Inversão de Dependência** — as
regras dependem de interfaces (`IConsultationsRepository`,
`ISubscriptionsRepository`), e a implementação Dapper/Postgres é injetada via DI.

**Trade-off:** esconder o Dapper atrás de repositórios protege o domínio dos
detalhes do banco.
- `Positivo:` o domínio fica independente do provedor; trocar Postgres por outro
  banco relacional concentra a mudança nos repositórios e na `DbConnectionFactory`.
- `Negativo:` cria-se uma camada extra de abstração que pode "vazar" (paginação,
  tipos específicos do Postgres como `text[]`), e exige escrever e manter o
  mapeamento manual das queries.

---

## Parte 2 — Violações Arquiteturais (item 04)

> Análise de um trecho de código C# (endpoint de agendamento escrito de forma
> deliberadamente ruim, antes da refatoração para camadas). Listamos as
> violações no formato exigido.

### Trecho de código analisado

```csharp
// Endpoints/ConsultationsEndpoint.cs  (VERSÃO RUIM — antes da refatoração)
app.MapPost("/consultations", async (HttpContext ctx, ConsultationDto dto) =>
{
    // conexão e credenciais embutidas no próprio handler
    var conn = new NpgsqlConnection(
        "Host=db.brlhealth.com;Database=brl;User Id=admin;Password=senha123;");
    conn.Open();

    // regra de negócio, validação, acesso a dados e HTTP no mesmo lugar
    var saldo = conn.ExecuteScalar<int>(
        "SELECT COUNT(*) FROM consultations WHERE user_id = " + dto.UserId);

    // SQL montado por concatenação de string com input do usuário
    var ocupado = conn.ExecuteScalar<int>(
        "SELECT COUNT(*) FROM consultations WHERE nutritionist_id = "
        + dto.NutritionistId + " AND date = '" + dto.Date + "'");

    try
    {
        conn.Execute("INSERT INTO consultations (user_id, nutritionist_id, date) "
            + "VALUES (" + dto.UserId + "," + dto.NutritionistId + ",'" + dto.Date + "')");
    }
    catch (Exception) { /* engole o erro e segue */ }

    return Results.Ok("ok");
});
```

### Violações identificadas

**1. Credenciais e string de conexão hardcoded no código**

**Problema:** a connection string, incluindo `User Id` e `Password`, está
escrita literalmente dentro do handler.
**Evidência:** `"Host=db.brlhealth.com;Database=brl;User Id=admin;Password=senha123;"`
embutido no `MapPost`.
**Impacto:** vaza credenciais no repositório (e em logs), impede trocar de
ambiente (dev/prod) sem recompilar e viola o item 18 (SSDF) da própria AV2.
**Ação Recomendada:** ler a connection string de `builder.Configuration
.GetConnectionString("Default")` / variável de ambiente / `user-secrets`, e abrir
a conexão por uma `DbConnectionFactory` injetada.

**2. SQL por concatenação de string (injeção de SQL)**

**Problema:** as queries são montadas concatenando o input do usuário
diretamente no texto SQL.
**Evidência:** `"... WHERE user_id = " + dto.UserId` e
`"... date = '" + dto.Date + "'"`.
**Impacto:** abre **SQL Injection** (um `Date` malicioso pode ler/destruir
dados) e quebra a Regra 4 da AV2 (queries 100% parametrizadas).
**Ação Recomendada:** usar exclusivamente parâmetros nomeados do Dapper
(`@UserId`, `@NutritionistId`, `@Date`) passando um objeto anônimo.

**3. Ausência de separação de responsabilidades (God Handler)**

**Problema:** o mesmo método trata HTTP, regra de negócio, validação e acesso a
dados — não há camadas.
**Evidência:** o `MapPost` abre conexão, consulta saldo, valida slot e faz
`INSERT`, tudo inline.
**Impacto:** código não testável isoladamente, difícil de evoluir e propenso a
duplicação entre endpoints.
**Ação Recomendada:** separar em camadas — `Endpoint` (HTTP) → `Service`
(regra) → `Repository` (Dapper), com o domínio sem dependência de HTTP.

**4. Validações de negócio ausentes antes da escrita**

**Problema:** o código lê `saldo` e `ocupado` mas não bloqueia o `INSERT` quando
não há crédito, o slot está ocupado ou a data é inválida.
**Evidência:** as variáveis `saldo`/`ocupado` são calculadas e ignoradas; o
`INSERT` ocorre incondicionalmente.
**Impacto:** permite agendamentos inválidos (sem saldo, em horário ocupado, no
passado), corrompendo a regra de negócio e o saldo de consultas por plano.
**Ação Recomendada:** implementar as validações antes de gravar e retornar
`400 Bad Request` com mensagem específica em cada falha (Regra 3 da AV2).

**5. Tratamento de erro que engole exceções**

**Problema:** o `catch (Exception)` captura qualquer erro e segue sem registrar
nem propagar.
**Evidência:** `catch (Exception) { /* engole o erro e segue */ }` seguido de
`Results.Ok("ok")`.
**Impacto:** falhas de banco viram "sucesso" silencioso; o usuário acha que
agendou e não agendou, e não há rastro para diagnóstico.
**Ação Recomendada:** deixar a exceção propagar para um middleware de tratamento
de erros (ou logar e retornar `500`), nunca mascarar como `200 OK`.

**6. Gestão manual e vazante de conexão (recurso não liberado)**

**Problema:** a `NpgsqlConnection` é aberta manualmente e nunca é fechada nem
descartada (`using`).
**Evidência:** `conn.Open();` sem `using`/`Dispose`, mesmo no caminho de exceção.
**Impacto:** vazamento de conexões esgota o pool sob carga, derrubando o
endpoint mais crítico (agendamento).
**Ação Recomendada:** obter a conexão via factory dentro de um `using` (ou
`await using`), garantindo liberação determinística em qualquer caminho.
