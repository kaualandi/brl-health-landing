using System.Text.Json;
using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public sealed record WaterRequest(int Ml, string? Date);
public sealed record WeightRequest(decimal Kg, string? Date);
public sealed record SleepRequest(decimal Hours, string? Date);
public sealed record StepsRequest(int Count, string? Date);
public sealed record MeasurementRequest(
    string? Date, decimal? Waist, decimal? Hip, decimal? Chest, decimal? Arm, decimal? Thigh);
public sealed record DayMapRequest(Dictionary<string, bool> Done, string? Date);

public static class TrackingEndpoints
{
    public static void MapTracking(this WebApplication app)
    {
        // --- Água ---
        app.MapGet("/nutri/water", async (HttpContext ctx, TrackingRepository tracking, string? date) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Ok(new { ml = await tracking.GetWaterAsync(uid, ResolveDate(date)) })
                : Results.Unauthorized());

        app.MapPost("/nutri/water", async (WaterRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.SetWaterAsync(uid, ResolveDate(body.Date), Math.Max(0, body.Ml));
            return Results.Ok(new { ml = body.Ml });
        });

        // --- Peso ---
        app.MapGet("/nutri/weight", async (HttpContext ctx, TrackingRepository tracking) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Ok(await tracking.GetWeightsAsync(uid))
                : Results.Unauthorized());

        app.MapPost("/nutri/weight", async (WeightRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.AddWeightAsync(uid, ResolveDate(body.Date), body.Kg);
            return Results.Ok(new { date = ResolveDate(body.Date).ToString("yyyy-MM-dd"), kg = body.Kg });
        });

        // --- Sono ---
        app.MapGet("/nutri/sleep", async (HttpContext ctx, TrackingRepository tracking) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Ok(await tracking.GetSleepAsync(uid))
                : Results.Unauthorized());

        app.MapPost("/nutri/sleep", async (SleepRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.SetSleepAsync(uid, ResolveDate(body.Date), body.Hours);
            return Results.Ok(new { hours = body.Hours });
        });

        // --- Passos ---
        app.MapGet("/nutri/steps", async (HttpContext ctx, TrackingRepository tracking) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Ok(await tracking.GetStepsAsync(uid))
                : Results.Unauthorized());

        app.MapPost("/nutri/steps", async (StepsRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.SetStepsAsync(uid, ResolveDate(body.Date), Math.Max(0, body.Count));
            return Results.Ok(new { count = body.Count });
        });

        // --- Medidas corporais ---
        app.MapGet("/nutri/measurements", async (HttpContext ctx, TrackingRepository tracking) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Ok(await tracking.GetMeasurementsAsync(uid))
                : Results.Unauthorized());

        app.MapPost("/nutri/measurements", async (MeasurementRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.UpsertMeasurementAsync(
                uid, ResolveDate(body.Date), body.Waist, body.Hip, body.Chest, body.Arm, body.Thigh);
            return Results.Ok(new { saved = true });
        });

        // --- Hábitos (mapa item -> bool no dia) ---
        app.MapGet("/nutri/habits", async (HttpContext ctx, TrackingRepository tracking, string? date) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Content(await tracking.GetHabitsAsync(uid, ResolveDate(date)), "application/json")
                : Results.Unauthorized());

        app.MapPost("/nutri/habits", async (DayMapRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.SetHabitsAsync(uid, ResolveDate(body.Date), JsonSerializer.Serialize(body.Done));
            return Results.Ok(new { saved = true });
        });

        // --- Diário de refeições (mapa refeição -> comida? no dia) ---
        app.MapGet("/nutri/diary", async (HttpContext ctx, TrackingRepository tracking, string? date) =>
            ctx.TryGetUserId(out var uid)
                ? Results.Content(await tracking.GetMealsAsync(uid, ResolveDate(date)), "application/json")
                : Results.Unauthorized());

        app.MapPost("/nutri/diary", async (DayMapRequest body, HttpContext ctx, TrackingRepository tracking) =>
        {
            if (!ctx.TryGetUserId(out var uid)) return Results.Unauthorized();
            await tracking.SetMealsAsync(uid, ResolveDate(body.Date), JsonSerializer.Serialize(body.Done));
            return Results.Ok(new { saved = true });
        });
    }

    private static DateOnly ResolveDate(string? date) =>
        DateOnly.TryParse(date, out var parsed) ? parsed : DateOnly.FromDateTime(DateTime.UtcNow);
}
