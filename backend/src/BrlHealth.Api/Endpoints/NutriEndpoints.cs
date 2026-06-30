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
    int MealsPerDay = 3,
    IReadOnlyList<MealEntry>? Meals = null,
    string? Diet = null,
    IReadOnlyList<string>? Restrictions = null);

public sealed record AutoScheduleRequest(IReadOnlyList<MealEntry> Meals, DailyRoutine Routine);

public static class NutriEndpoints
{
    public static void MapNutriPlan(this WebApplication app)
    {
        // POST /nutri/plan — motor de cálculo (regra de negócio, não-CRUD).
        // Inclui o cardápio do dia: por horário se vierem refeições, senão por nº.
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
                Meals = body.Meals,
            };
            return Results.Ok(NutriPlanCalculator.Compute(profile));
        });

        // POST /nutri/schedule — encaixa os horários das refeições na rotina (acordar/treinar/dormir).
        app.MapPost("/nutri/schedule", (AutoScheduleRequest body) =>
            Results.Ok(MealPlanner.AutoSchedule(body.Meals, body.Routine)));
    }
}
