using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>
/// Direitos do titular (LGPD): portabilidade (exportar todos os dados),
/// eliminação (excluir a conta, com cascata nas FKs) e registro de consentimento.
/// Todas as leituras filtram por <c>@UserId</c>; nada de segredo (senha/tokens) sai
/// na exportação.
/// </summary>
public sealed class LgpdRepository
{
    private readonly IDbConnectionFactory _factory;

    public LgpdRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<object> ExportAsync(long userId)
    {
        using var conn = _factory.Create();

        async Task<IDictionary<string, object>?> One(string sql) =>
            (IDictionary<string, object>?)await conn.QuerySingleOrDefaultAsync<dynamic>(sql, new { UserId = userId });

        async Task<IReadOnlyList<IDictionary<string, object>>> Many(string sql) =>
            (await conn.QueryAsync<dynamic>(sql, new { UserId = userId }))
                .Cast<IDictionary<string, object>>().ToList();

        return new
        {
            account = await One(
                "SELECT id, name, email, email_verified, created_at FROM users WHERE id = @UserId"),
            profile = await One(
                "SELECT * FROM nutri_profiles WHERE user_id = @UserId"),
            subscription = await One(
                @"SELECT id, plan_id, status, has_pending_charge, current_period_end, created_at
                  FROM subscriptions WHERE user_id = @UserId"),
            consultations = await Many(
                @"SELECT id, nutritionist_id, date, time, status, created_at
                  FROM consultations WHERE user_id = @UserId ORDER BY date, time"),
            consents = await Many(
                "SELECT document, version, accepted_at FROM consent_records WHERE user_id = @UserId ORDER BY accepted_at"),
            tracking = new
            {
                weight = await Many("SELECT date, weight_kg FROM weight_logs WHERE user_id = @UserId ORDER BY date"),
                water = await Many("SELECT date, ml FROM water_logs WHERE user_id = @UserId ORDER BY date"),
                sleep = await Many("SELECT date, hours FROM sleep_logs WHERE user_id = @UserId ORDER BY date"),
                steps = await Many("SELECT date, count FROM step_logs WHERE user_id = @UserId ORDER BY date"),
                measurements = await Many(
                    "SELECT date, waist, hip, chest, arm, thigh FROM measurements WHERE user_id = @UserId ORDER BY date"),
                habits = await Many("SELECT date, done FROM habit_logs WHERE user_id = @UserId ORDER BY date"),
                diary = await Many("SELECT date, done FROM meal_logs WHERE user_id = @UserId ORDER BY date"),
            },
        };
    }

    /// <summary>Apaga a conta; as FKs <c>ON DELETE CASCADE</c> levam perfil, assinatura, consultas, tracking e tokens.</summary>
    public async Task<bool> DeleteAccountAsync(long userId)
    {
        using var conn = _factory.Create();
        var affected = await conn.ExecuteAsync("DELETE FROM users WHERE id = @UserId", new { UserId = userId });
        return affected > 0;
    }

    public async Task RecordConsentAsync(long userId, string document, string version)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO consent_records (user_id, document, version)
              VALUES (@UserId, @Document, @Version)";
        await conn.ExecuteAsync(sql, new { UserId = userId, Document = document, Version = version });
    }

    public async Task<IReadOnlyList<IDictionary<string, object>>> GetConsentsAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            "SELECT document, version, accepted_at FROM consent_records WHERE user_id = @UserId ORDER BY accepted_at";
        var rows = await conn.QueryAsync<dynamic>(sql, new { UserId = userId });
        return rows.Cast<IDictionary<string, object>>().ToList();
    }
}
