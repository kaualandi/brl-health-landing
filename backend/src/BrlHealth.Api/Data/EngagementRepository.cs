using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>Captação e telemetria: contato, lista de espera e eventos de analytics.</summary>
public sealed class EngagementRepository
{
    private readonly IDbConnectionFactory _factory;

    public EngagementRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<long> AddContactMessageAsync(string name, string email, string subject, string message)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO contact_messages (name, email, subject, message)
              VALUES (@Name, @Email, @Subject, @Message)
              RETURNING id";
        return await conn.ExecuteScalarAsync<long>(
            sql, new { Name = name, Email = email, Subject = subject, Message = message });
    }

    public async Task JoinWaitlistAsync(string email, string source)
    {
        using var conn = _factory.Create();
        // Idempotente: e-mail repetido não duplica nem falha.
        const string sql =
            @"INSERT INTO waitlist (email, source) VALUES (@Email, @Source)
              ON CONFLICT (email) DO NOTHING";
        await conn.ExecuteAsync(sql, new { Email = email, Source = source });
    }

    public async Task TrackEventAsync(string @event, string? propsJson)
    {
        using var conn = _factory.Create();
        const string sql =
            "INSERT INTO analytics_events (event, props) VALUES (@Event, @Props::jsonb)";
        await conn.ExecuteAsync(sql, new { Event = @event, Props = propsJson });
    }
}
