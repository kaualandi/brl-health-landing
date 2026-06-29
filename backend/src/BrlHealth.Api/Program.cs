using System.IdentityModel.Tokens.Jwt;
using BrlHealth.Api.Data;
using BrlHealth.Api.Endpoints;
using BrlHealth.Api.Services;
using BrlHealth.Api.Services.Email;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<RefreshTokensRepository>();
builder.Services.AddScoped<EmailTokensRepository>();

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

// E-mail transacional: em dev loga no console (provedor real entra atrás do mesmo contrato).
builder.Services.AddSingleton<IEmailSender, ConsoleEmailSender>();

// CORS para o front Next.js (NEXT_PUBLIC_API_URL aponta para cá).
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(builder.Configuration["Cors:Origin"] ?? "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Núcleo de negócio da AV2
app.MapNutriPlan();        // POST /nutri/plan       (motor de cálculo, público)
app.MapConsultations();    // POST /consultations + GET /consultations/me (JOIN) + DELETE
app.MapPlanChange();       // PUT  /me/plan

// Espelho dos mocks do front (§5)
app.MapAuth();             // /auth/login · register · refresh · logout · forgot · reset · verify
app.MapProfile();          // GET/PUT /nutri/profile · GET /nutri/plan
app.MapPlans();            // GET /plans
app.MapFoods();            // GET /foods · /meals (catálogo do cardápio)
app.MapArticles();         // GET /articles · /articles/{id} (conteúdo editorial)
app.MapBilling();          // POST /billing/checkout
app.MapEngagement();       // POST /contact · /waitlist · /analytics/events
app.MapTracking();         // /nutri/water · weight · sleep · steps · measurements · habits · diary

app.Run();
