using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public static class PlansEndpoints
{
    public static void MapPlans(this WebApplication app)
    {
        // GET /plans — dados estruturados dos planos (a copy de marketing fica no front, dívida DT-07).
        app.MapGet("/plans", async (SubscriptionsRepository subscriptions) =>
        {
            var plans = await subscriptions.GetAllPlansAsync();
            var result = plans.Select(p => new
            {
                id = p.Id,
                monthlyPrice = p.MonthlyPrice,
                credits = p.Credits,
            });
            return Results.Ok(result);
        });
    }
}
