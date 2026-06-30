using BrlHealth.Api.Data;
using BrlHealth.Api.Validation;

namespace BrlHealth.Api.Endpoints;

public sealed record ConsentRequest(string Document, string Version);

/// <summary>
/// Endpoints de direitos do titular (LGPD), todos exigindo sessão: exportação
/// (portabilidade), exclusão da conta (eliminação) e registro de consentimento.
/// Casam com a tela "excluir conta" e a página `/privacidade` do front.
/// </summary>
public static class LgpdEndpoints
{
    public static void MapLgpd(this WebApplication app)
    {
        // GET /me/data-export — portabilidade: todos os dados do titular em JSON.
        app.MapGet("/me/data-export", async (HttpContext ctx, LgpdRepository lgpd) =>
        {
            if (!ctx.TryGetUserId(out var userId)) return Results.Unauthorized();
            return Results.Ok(await lgpd.ExportAsync(userId));
        });

        // DELETE /me/account — eliminação: apaga a conta e tudo em cascata.
        app.MapDelete("/me/account", async (HttpContext ctx, LgpdRepository lgpd) =>
        {
            if (!ctx.TryGetUserId(out var userId)) return Results.Unauthorized();
            var deleted = await lgpd.DeleteAccountAsync(userId);
            return deleted
                ? Results.Ok(new { message = "Conta e dados excluídos" })
                : Results.NotFound(new { error = "Conta não encontrada" });
        });

        // POST /me/consent — registra o consentimento (documento + versão aceitos).
        app.MapPost("/me/consent", async (ConsentRequest body, HttpContext ctx, LgpdRepository lgpd) =>
        {
            if (!ctx.TryGetUserId(out var userId)) return Results.Unauthorized();
            await lgpd.RecordConsentAsync(userId, body.Document, body.Version);
            return Results.Ok(new { message = "Consentimento registrado" });
        }).AddEndpointFilter<ValidationFilter<ConsentRequest>>();

        // GET /me/consent — histórico de consentimentos do titular.
        app.MapGet("/me/consent", async (HttpContext ctx, LgpdRepository lgpd) =>
        {
            if (!ctx.TryGetUserId(out var userId)) return Results.Unauthorized();
            return Results.Ok(await lgpd.GetConsentsAsync(userId));
        });
    }
}
