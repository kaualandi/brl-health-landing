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
            var profile = new NutriProfile
            {
                Sex = body.Sex == "male" ? Sex.Male : Sex.Female,
                Age = body.Age,
                HeightCm = body.HeightCm,
                WeightKg = body.WeightKg,
                Activity = ParseActivity(body.Activity),
                Goal = ParseGoal(body.Goal),
                MealsPerDay = body.MealsPerDay,
            };
            return Results.Ok(NutriPlanCalculator.Compute(profile));
        });
    }

    private static ActivityLevel ParseActivity(string value) => value switch
    {
        "sedentary" => ActivityLevel.Sedentary,
        "light" => ActivityLevel.Light,
        "moderate" => ActivityLevel.Moderate,
        "active" => ActivityLevel.Active,
        "athlete" => ActivityLevel.Athlete,
        _ => ActivityLevel.Sedentary,
    };

    private static Goal ParseGoal(string value) => value switch
    {
        "lose" => Goal.Lose,
        "recomp" => Goal.Recomp,
        "gain" => Goal.Gain,
        "performance" => Goal.Performance,
        "health" => Goal.Health,
        _ => Goal.Health,
    };
}
