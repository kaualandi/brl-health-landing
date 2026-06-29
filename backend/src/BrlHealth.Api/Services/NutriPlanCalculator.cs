using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services;

/// <summary>
/// Motor de cálculo nutricional no servidor — porta de <c>src/lib/nutri-plan.ts</c>.
/// BMR por Mifflin-St Jeor, TDEE pelo nível de atividade, ajuste por objetivo,
/// macros, água e IMC. Regra de negócio pura (não-CRUD), alvo dos testes AAA.
/// </summary>
public static class NutriPlanCalculator
{
    private static readonly Dictionary<ActivityLevel, double> ActivityFactor = new()
    {
        [ActivityLevel.Sedentary] = 1.2,
        [ActivityLevel.Light] = 1.375,
        [ActivityLevel.Moderate] = 1.55,
        [ActivityLevel.Active] = 1.725,
        [ActivityLevel.Athlete] = 1.9,
    };

    private static readonly Dictionary<Goal, double> GoalAdjust = new()
    {
        [Goal.Lose] = -0.18,
        [Goal.Recomp] = -0.05,
        [Goal.Gain] = 0.12,
        [Goal.Performance] = 0.08,
        [Goal.Health] = 0.0,
    };

    private static readonly Dictionary<Goal, double> ProteinPerKg = new()
    {
        [Goal.Lose] = 2.0,
        [Goal.Recomp] = 1.9,
        [Goal.Gain] = 1.8,
        [Goal.Performance] = 1.8,
        [Goal.Health] = 1.6,
    };

    /// <summary>
    /// Replica o <c>Math.round</c> do JavaScript (meio para cima), que difere do
    /// arredondamento bancário padrão do .NET — garante paridade com o front.
    /// </summary>
    private static int JsRound(double value) => (int)Math.Floor(value + 0.5);

    public static NutriPlan Compute(NutriProfile profile)
    {
        var bmr = profile.Sex == Sex.Male
            ? 10 * profile.WeightKg + 6.25 * profile.HeightCm - 5 * profile.Age + 5
            : 10 * profile.WeightKg + 6.25 * profile.HeightCm - 5 * profile.Age - 161;

        var tdee = bmr * ActivityFactor[profile.Activity];
        var targetRaw = tdee * (1 + GoalAdjust[profile.Goal]);
        var targetCalories = JsRound(targetRaw / 10) * 10;

        var protein = JsRound(ProteinPerKg[profile.Goal] * profile.WeightKg);
        var proteinKcal = protein * 4;
        var fatKcal = targetCalories * 0.27;
        var fat = JsRound(fatKcal / 9);
        var carbsKcal = Math.Max(targetCalories - proteinKcal - fatKcal, 0);
        var carbs = JsRound(carbsKcal / 4);

        var waterMl = JsRound(profile.WeightKg * 35.0 / 50) * 50;

        var heightM = profile.HeightCm / 100.0;
        var bmiRaw = profile.WeightKg / (heightM * heightM);
        var bmi = Math.Floor(bmiRaw * 10 + 0.5) / 10;

        return new NutriPlan
        {
            Bmr = JsRound(bmr),
            Tdee = JsRound(tdee),
            TargetCalories = targetCalories,
            Protein = protein,
            Carbs = carbs,
            Fat = fat,
            WaterMl = waterMl,
            Bmi = bmi,
            BmiLabel = ClassifyBmi(bmi),
        };
    }

    private static string ClassifyBmi(double bmi)
    {
        if (bmi < 18.5) return "Abaixo do peso";
        if (bmi < 25) return "Peso saudável";
        if (bmi < 30) return "Sobrepeso";
        return "Obesidade";
    }
}
