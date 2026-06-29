# BRL Health — Backend (AV2)

Minimal API em **C# (.NET 10) + Dapper** sobre **PostgreSQL**. Backend do
ecossistema BRL Health (ver produto no `CLAUDE.md` da raiz). Entrega da **AV2**:
requisitos de código + 20 artefatos SDD (em `docs/`).

## Stack

- **.NET 10** Minimal API
- **Dapper** (micro-ORM) + **Npgsql** (PostgreSQL)
- **xUnit** (testes)
- Queries 100% parametrizadas (`@Parametro`), sem ORM pesado.

## Estrutura

```
backend/
├── BrlHealth.slnx
├── src/BrlHealth.Api/
│   ├── Domain/         # enums + modelos (NutriProfile, NutriPlan)
│   ├── Services/       # regra de negócio pura (cálculo + validações)
│   ├── Data/           # Dapper: factory, repositórios, schema.sql, seed.sql
│   ├── Endpoints/      # mapeamento dos endpoints (Minimal API)
│   └── Program.cs
├── tests/BrlHealth.Tests/   # testes AAA
├── docs/               # 20 artefatos SDD da AV2
└── release_checklist_final.md
```

## Configuração (sem segredos no código — SSDF)

A connection string **nunca** é literal em `.cs`. Em desenvolvimento, use
user-secrets ou `appsettings.Development.json` (não versionado). Em produção, a
variável de ambiente `BRLHEALTH_DB`.

```bash
cd src/BrlHealth.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=brlhealth;Username=postgres;Password=SUA_SENHA"
```

Veja `appsettings.Example.json` para o formato.

## Subir o banco

```bash
# com um Postgres rodando em localhost:5432
psql -h localhost -U postgres -d brlhealth -f src/BrlHealth.Api/Data/schema.sql
psql -h localhost -U postgres -d brlhealth -f src/BrlHealth.Api/Data/seed.sql
```

O seed cria a conta demo (`demo@brl.com` / `123456`), os 3 planos e os 4
nutricionistas, para bater com o front.

## Rodar

```bash
dotnet build BrlHealth.slnx
dotnet test  BrlHealth.slnx          # 16 testes AAA
dotnet run --project src/BrlHealth.Api
```

> `GET /health` e `POST /nutri/plan` (motor de cálculo) funcionam sem banco;
> os endpoints de consulta/plano precisam do PostgreSQL configurado.

## Endpoints de negócio (requisitos da AV2)

| Método | Rota | Regra |
|---|---|---|
| `POST` | `/nutri/plan` | Motor de cálculo nutricional (Mifflin-St Jeor, TDEE, macros, água, IMC) |
| `POST` | `/consultations` | Agendamento com **5 validações** → `400` com mensagem específica |
| `GET`  | `/consultations/me` | Consultas do usuário com **INNER JOIN** (consultations × nutritionists × users) |
| `PUT`  | `/me/plan` | Mudança de plano com **4 validações** (cartão `0000` recusado, etc.) |
