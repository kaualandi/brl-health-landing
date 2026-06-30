using BrlHealth.Api.Data;
using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record ChangePlanRequest(string Target, string? CardNumber);

public static class PlanEndpoints
{
    public static void MapPlanChange(this WebApplication app)
    {
        // GET /me/subscription — assinatura/tier atual do usuário (pelo JWT).
        // Destrava no front o tier real, os créditos de consulta e o destaque de plano.
        app.MapGet("/me/subscription", async (HttpContext ctx, SubscriptionsRepository subscriptions) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var sub = await subscriptions.GetSubscriptionAsync(userId);
            var planId = sub?.PlanId ?? "free";
            var plan = await subscriptions.GetPlanAsync(planId);

            return Results.Ok(new
            {
                planId,
                credits = plan?.Credits ?? 0,
                hasPendingCharge = sub?.HasPendingCharge ?? false,
            });
        });

        // 2º endpoint de regra de negócio — mudança de plano com 4 validações -> 400.
        // O usuário vem do JWT (não do body), para ninguém alterar o plano de outra conta.
        app.MapPut("/me/plan", async (ChangePlanRequest body, HttpContext ctx, SubscriptionsRepository subscriptions) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();

            var target = ParsePlan(body.Target);
            if (target is null)
                return Results.BadRequest(new { errors = new[] { "Plano-alvo inexistente." } });

            var targetRow = await subscriptions.GetPlanAsync(body.Target);
            var current = await subscriptions.GetSubscriptionAsync(userId);
            var currentPlan = ParsePlan(current?.PlanId ?? "free") ?? PlanId.Free;

            var result = PlanChange.Validate(
                new PlanChangeRequest(target.Value, body.CardNumber),
                new PlanChangeContext(
                    Current: currentPlan,
                    TargetExists: targetRow is not null,
                    CurrentRank: current?.Rank ?? 0,
                    TargetRank: targetRow?.Rank ?? 0,
                    HasPendingCharge: current?.HasPendingCharge ?? false));

            if (!result.IsValid)
                return Results.BadRequest(new { errors = result.Errors });

            await subscriptions.UpdatePlanAsync(userId, body.Target);
            return Results.Ok(new { plan = body.Target });
        });
    }

    private static PlanId? ParsePlan(string? id) => id switch
    {
        "free" => PlanId.Free,
        "pro" => PlanId.Pro,
        "family" => PlanId.Family,
        _ => null,
    };
}
