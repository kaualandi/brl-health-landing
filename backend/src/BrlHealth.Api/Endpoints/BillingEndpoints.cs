using BrlHealth.Api.Data;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record CardDto(string Holder, string Number, string Expiry, string Cvv);
public sealed record CheckoutRequest(string PlanId, CardDto Card);

public static class BillingEndpoints
{
    public static void MapBilling(this WebApplication app)
    {
        // POST /billing/checkout — espelha billing.service.ts:processPayment
        app.MapPost("/billing/checkout", async (
            CheckoutRequest body, HttpContext ctx, SubscriptionsRepository subscriptions) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var plan = await subscriptions.GetPlanAsync(body.PlanId);
            if (plan is null)
                return Results.BadRequest(new { errors = new[] { "Plano inexistente." } });

            var payment = Payment.ValidateCard(body.Card.Number);
            if (!payment.IsValid)
                return Results.BadRequest(new { errors = payment.Errors });

            await subscriptions.ActivatePlanAsync(userId, body.PlanId);
            return Results.Ok(new { planId = body.PlanId, paidAt = DateTime.UtcNow.ToString("o") });
        });
    }
}
