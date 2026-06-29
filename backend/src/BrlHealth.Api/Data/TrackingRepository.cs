using Dapper;

namespace BrlHealth.Api.Data;

public sealed record WeightEntry(string Date, decimal Kg);
public sealed record SleepEntry(string Date, decimal Hours);
public sealed record StepEntry(string Date, int Count);
public sealed record MeasurementEntry(
    string Date, decimal? Waist, decimal? Hip, decimal? Chest, decimal? Arm, decimal? Thigh);

/// <summary>
/// Repositório Dapper do tracking diário. Escritas fazem upsert por
/// <c>(user_id, date)</c>; queries 100% parametrizadas.
/// </summary>
public sealed class TrackingRepository
{
    private readonly IDbConnectionFactory _factory;

    public TrackingRepository(IDbConnectionFactory factory) => _factory = factory;

    // --- Água (ml no dia) ---
    public async Task SetWaterAsync(long userId, DateOnly date, int ml)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO water_logs (user_id, date, ml) VALUES (@UserId, @Date, @Ml)
              ON CONFLICT (user_id, date) DO UPDATE SET ml = @Ml";
        await conn.ExecuteAsync(sql, new { UserId = userId, Date = date, Ml = ml });
    }

    public async Task<int> GetWaterAsync(long userId, DateOnly date)
    {
        using var conn = _factory.Create();
        const string sql = "SELECT COALESCE(ml, 0) FROM water_logs WHERE user_id = @UserId AND date = @Date";
        return await conn.ExecuteScalarAsync<int?>(sql, new { UserId = userId, Date = date }) ?? 0;
    }

    // --- Peso (histórico) ---
    public async Task AddWeightAsync(long userId, DateOnly date, decimal kg)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO weight_logs (user_id, date, weight_kg) VALUES (@UserId, @Date, @Kg)
              ON CONFLICT (user_id, date) DO UPDATE SET weight_kg = @Kg";
        await conn.ExecuteAsync(sql, new { UserId = userId, Date = date, Kg = kg });
    }

    public async Task<IEnumerable<WeightEntry>> GetWeightsAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT to_char(date, 'YYYY-MM-DD') AS Date, weight_kg AS Kg
              FROM weight_logs WHERE user_id = @UserId ORDER BY date";
        return await conn.QueryAsync<WeightEntry>(sql, new { UserId = userId });
    }

    // --- Sono (horas) ---
    public async Task SetSleepAsync(long userId, DateOnly date, decimal hours)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO sleep_logs (user_id, date, hours) VALUES (@UserId, @Date, @Hours)
              ON CONFLICT (user_id, date) DO UPDATE SET hours = @Hours";
        await conn.ExecuteAsync(sql, new { UserId = userId, Date = date, Hours = hours });
    }

    public async Task<IEnumerable<SleepEntry>> GetSleepAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT to_char(date, 'YYYY-MM-DD') AS Date, hours AS Hours
              FROM sleep_logs WHERE user_id = @UserId ORDER BY date";
        return await conn.QueryAsync<SleepEntry>(sql, new { UserId = userId });
    }

    // --- Passos (contagem) ---
    public async Task SetStepsAsync(long userId, DateOnly date, int count)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO step_logs (user_id, date, count) VALUES (@UserId, @Date, @Count)
              ON CONFLICT (user_id, date) DO UPDATE SET count = @Count";
        await conn.ExecuteAsync(sql, new { UserId = userId, Date = date, Count = count });
    }

    public async Task<IEnumerable<StepEntry>> GetStepsAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT to_char(date, 'YYYY-MM-DD') AS Date, count AS Count
              FROM step_logs WHERE user_id = @UserId ORDER BY date";
        return await conn.QueryAsync<StepEntry>(sql, new { UserId = userId });
    }

    // --- Medidas corporais (cm) ---
    public async Task UpsertMeasurementAsync(
        long userId, DateOnly date, decimal? waist, decimal? hip, decimal? chest, decimal? arm, decimal? thigh)
    {
        using var conn = _factory.Create();
        // COALESCE mantém medidas anteriores quando o registro do dia envia só algumas.
        const string sql =
            @"INSERT INTO measurements (user_id, date, waist, hip, chest, arm, thigh)
              VALUES (@UserId, @Date, @Waist, @Hip, @Chest, @Arm, @Thigh)
              ON CONFLICT (user_id, date) DO UPDATE SET
                  waist = COALESCE(@Waist, measurements.waist),
                  hip   = COALESCE(@Hip,   measurements.hip),
                  chest = COALESCE(@Chest, measurements.chest),
                  arm   = COALESCE(@Arm,   measurements.arm),
                  thigh = COALESCE(@Thigh, measurements.thigh)";
        await conn.ExecuteAsync(sql, new
        {
            UserId = userId, Date = date, Waist = waist, Hip = hip, Chest = chest, Arm = arm, Thigh = thigh,
        });
    }

    public async Task<IEnumerable<MeasurementEntry>> GetMeasurementsAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT to_char(date, 'YYYY-MM-DD') AS Date, waist AS Waist, hip AS Hip,
                     chest AS Chest, arm AS Arm, thigh AS Thigh
              FROM measurements WHERE user_id = @UserId ORDER BY date";
        return await conn.QueryAsync<MeasurementEntry>(sql, new { UserId = userId });
    }

    // --- Hábitos e diário de refeições (mapa item -> bool, JSONB) ---
    // SQL literal por tabela (sem interpolação) para respeitar a Regra 4 da AV2.
    public async Task SetHabitsAsync(long userId, DateOnly date, string doneJson)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO habit_logs (user_id, date, done) VALUES (@UserId, @Date, @Done::jsonb)
              ON CONFLICT (user_id, date) DO UPDATE SET done = @Done::jsonb";
        await conn.ExecuteAsync(sql, new { UserId = userId, Date = date, Done = doneJson });
    }

    public async Task<string> GetHabitsAsync(long userId, DateOnly date)
    {
        using var conn = _factory.Create();
        const string sql = "SELECT done::text FROM habit_logs WHERE user_id = @UserId AND date = @Date";
        return await conn.ExecuteScalarAsync<string?>(sql, new { UserId = userId, Date = date }) ?? "{}";
    }

    public async Task SetMealsAsync(long userId, DateOnly date, string doneJson)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO meal_logs (user_id, date, done) VALUES (@UserId, @Date, @Done::jsonb)
              ON CONFLICT (user_id, date) DO UPDATE SET done = @Done::jsonb";
        await conn.ExecuteAsync(sql, new { UserId = userId, Date = date, Done = doneJson });
    }

    public async Task<string> GetMealsAsync(long userId, DateOnly date)
    {
        using var conn = _factory.Create();
        const string sql = "SELECT done::text FROM meal_logs WHERE user_id = @UserId AND date = @Date";
        return await conn.ExecuteScalarAsync<string?>(sql, new { UserId = userId, Date = date }) ?? "{}";
    }
}
