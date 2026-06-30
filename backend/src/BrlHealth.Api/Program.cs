using System.IdentityModel.Tokens.Jwt;
using BrlHealth.Api.Data;
using BrlHealth.Api.Endpoints;
using BrlHealth.Api.Services;
using BrlHealth.Api.Services.Email;
using BrlHealth.Api.Validation;
using FluentValidation;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Logging estruturado (observabilidade — §7): console com contexto enriquecido.
builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// Dapper: trata DateOnly em colunas `date`.
Dapper.SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());

// Acesso a dados (Dapper) — factory lê a connection string da configuração (sem segredo no código).
builder.Services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();
builder.Services.AddScoped<ConsultationsRepository>();
builder.Services.AddScoped<SubscriptionsRepository>();
builder.Services.AddScoped<UsersRepository>();
builder.Services.AddScoped<ProfilesRepository>();
builder.Services.AddScoped<TrackingRepository>();
builder.Services.AddScoped<EngagementRepository>();
builder.Services.AddScoped<FoodsRepository>();
builder.Services.AddScoped<ArticlesRepository>();
builder.Services.AddScoped<RecipesRepository>();
builder.Services.AddScoped<RefreshTokensRepository>();
builder.Services.AddScoped<EmailTokensRepository>();
builder.Services.AddScoped<LgpdRepository>();

// Autenticação JWT (auth real — §7). Segredo vem da config/ambiente (seção `Jwt`).
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var jwtTokenService = new JwtTokenService(jwtOptions);
builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton(jwtTokenService);

// `sub` deve permanecer `sub` no principal (sem mapear para ClaimTypes.NameIdentifier).
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = jwtTokenService.ValidationParameters;
    });
builder.Services.AddAuthorization();

// Rate limiting por IP (§7): teto global + política estrita em /auth/* (dívida DT-02).
builder.Services.AddBrlRateLimiter();

// Validação server-side declarativa (§7): valida os DTOs de entrada via ValidationFilter.
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

// OpenTelemetry (§7): tracing/métricas — console em dev, OTLP quando Otel:Endpoint definido.
builder.Services.AddBrlTelemetry(builder.Configuration);

// Health checks: liveness (sem dependências) + readiness (PostgreSQL).
builder.Services.AddScoped<DatabaseHealthCheck>();
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("postgres", tags: ["ready"]);

// E-mail transacional: em dev loga no console (provedor real entra atrás do mesmo contrato).
builder.Services.AddSingleton<IEmailSender, ConsoleEmailSender>();

// Jobs em background (§7): Hangfire (storage em memória em dev; Postgres em prod).
// O envio de e-mail (forgot/verify) é enfileirado e processado fora da requisição.
builder.Services.AddHangfire(cfg => cfg
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseInMemoryStorage());
builder.Services.AddHangfireServer();
builder.Services.AddScoped<IEmailQueue, HangfireEmailQueue>();

// CORS para o front Next.js (NEXT_PUBLIC_API_URL aponta para cá).
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(builder.Configuration["Cors:Origin"] ?? "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Painel do Hangfire em dev (localhost-only por padrão) para inspecionar os jobs.
if (app.Environment.IsDevelopment())
    app.UseHangfireDashboard("/hangfire");

// Health: liveness não roda checagens; readiness exige o banco respondendo.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });

// Núcleo de negócio da AV2
app.MapNutriPlan();        // POST /nutri/plan       (motor de cálculo, público)
app.MapConsultations();    // POST /consultations + GET /consultations/me (JOIN) + DELETE
app.MapPlanChange();       // PUT  /me/plan

// Espelho dos mocks do front (§5)
app.MapAuth();             // /auth/login · register · refresh · logout · forgot · reset · verify  (rate-limited)
app.MapProfile();          // GET/PUT /nutri/profile · GET /nutri/plan
app.MapPlans();            // GET /plans
app.MapFoods();            // GET /foods · /meals (catálogo do cardápio)
app.MapArticles();         // GET /articles · /articles/{id} (conteúdo editorial)
app.MapRecipes();          // GET /recipes · /recipes/{id} (catálogo de receitas)
app.MapBilling();          // POST /billing/checkout
app.MapEngagement();       // POST /contact · /waitlist · /analytics/events
app.MapTracking();         // /nutri/water · weight · sleep · steps · measurements · habits · diary
app.MapLgpd();             // GET /me/data-export · DELETE /me/account · POST/GET /me/consent (LGPD)

app.Run();
