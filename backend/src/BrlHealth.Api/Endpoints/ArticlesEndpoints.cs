using System.Text.Json;
using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public static class ArticlesEndpoints
{
    public static void MapArticles(this WebApplication app)
    {
        // GET /articles — lista (metadados, sem corpo) para a página de conteúdos.
        app.MapGet("/articles", async (ArticlesRepository articles) =>
            Results.Ok(await articles.GetAllAsync()));

        // GET /articles/{id} — artigo completo, com o corpo em seções.
        app.MapGet("/articles/{id}", async (string id, ArticlesRepository articles) =>
        {
            var article = await articles.GetByIdAsync(id);
            if (article is null)
                return Results.NotFound();

            using var body = JsonDocument.Parse(article.Body);
            return Results.Ok(new
            {
                article.Id,
                article.Category,
                article.Emoji,
                article.Title,
                article.Excerpt,
                article.ReadTime,
                article.Author,
                article.Goals,
                body = body.RootElement.Clone(),
            });
        });
    }
}
