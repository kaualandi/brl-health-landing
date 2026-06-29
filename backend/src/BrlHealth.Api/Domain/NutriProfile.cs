namespace BrlHealth.Api.Domain;

/// <summary>
/// Perfil nutricional do usuário — entrada do motor de cálculo. Espelha o
/// <c>NutriProfile</c> do front (<c>src/types</c>).
/// </summary>
public sealed record NutriProfile
{
    public Sex Sex { get; init; }
    public int Age { get; init; }
    public double HeightCm { get; init; }
    public double WeightKg { get; init; }
    public ActivityLevel Activity { get; init; }
    public Goal Goal { get; init; }
    public int MealsPerDay { get; init; } = 3;
}
