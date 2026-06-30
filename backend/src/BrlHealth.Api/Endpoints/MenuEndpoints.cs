using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;
using BrlHealth.Api.Services.Menu;

namespace BrlHealth.Api.Endpoints;

public static class MenuEndpoints
{
    public static void MapMenu(this WebApplication app)
    {
        // POST /nutri/menu — gera o cardápio do dia (local por padrão; IA quando OpenAI:ApiKey definido).
        app.MapPost("/nutri/menu", async (NutriProfileRequest body, IMenuGenerator generator, CancellationToken ct) =>
        {
            if (body.Age <= 0 || body.HeightCm <= 0 || body.WeightKg <= 0)
                return Results.BadRequest(new { errors = new[] { "Idade, altura e peso devem ser maiores que zero." } });

            var profile = new NutriProfile
            {
                Sex = NutriMapping.ParseSex(body.Sex),
                Age = body.Age,
                HeightCm = body.HeightCm,
                WeightKg = body.WeightKg,
                Activity = NutriMapping.ParseActivity(body.Activity),
                Goal = NutriMapping.ParseGoal(body.Goal),
                MealsPerDay = body.MealsPerDay,
                Meals = body.Meals,
            };

            var plan = NutriPlanCalculator.Compute(profile);
            var menu = await generator.GenerateAsync(profile, plan, ct);
            return Results.Ok(menu);
        });
    }
}
