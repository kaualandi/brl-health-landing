namespace BrlHealth.Api.Domain;

/// <summary>
/// Plano nutricional calculado — saída do <see cref="Services.NutriPlanCalculator"/>.
/// </summary>
public sealed record NutriPlan
{
    public int Bmr { get; init; }
    public int Tdee { get; init; }
    public int TargetCalories { get; init; }
    public int Protein { get; init; }
    public int Carbs { get; init; }
    public int Fat { get; init; }
    public int WaterMl { get; init; }
    public double Bmi { get; init; }
    public string BmiLabel { get; init; } = "";
}
