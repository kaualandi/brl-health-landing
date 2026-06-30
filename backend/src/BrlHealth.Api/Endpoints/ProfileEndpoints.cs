using System.Text.Json;
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
    IReadOnlyList<string>? Restrictions,
    int MealsPerDay,
    int WaterGlasses,
    IReadOnlyList<MealEntry>? Meals,
    string? WakeTime,
    string? TrainTime,
    string? SleepTime);

/// <summary>
/// Resposta do perfil — espelha o NutriProfile do front (sem name/email, que
/// vêm da sessão). <c>meals</c> já volta como array e usa <c>goalWeightKg</c> em
/// vez do <c>target_kg</c> interno.
/// </summary>
public sealed record ProfileResponse(
    string Sex,
    int Age,
    double HeightCm,
    double WeightKg,
    double? GoalWeightKg,
    string Goal,
    string Activity,
    string Diet,
    IReadOnlyList<string> Restrictions,
    int MealsPerDay,
    int WaterGlasses,
    IReadOnlyList<MealEntry> Meals,
    string? WakeTime,
    string? TrainTime,
    string? SleepTime);

public static class ProfileEndpoints
{
    private static readonly IReadOnlyList<MealEntry> EmptyMeals = [];

    private static readonly JsonSerializerOptions MealJsonOptions =
        new() { PropertyNameCaseInsensitive = true };

    public static void MapProfile(this WebApplication app)
    {
        // GET /nutri/profile — perfil do usuário autenticado.
        app.MapGet("/nutri/profile", async (HttpContext ctx, ProfilesRepository profiles) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var profile = await profiles.GetAsync(userId);
            return profile is null ? Results.NotFound() : Results.Ok(ToResponse(profile));
        });

        // PUT /nutri/profile — cria/atualiza o perfil (onboarding).
        app.MapPut("/nutri/profile", async (ProfileRequest body, HttpContext ctx, ProfilesRepository profiles) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var row = new ProfileRow
            {
                Sex = body.Sex,
                Age = body.Age,
                HeightCm = (decimal)body.HeightCm,
                WeightKg = (decimal)body.WeightKg,
                TargetKg = (decimal?)body.GoalWeightKg,
                Goal = body.Goal,
                Activity = body.Activity,
                Diet = body.Diet,
                Restrictions = body.Restrictions?.ToArray() ?? [],
                MealsPerDay = body.MealsPerDay,
                WaterGlasses = body.WaterGlasses,
                Meals = JsonSerializer.Serialize(body.Meals ?? EmptyMeals),
                WakeTime = body.WakeTime,
                TrainTime = body.TrainTime,
                SleepTime = body.SleepTime,
            };

            await profiles.UpsertAsync(userId, row);
            return Results.Ok(ToResponse(row));
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

    private static ProfileResponse ToResponse(ProfileRow r) => new(
        Sex: r.Sex,
        Age: r.Age,
        HeightCm: (double)r.HeightCm,
        WeightKg: (double)r.WeightKg,
        GoalWeightKg: r.TargetKg is null ? null : (double)r.TargetKg,
        Goal: r.Goal,
        Activity: r.Activity,
        Diet: r.Diet,
        Restrictions: r.Restrictions,
        MealsPerDay: r.MealsPerDay,
        WaterGlasses: r.WaterGlasses,
        Meals: DeserializeMeals(r.Meals),
        WakeTime: r.WakeTime,
        TrainTime: r.TrainTime,
        SleepTime: r.SleepTime);

    private static IReadOnlyList<MealEntry> DeserializeMeals(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return EmptyMeals;
        try
        {
            var meals = JsonSerializer.Deserialize<List<MealEntry>>(json, MealJsonOptions);
            return meals ?? EmptyMeals;
        }
        catch
        {
            return EmptyMeals;
        }
    }
}
