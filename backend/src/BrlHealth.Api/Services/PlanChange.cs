using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services;

public sealed record PlanChangeRequest(PlanId Target, string? CardNumber);

public sealed record PlanChangeContext(
    PlanId Current,
    bool TargetExists,
    int CurrentRank,
    int TargetRank,
    bool HasPendingCharge);

/// <summary>
/// Regra de negócio da mudança de plano — 2º endpoint de negócio da AV2, com 4
/// validações antes de gravar. Função pura (testável sem banco).
/// </summary>
public static class PlanChange
{
    public static ValidationResult Validate(PlanChangeRequest request, PlanChangeContext context)
    {
        var errors = new List<string>();

        // 1. Plano-alvo precisa existir.
        if (!context.TargetExists)
            errors.Add("Plano-alvo inexistente.");

        // 2. Plano-alvo não pode ser o atual.
        if (request.Target == context.Current)
            errors.Add("Você já está neste plano.");

        // 3. Upgrade exige cartão válido — número terminando em 0000 é recusado.
        var isUpgrade = context.TargetRank > context.CurrentRank;
        var digits = new string((request.CardNumber ?? string.Empty).Where(char.IsDigit).ToArray());
        if (isUpgrade && (digits.Length == 0 || digits.EndsWith("0000")))
            errors.Add("Pagamento recusado pelo emissor. Tente outro cartão.");

        // 4. Não pode haver cobrança pendente.
        if (context.HasPendingCharge)
            errors.Add("Há uma cobrança pendente. Regularize antes de mudar de plano.");

        return errors.Count == 0 ? ValidationResult.Ok() : ValidationResult.Fail(errors);
    }
}
