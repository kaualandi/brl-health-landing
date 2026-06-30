using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services.Menu;

/// <summary>
/// Gerador determinístico (sem IA, sem rede): transforma as fatias do plano
/// calculado em sugestões por tipo de refeição. É o default e também o
/// <b>fallback</b> da geração por IA quando o provedor falha ou não há chave.
/// </summary>
public sealed class LocalMenuGenerator : IMenuGenerator
{
    public Task<GeneratedMenu> GenerateAsync(
        NutriProfile profile, NutriPlan plan, MenuPreferences? preferences = null, CancellationToken ct = default)
    {
        var meals = plan.Meals
            .Select(m => new GeneratedMeal(m.Name, SuggestFor(m.Name), m.Kcal, m.Time))
            .ToList();

        var menu = new GeneratedMenu("local", meals,
            "Cardápio determinístico (sem IA). Defina OpenAI:ApiKey para sugestões geradas por IA.");
        return Task.FromResult(menu);
    }

    private static string SuggestFor(string mealName)
    {
        var name = mealName.ToLowerInvariant();
        if (name.Contains("café") || name.Contains("manhã"))
            return "Proteína (ovos/iogurte) + carbo integral (aveia/pão) + uma fruta.";
        if (name.Contains("almoço"))
            return "Proteína magra grelhada + carbo complexo (arroz/batata-doce) + vegetais à vontade.";
        if (name.Contains("lanche"))
            return "Fonte de proteína (iogurte/whey) + fruta ou oleaginosas.";
        if (name.Contains("jantar"))
            return "Proteína + vegetais + carbo moderado conforme o objetivo.";
        if (name.Contains("ceia"))
            return "Proteína de digestão lenta (iogurte/caseína) ou ovos.";
        return "Monte com proteína magra, carbo de qualidade e vegetais.";
    }
}
