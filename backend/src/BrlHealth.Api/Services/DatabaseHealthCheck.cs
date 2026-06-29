using BrlHealth.Api.Data;
using Dapper;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BrlHealth.Api.Services;

/// <summary>
/// Readiness check: confirma que o PostgreSQL está acessível (<c>SELECT 1</c>).
/// Exposto em <c>/health/ready</c> — o orquestrador só roteia tráfego quando o
/// banco responde. A liveness (<c>/health/live</c>) não depende do banco.
/// </summary>
public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly IDbConnectionFactory _factory;

    public DatabaseHealthCheck(IDbConnectionFactory factory) => _factory = factory;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            using var conn = _factory.Create();
            await conn.ExecuteScalarAsync<int>(
                new CommandDefinition("SELECT 1", cancellationToken: cancellationToken));
            return HealthCheckResult.Healthy("PostgreSQL acessível.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("PostgreSQL inacessível.", ex);
        }
    }
}
