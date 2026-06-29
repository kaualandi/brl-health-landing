namespace BrlHealth.Api.Services;

/// <summary>Resultado de uma validação de regra de negócio.</summary>
public sealed record ValidationResult(bool IsValid, IReadOnlyList<string> Errors)
{
    private static readonly IReadOnlyList<string> None = Array.Empty<string>();

    public static ValidationResult Ok() => new(true, None);

    public static ValidationResult Fail(IReadOnlyList<string> errors) => new(false, errors);
}
