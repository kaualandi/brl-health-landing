namespace BrlHealth.Api.Domain;

/// <summary>Uma refeição sugerida no cardápio gerado (ideia + alvo calórico).</summary>
public sealed record GeneratedMeal(string Name, string Suggestion, int Kcal, string? Time = null);

/// <summary>
/// Cardápio do dia gerado para o perfil. <see cref="Source"/> indica qual motor
/// produziu (<c>local</c> determinístico ou <c>openai</c>), para o cliente saber
/// a procedência.
/// </summary>
public sealed record GeneratedMenu(string Source, IReadOnlyList<GeneratedMeal> Meals, string? Note = null);
