using System.Text.Json;
using BrlHealth.Api.Data;

namespace BrlHealth.Api.Endpoints;

public sealed record ContactRequest(string Name, string Email, string Subject, string Message);
public sealed record WaitlistRequest(string Email, string? Source);
public sealed record AnalyticsRequest(string Event, Dictionary<string, JsonElement>? Props);

public static class EngagementEndpoints
{
    public static void MapEngagement(this WebApplication app)
    {
        // POST /contact — espelha contact.service.ts
        app.MapPost("/contact", async (ContactRequest body, EngagementRepository engagement) =>
        {
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Message))
                return Results.BadRequest(new { errors = new[] { "E-mail e mensagem são obrigatórios." } });

            var id = await engagement.AddContactMessageAsync(body.Name, body.Email, body.Subject, body.Message);
            return Results.Created($"/contact/{id}", new { id });
        });

        // POST /waitlist — espelha waitlist.service.ts (idempotente)
        app.MapPost("/waitlist", async (WaitlistRequest body, EngagementRepository engagement) =>
        {
            if (string.IsNullOrWhiteSpace(body.Email))
                return Results.BadRequest(new { errors = new[] { "E-mail é obrigatório." } });

            await engagement.JoinWaitlistAsync(body.Email, body.Source ?? "fit");
            return Results.Ok(new { joined = true });
        });

        // POST /analytics/events — espelha analytics.service.ts:track
        app.MapPost("/analytics/events", async (AnalyticsRequest body, EngagementRepository engagement) =>
        {
            var propsJson = body.Props is null ? null : JsonSerializer.Serialize(body.Props);
            await engagement.TrackEventAsync(body.Event, propsJson);
            return Results.Accepted();
        });
    }
}
