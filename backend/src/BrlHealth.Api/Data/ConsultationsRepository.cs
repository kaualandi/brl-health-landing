using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>Consulta já enriquecida com dados do nutricionista e do usuário (saída do JOIN).</summary>
public sealed record ConsultationView(
    long Id,
    string Date,
    string Time,
    string NutritionistName,
    string NutritionistFocus,
    string Crn,
    string UserName);

/// <summary>
/// Repositório Dapper das consultas. Todas as queries são parametrizadas com
/// <c>@Parametro</c> (Regra 4 da AV2) — zero concatenação/interpolação de SQL.
/// </summary>
public sealed class ConsultationsRepository
{
    private readonly IDbConnectionFactory _factory;

    public ConsultationsRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CountActiveByUserAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            "SELECT COUNT(*) FROM consultations WHERE user_id = @UserId AND status = 'scheduled'";
        return await conn.ExecuteScalarAsync<int>(sql, new { UserId = userId });
    }

    public async Task<bool> IsSlotTakenAsync(string nutritionistId, DateOnly date, string time)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT COUNT(*) FROM consultations
              WHERE nutritionist_id = @NutritionistId
                AND date = @Date
                AND time = @Time
                AND status = 'scheduled'";
        var count = await conn.ExecuteScalarAsync<int>(
            sql, new { NutritionistId = nutritionistId, Date = date, Time = time });
        return count > 0;
    }

    public async Task<long> InsertAsync(long userId, string nutritionistId, DateOnly date, string time)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO consultations (user_id, nutritionist_id, date, time, status, created_at)
              VALUES (@UserId, @NutritionistId, @Date, @Time, 'scheduled', now())
              RETURNING id";
        return await conn.ExecuteScalarAsync<long>(
            sql, new { UserId = userId, NutritionistId = nutritionistId, Date = date, Time = time });
    }

    /// <summary>Cancela a consulta do usuário (status='cancelled') — devolve o crédito do plano.</summary>
    public async Task<int> CancelAsync(long id, long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"UPDATE consultations SET status = 'cancelled'
              WHERE id = @Id AND user_id = @UserId AND status = 'scheduled'";
        return await conn.ExecuteAsync(sql, new { Id = id, UserId = userId });
    }

    /// <summary>Endpoint com JOIN (Regra 2): consultations × nutritionists × users.</summary>
    public async Task<IEnumerable<ConsultationView>> GetByUserWithDetailsAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT c.id                            AS Id,
                     to_char(c.date, 'YYYY-MM-DD')   AS Date,
                     c.time                          AS Time,
                     n.name                          AS NutritionistName,
                     n.focus                         AS NutritionistFocus,
                     n.crn                           AS Crn,
                     u.name                          AS UserName
              FROM consultations c
              INNER JOIN nutritionists n ON n.id = c.nutritionist_id
              INNER JOIN users u         ON u.id = c.user_id
              WHERE c.user_id = @UserId
              ORDER BY c.date, c.time";
        return await conn.QueryAsync<ConsultationView>(sql, new { UserId = userId });
    }
}
