namespace BrlHealth.Api.Services.Menu;

/// <summary>
/// Preferências que orientam a geração do cardápio (além dos alvos calóricos):
/// estilo de dieta e restrições alimentares. Passadas ao prompt da IA para que o
/// cardápio respeite, p.ex., vegano/sem lactose.
/// </summary>
public sealed record MenuPreferences(string? Diet = null, IReadOnlyList<string>? Restrictions = null)
{
    public static readonly MenuPreferences None = new();
}
