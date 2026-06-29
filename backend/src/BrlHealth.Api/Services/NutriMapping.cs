using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services;

/// <summary>Conversão dos rótulos do front (string) para os enums do domínio.</summary>
public static class NutriMapping
{
    public static Sex ParseSex(string value) => value == "male" ? Sex.Male : Sex.Female;

    public static ActivityLevel ParseActivity(string value) => value switch
    {
        "sedentary" => ActivityLevel.Sedentary,
        "light" => ActivityLevel.Light,
        "moderate" => ActivityLevel.Moderate,
        "active" => ActivityLevel.Active,
        "athlete" => ActivityLevel.Athlete,
        _ => ActivityLevel.Sedentary,
    };

    public static Goal ParseGoal(string value) => value switch
    {
        "lose" => Goal.Lose,
        "recomp" => Goal.Recomp,
        "gain" => Goal.Gain,
        "performance" => Goal.Performance,
        "health" => Goal.Health,
        _ => Goal.Health,
    };
}
