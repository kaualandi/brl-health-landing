using BrlHealth.Api.Data;
using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record ProfileRequest(
    string Sex,
    int Age,
    double HeightCm,
    double WeightKg,
    double? GoalWeightKg,
    string Goal,
    string Activity,
    string Diet,
    int MealsPerDay,
    string? WakeTime,
    string? TrainTime,
    string? SleepTime);

public static class ProfileEndpoints
{
    public static void MapProfile(this WebApplication app)
    {
        // GET /nutri/profile — perfil do usuário autenticado.
        app.MapGet("/nutri/profile", async (HttpContext ctx, ProfilesRepository profiles) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var profile = await profiles.GetAsync(userId);
            return profile is null ? Results.NotFound() : Results.Ok(profile);
        });

        // PUT /nutri/profile — cria/atualiza o perfil (onboarding).
        app.MapPut("/nutri/profile", async (ProfileRequest body, HttpContext ctx, ProfilesRepository profiles) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var row = new ProfileRow(
                Sex: body.Sex, Age: body.Age,
                HeightCm: (decimal)body.HeightCm, WeightKg: (decimal)body.WeightKg,
                TargetKg: (decimal?)body.GoalWeightKg, Goal: body.Goal, Activity: body.Activity, Diet: body.Diet,
                MealsPerDay: body.MealsPerDay, WakeTime: body.WakeTime,
                TrainTime: body.TrainTime, SleepTime: body.SleepTime);

            await profiles.UpsertAsync(userId, row);
            return Results.Ok(row);
        });

        // GET /nutri/plan — plano calculado a partir do perfil salvo.
        app.MapGet("/nutri/plan", async (HttpContext ctx, ProfilesRepository profiles) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var p = await profiles.GetAsync(userId);
            if (p is null)
                return Results.NotFound(new { error = "Sem perfil. Complete o onboarding." });

            var profile = new NutriProfile
            {
                Sex = NutriMapping.ParseSex(p.Sex),
                Age = p.Age,
                HeightCm = (double)p.HeightCm,
                WeightKg = (double)p.WeightKg,
                Activity = NutriMapping.ParseActivity(p.Activity),
                Goal = NutriMapping.ParseGoal(p.Goal),
                MealsPerDay = p.MealsPerDay,
            };
            return Results.Ok(NutriPlanCalculator.Compute(profile));
        });
    }
}
