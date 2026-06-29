using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public static class RecipesEndpoints
{
    public static void MapRecipes(this WebApplication app)
    {
        // GET /recipes — catálogo completo para a página /receitas.
        app.MapGet("/recipes", async (RecipesRepository recipes) =>
            Results.Ok((await recipes.GetAllAsync()).Select(ToResponse)));

        // GET /recipes/{id} — receita completa (ingredientes + modo de preparo).
        app.MapGet("/recipes/{id}", async (string id, RecipesRepository recipes) =>
        {
            var recipe = await recipes.GetByIdAsync(id);
            return recipe is null ? Results.NotFound() : Results.Ok(ToResponse(recipe));
        });
    }

    // Espelha o tipo RecipeFull do front: macros aninhado e `time` no lugar de prep_time.
    private static object ToResponse(RecipeRow r) => new
    {
        r.Id,
        r.Title,
        r.Emoji,
        r.Category,
        r.Excerpt,
        time = r.PrepTime,
        r.Kcal,
        macros = new { protein = r.Protein, carbs = r.Carbs, fat = r.Fat },
        r.Servings,
        r.Diet,
        r.Goals,
        r.Ingredients,
        r.Steps,
        r.Tags,
    };
}
