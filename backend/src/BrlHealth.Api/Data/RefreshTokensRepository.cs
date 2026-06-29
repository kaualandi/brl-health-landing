using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>Refresh token ativo recuperado pelo hash (para validar/rotacionar).</summary>
public sealed record RefreshTokenRow(long Id, long UserId);

public sealed class RefreshTokensRepository
{
    private readonly IDbConnectionFactory _factory;

    public RefreshTokensRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task InsertAsync(long userId, string tokenHash, DateTime expiresAt)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
              VALUES (@UserId, @TokenHash, @ExpiresAt)";
        await conn.ExecuteAsync(sql, new { UserId = userId, TokenHash = tokenHash, ExpiresAt = expiresAt });
    }

    /// <summary>Busca um token não revogado e não expirado pelo hash.</summary>
    public async Task<RefreshTokenRow?> FindActiveAsync(string tokenHash)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, user_id AS UserId
              FROM refresh_tokens
              WHERE token_hash = @TokenHash AND revoked_at IS NULL AND expires_at > now()";
        return await conn.QuerySingleOrDefaultAsync<RefreshTokenRow>(sql, new { TokenHash = tokenHash });
    }

    public async Task RevokeAsync(long id)
    {
        using var conn = _factory.Create();
        const string sql = "UPDATE refresh_tokens SET revoked_at = now() WHERE id = @Id AND revoked_at IS NULL";
        await conn.ExecuteAsync(sql, new { Id = id });
    }

    /// <summary>Revoga toda a família de tokens do usuário (logout global / após reset de senha).</summary>
    public async Task RevokeAllForUserAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            "UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = @UserId AND revoked_at IS NULL";
        await conn.ExecuteAsync(sql, new { UserId = userId });
    }
}
