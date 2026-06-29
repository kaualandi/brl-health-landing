using BrlHealth.Api.Data;
using BrlHealth.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Acesso a dados (Dapper) — factory lê a connection string da configuração (sem segredo no código).
builder.Services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();
builder.Services.AddScoped<ConsultationsRepository>();
builder.Services.AddScoped<SubscriptionsRepository>();

// CORS para o front Next.js (NEXT_PUBLIC_API_URL aponta para cá).
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(builder.Configuration["Cors:Origin"] ?? "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapNutriPlan();        // POST /nutri/plan       (motor de cálculo)
app.MapConsultations();    // POST /consultations + GET /consultations/me (JOIN)
app.MapPlanChange();       // PUT  /me/plan

app.Run();
