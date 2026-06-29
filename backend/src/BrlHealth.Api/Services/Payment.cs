namespace BrlHealth.Api.Services;

/// <summary>
/// Validação do "pagamento" (mock, espelha <c>billing.service.ts</c>): um número
/// de cartão terminando em 0000 é recusado pelo emissor.
/// </summary>
public static class Payment
{
    public static ValidationResult ValidateCard(string? cardNumber)
    {
        var digits = new string((cardNumber ?? string.Empty).Where(char.IsDigit).ToArray());

        if (digits.Length < 13)
            return ValidationResult.Fail(["Número de cartão inválido."]);

        if (digits.EndsWith("0000"))
            return ValidationResult.Fail(["Pagamento recusado pelo emissor. Tente outro cartão."]);

        return ValidationResult.Ok();
    }
}
