using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>Linha de <c>nutri_profiles</c> (espelha o NutriProfile do front).</summary>
public sealed record ProfileRow(
    string Sex,
    int Age,
    decimal HeightCm,
    decimal WeightKg,
    decimal? TargetKg,
    string Goal,
    string Activity,
    string Diet,
    int MealsPerDay,
    string? WakeTime,
    string? TrainTime,
    string? SleepTime);

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
                     meals_per_day AS MealsPerDay, wake_time AS WakeTime,
                     train_time AS TrainTime, sleep_time AS SleepTime
              FROM nutri_profiles WHERE user_id = @UserId";
        return await conn.QuerySingleOrDefaultAsync<ProfileRow>(sql, new { UserId = userId });
    }

    public async Task UpsertAsync(long userId, ProfileRow p)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO nutri_profiles
                  (user_id, sex, age, height_cm, weight_kg, target_kg, goal, activity, diet,
                   meals_per_day, wake_time, train_time, sleep_time)
              VALUES
                  (@UserId, @Sex, @Age, @HeightCm, @WeightKg, @TargetKg, @Goal, @Activity, @Diet,
                   @MealsPerDay, @WakeTime, @TrainTime, @SleepTime)
              ON CONFLICT (user_id) DO UPDATE SET
                  sex = @Sex, age = @Age, height_cm = @HeightCm, weight_kg = @WeightKg,
                  target_kg = @TargetKg, goal = @Goal, activity = @Activity, diet = @Diet,
                  meals_per_day = @MealsPerDay, wake_time = @WakeTime,
                  train_time = @TrainTime, sleep_time = @SleepTime";
        await conn.ExecuteAsync(sql, new
        {
            UserId = userId,
            p.Sex, p.Age, p.HeightCm, p.WeightKg, p.TargetKg, p.Goal,
            p.Activity, p.Diet, p.MealsPerDay, p.WakeTime, p.TrainTime, p.SleepTime,
        });
    }
}
