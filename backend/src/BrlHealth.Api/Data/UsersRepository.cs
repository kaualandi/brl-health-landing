using Dapper;

namespace BrlHealth.Api.Data;

public sealed record UserRow(long Id, string Name, string Email, string PasswordHash, bool EmailVerified);

public sealed class UsersRepository
{
    private readonly IDbConnectionFactory _factory;

    public UsersRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<UserRow?> FindByEmailAsync(string email)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, name AS Name, email AS Email,
                     password_hash AS PasswordHash, email_verified AS EmailVerified
              FROM users WHERE email = @Email";
        return await conn.QuerySingleOrDefaultAsync<UserRow>(sql, new { Email = email });
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        using var conn = _factory.Create();
        const string sql = "SELECT COUNT(*) FROM users WHERE email = @Email";
        return await conn.ExecuteScalarAsync<int>(sql, new { Email = email }) > 0;
    }

    public async Task<long> InsertAsync(string name, string email, string passwordHash)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO users (name, email, password_hash)
              VALUES (@Name, @Email, @PasswordHash)
              RETURNING id";
        return await conn.ExecuteScalarAsync<long>(
            sql, new { Name = name, Email = email, PasswordHash = passwordHash });
    }

    public async Task SetEmailVerifiedAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql = "UPDATE users SET email_verified = TRUE WHERE id = @UserId";
        await conn.ExecuteAsync(sql, new { UserId = userId });
    }
}
