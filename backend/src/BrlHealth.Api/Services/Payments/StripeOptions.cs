namespace BrlHealth.Api.Services.Payments;

/// <summary>
/// Configuração do Stripe (seção <c>Stripe</c>). Todas as chaves vêm de
/// ambiente/secrets — nunca do código. Em produção, use a chave (idealmente
/// <b>restrita</b>) na env; em dev/validação, use chaves de <b>teste</b>
/// (<c>sk_test_</c>/<c>pk_test_</c>).
/// </summary>
public sealed class StripeOptions
{
    public string SecretKey { get; set; } = "";
    public string PublishableKey { get; set; } = "";
    public string WebhookSecret { get; set; } = "";
    public string SuccessUrl { get; set; } = "http://localhost:3000/conta?checkout=success";
    public string CancelUrl { get; set; } = "http://localhost:3000/precos?checkout=cancel";
    public string Currency { get; set; } = "brl";

    /// <summary>True quando há chave secreta — habilita o gateway real; senão, gateway desabilitado.</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(SecretKey);
}
