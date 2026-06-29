using BrlHealth.Api.Data;
using BrlHealth.Api.Endpoints;

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

// CORS para o front Next.js (NEXT_PUBLIC_API_URL aponta para cá).
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(builder.Configuration["Cors:Origin"] ?? "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Núcleo de negócio da AV2
app.MapNutriPlan();        // POST /nutri/plan       (motor de cálculo, público)
app.MapConsultations();    // POST /consultations + GET /consultations/me (JOIN) + DELETE
app.MapPlanChange();       // PUT  /me/plan

// Espelho dos mocks do front (§5)
app.MapAuth();             // /auth/login · register · forgot · reset · verify
app.MapProfile();          // GET/PUT /nutri/profile · GET /nutri/plan
app.MapPlans();            // GET /plans
app.MapFoods();            // GET /foods · /meals (catálogo do cardápio)
app.MapArticles();         // GET /articles · /articles/{id} (conteúdo editorial)
app.MapBilling();          // POST /billing/checkout
app.MapEngagement();       // POST /contact · /waitlist · /analytics/events
app.MapTracking();         // /nutri/water · weight · sleep · steps · measurements · habits · diary

app.Run();
