using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>Token de e-mail ativo (reset de senha ou verificação), recuperado para consumo.</summary>
public sealed record EmailTokenRow(long Id, long UserId);

/// <summary>
/// Tokens enviados por e-mail (<c>purpose</c> = <c>reset</c> | <c>verify</c>).
/// Cada novo token invalida os anteriores do mesmo propósito (um válido por vez).
/// </summary>
public sealed class EmailTokensRepository
{
    private readonly IDbConnectionFactory _factory;

    public EmailTokensRepository(IDbConnectionFactory factory) => _factory = factory;

    /// <summary>Consome os tokens pendentes do propósito e insere o novo (transação simples).</summary>
    public async Task IssueAsync(long userId, string purpose, string tokenHash, DateTime expiresAt)
    {
        using var conn = _factory.Create();
        const string sql =
            @"UPDATE email_tokens SET consumed_at = now()
              WHERE user_id = @UserId AND purpose = @Purpose AND consumed_at IS NULL;
              INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
              VALUES (@UserId, @Purpose, @TokenHash, @ExpiresAt);";
        await conn.ExecuteAsync(
            sql, new { UserId = userId, Purpose = purpose, TokenHash = tokenHash, ExpiresAt = expiresAt });
    }

    /// <summary>Busca um token de reset válido pelo hash (não escopado por usuário — alta entropia).</summary>
    public async Task<EmailTokenRow?> FindActiveAsync(string purpose, string tokenHash)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, user_id AS UserId
              FROM email_tokens
              WHERE purpose = @Purpose AND token_hash = @TokenHash
                AND consumed_at IS NULL AND expires_at > now()";
        return await conn.QuerySingleOrDefaultAsync<EmailTokenRow>(
            sql, new { Purpose = purpose, TokenHash = tokenHash });
    }

    /// <summary>Busca um código de verificação válido, escopado pelo usuário (código curto).</summary>
    public async Task<EmailTokenRow?> FindActiveForUserAsync(long userId, string purpose, string tokenHash)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, user_id AS UserId
              FROM email_tokens
              WHERE user_id = @UserId AND purpose = @Purpose AND token_hash = @TokenHash
                AND consumed_at IS NULL AND expires_at > now()";
        return await conn.QuerySingleOrDefaultAsync<EmailTokenRow>(
            sql, new { UserId = userId, Purpose = purpose, TokenHash = tokenHash });
    }

    public async Task ConsumeAsync(long id)
    {
        using var conn = _factory.Create();
        const string sql = "UPDATE email_tokens SET consumed_at = now() WHERE id = @Id";
        await conn.ExecuteAsync(sql, new { Id = id });
    }
}
