using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public static class NutritionistsEndpoints
{
    public static void MapNutritionists(this WebApplication app)
    {
        // GET /nutritionists — catálogo público (espelha src/lib/nutritionists.ts).
        app.MapGet("/nutritionists", async (NutritionistsRepository nutritionists) =>
            Results.Ok(await nutritionists.GetAllAsync()));
    }
}
