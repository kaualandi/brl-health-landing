using BrlHealth.Api.Data;
using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record ChangePlanRequest(long UserId, string Target, string? CardNumber);

public static class PlanEndpoints
{
    public static void MapPlanChange(this WebApplication app)
    {
        // 2º endpoint de regra de negócio — mudança de plano com 4 validações -> 400.
        app.MapPut("/me/plan", async (ChangePlanRequest body, SubscriptionsRepository subscriptions) =>
        {
            var target = ParsePlan(body.Target);
            if (target is null)
                return Results.BadRequest(new { errors = new[] { "Plano-alvo inexistente." } });

            var targetRow = await subscriptions.GetPlanAsync(body.Target);
            var current = await subscriptions.GetSubscriptionAsync(body.UserId);
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

            await subscriptions.UpdatePlanAsync(body.UserId, body.Target);
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
