using BrlHealth.Api.Data;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record ScheduleConsultationRequest(string NutritionistId, string Date, string Time);

public static class ConsultationsEndpoints
{
    // Agenda fixa por profissional (espelha src/lib/nutritionists.ts).
    private static readonly Dictionary<string, string[]> SlotsByNutri = new()
    {
        ["ana-prado"] = ["08:00", "09:00", "10:00", "14:00", "15:00"],
        ["rafael-couto"] = ["07:00", "12:00", "18:00", "19:00", "20:00"],
        ["bianca-rios"] = ["09:00", "10:00", "11:00", "16:00", "17:00"],
        ["diego-martins"] = ["08:30", "11:30", "13:30", "16:30", "18:30"],
    };

    public static void MapConsultations(this WebApplication app)
    {
        // Regra 3 — endpoint de negócio com 5 validações -> 400 com mensagem específica.
        app.MapPost("/consultations", async (
            ScheduleConsultationRequest body,
            HttpContext ctx,
            ConsultationsRepository consultations,
            SubscriptionsRepository subscriptions) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            if (!DateOnly.TryParse(body.Date, out var date))
                return Results.BadRequest(new { errors = new[] { "Data inválida (use o formato YYYY-MM-DD)." } });

            var subscription = await subscriptions.GetSubscriptionAsync(userId);
            var planId = subscription?.PlanId ?? "free";
            var plan = await subscriptions.GetPlanAsync(planId);
            var credits = plan?.Credits ?? 0;

            var active = await consultations.CountActiveByUserAsync(userId);
            var slotTaken = await consultations.IsSlotTakenAsync(body.NutritionistId, date, body.Time);
            var slots = SlotsByNutri.TryGetValue(body.NutritionistId, out var s) ? s : [];

            var result = ConsultationScheduling.Validate(
                new SchedulingRequest(body.NutritionistId, date, body.Time),
                new SchedulingContext(
                    ActiveConsultations: active,
                    PlanCredits: credits,
                    SlotTaken: slotTaken,
                    NutritionistSlots: slots,
                    Today: DateOnly.FromDateTime(DateTime.UtcNow)));

            if (!result.IsValid)
                return Results.BadRequest(new { errors = result.Errors });

            var id = await consultations.InsertAsync(userId, body.NutritionistId, date, body.Time);
            return Results.Created($"/consultations/{id}", new { id });
        });

        // Regra 2 — endpoint com INNER JOIN (consultations × nutritionists × users).
        app.MapGet("/consultations/me", async (HttpContext ctx, ConsultationsRepository consultations) =>
            ctx.TryGetUserId(out var userId)
                ? Results.Ok(await consultations.GetByUserWithDetailsAsync(userId))
                : Results.Unauthorized());

        // DELETE /consultations/{id} — cancela e devolve o crédito do plano.
        app.MapDelete("/consultations/{id:long}", async (long id, HttpContext ctx, ConsultationsRepository consultations) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var affected = await consultations.CancelAsync(id, userId);
            return affected > 0 ? Results.NoContent() : Results.NotFound();
        });
    }
}
