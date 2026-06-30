using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>
/// Linha de <c>nutri_profiles</c> (espelha o NutriProfile do front). Classe com
/// <c>get;set;</c> (não record posicional) porque o Dapper materializa colunas
/// <c>text[]</c> (que chegam como <c>System.Array</c>) por propriedade, sem o
/// casamento estrito do construtor. <c>Meals</c> é o JSON cru da coluna jsonb.
/// </summary>
public sealed class ProfileRow
{
    public string Sex { get; set; } = "";
    public int Age { get; set; }
    public decimal HeightCm { get; set; }
    public decimal WeightKg { get; set; }
    public decimal? TargetKg { get; set; }
    public string Goal { get; set; } = "";
    public string Activity { get; set; } = "";
    public string Diet { get; set; } = "";
    public string[] Restrictions { get; set; } = [];
    public int MealsPerDay { get; set; }
    public int WaterGlasses { get; set; }
    /// <summary>JSON cru das refeições (array de {name,time}) — coluna jsonb.</summary>
    public string Meals { get; set; } = "[]";
    public string? WakeTime { get; set; }
    public string? TrainTime { get; set; }
    public string? SleepTime { get; set; }
}

public sealed class ProfilesRepository
{
    private readonly IDbConnectionFactory _factory;

    public ProfilesRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<ProfileRow?> GetAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT sex AS Sex, age AS Age, height_cm AS HeightCm, weight_kg AS WeightKg,
                     target_kg AS TargetKg, goal AS Goal, activity AS Activity, diet AS Diet,
                     restrictions AS Restrictions, meals_per_day AS MealsPerDay,
                     water_glasses AS WaterGlasses, meals::text AS Meals,
                     wake_time AS WakeTime, train_time AS TrainTime, sleep_time AS SleepTime
              FROM nutri_profiles WHERE user_id = @UserId";
        return await conn.QuerySingleOrDefaultAsync<ProfileRow>(sql, new { UserId = userId });
    }

    public async Task UpsertAsync(long userId, ProfileRow p)
    {
        using var conn = _factory.Create();
        // @Meals é o JSON cru (string) → cast explícito p/ jsonb; @Restrictions é text[].
        const string sql =
            @"INSERT INTO nutri_profiles
                  (user_id, sex, age, height_cm, weight_kg, target_kg, goal, activity, diet,
                   restrictions, meals_per_day, water_glasses, meals,
                   wake_time, train_time, sleep_time)
              VALUES
                  (@UserId, @Sex, @Age, @HeightCm, @WeightKg, @TargetKg, @Goal, @Activity, @Diet,
                   @Restrictions, @MealsPerDay, @WaterGlasses, @Meals::jsonb,
                   @WakeTime, @TrainTime, @SleepTime)
              ON CONFLICT (user_id) DO UPDATE SET
                  sex = @Sex, age = @Age, height_cm = @HeightCm, weight_kg = @WeightKg,
                  target_kg = @TargetKg, goal = @Goal, activity = @Activity, diet = @Diet,
                  restrictions = @Restrictions, meals_per_day = @MealsPerDay,
                  water_glasses = @WaterGlasses, meals = @Meals::jsonb,
                  wake_time = @WakeTime, train_time = @TrainTime, sleep_time = @SleepTime";
        await conn.ExecuteAsync(sql, new
        {
            UserId = userId,
            p.Sex, p.Age, p.HeightCm, p.WeightKg, p.TargetKg, p.Goal,
            p.Activity, p.Diet, p.Restrictions, p.MealsPerDay, p.WaterGlasses,
            p.Meals, p.WakeTime, p.TrainTime, p.SleepTime,
        });
    }
}
