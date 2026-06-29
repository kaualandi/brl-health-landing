using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public static class FoodsEndpoints
{
    public static void MapFoods(this WebApplication app)
    {
        // GET /foods — catálogo de alimentos (banco de comida do cardápio).
        app.MapGet("/foods", async (FoodsRepository foods) => Results.Ok(await foods.GetFoodsAsync()));

        // GET /meals — tipos de refeição (horário padrão, peso e composição de papéis).
        app.MapGet("/meals", async (FoodsRepository foods) => Results.Ok(await foods.GetMealsAsync()));
    }
}
