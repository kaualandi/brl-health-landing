using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services.Menu;

/// <summary>
/// Gera o cardápio do dia a partir do perfil + plano calculado. Provider-agnóstico:
/// a implementação default (<see cref="LocalMenuGenerator"/>) é determinística e não
/// depende de rede; quando há chave configurada, entra a geração por LLM
/// (<see cref="OpenAiMenuGenerator"/>) atrás do mesmo contrato.
/// </summary>
public interface IMenuGenerator
{
    Task<GeneratedMenu> GenerateAsync(
        NutriProfile profile, NutriPlan plan, MenuPreferences? preferences = null, CancellationToken ct = default);
}
