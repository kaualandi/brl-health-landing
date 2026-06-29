using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record NutriProfileRequest(
    string Sex,
    int Age,
    double HeightCm,
    double WeightKg,
    string Activity,
    string Goal,
    int MealsPerDay = 3);

public static class NutriEndpoints
{
    public static void MapNutriPlan(this WebApplication app)
    {
        // Expõe o motor de cálculo nutricional (regra de negócio, não-CRUD).
        app.MapPost("/nutri/plan", (NutriProfileRequest body) =>
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
            };
            return Results.Ok(NutriPlanCalculator.Compute(profile));
        });
    }
}
