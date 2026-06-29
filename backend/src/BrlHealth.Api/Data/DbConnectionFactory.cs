using System.Data;
using Npgsql;

namespace BrlHealth.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection Create();
}

/// <summary>
/// Abre conexões Npgsql a partir da configuração. SSDF (item 18): a string de
/// conexão NUNCA é literal no código — vem de <c>builder.Configuration</c>,
/// user-secrets ou variável de ambiente.
/// </summary>
public sealed class NpgsqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public NpgsqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("Default")
            ?? Environment.GetEnvironmentVariable("BRLHEALTH_DB")
            ?? throw new InvalidOperationException(
                "Connection string 'Default' não configurada. Use user-secrets (dev) ou a variável de ambiente BRLHEALTH_DB (prod).");
    }

    public IDbConnection Create() => new NpgsqlConnection(_connectionString);
}
