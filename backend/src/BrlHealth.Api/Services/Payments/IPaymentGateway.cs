using BrlHealth.Api.Data;

namespace BrlHealth.Api.Services.Payments;

/// <summary>Sessão de checkout criada — URL para redirecionar o cliente + id da sessão.</summary>
public sealed record CheckoutSession(string Url, string SessionId);

/// <summary>
/// Gateway de pagamento (abstração para não acoplar a API ao Stripe). A
/// implementação real é <see cref="StripePaymentGateway"/>; sem chave configurada,
/// entra <see cref="DisabledPaymentGateway"/> e o endpoint responde 501.
/// </summary>
public interface IPaymentGateway
{
    bool IsConfigured { get; }

    Task<CheckoutSession> CreateCheckoutAsync(
        long userId, string userEmail, PlanRow plan, CancellationToken ct = default);

    /// <summary>Cria uma sessão do Customer Portal para o cliente gerenciar a própria assinatura.</summary>
    Task<string> CreatePortalSessionAsync(string customerId, CancellationToken ct = default);
}

/// <summary>Sem chave Stripe: o pagamento fica indisponível (o endpoint trata via <see cref="IsConfigured"/>).</summary>
public sealed class DisabledPaymentGateway : IPaymentGateway
{
    public bool IsConfigured => false;

    public Task<CheckoutSession> CreateCheckoutAsync(
        long userId, string userEmail, PlanRow plan, CancellationToken ct = default) =>
        throw new InvalidOperationException("Stripe não configurado (defina Stripe:SecretKey).");

    public Task<string> CreatePortalSessionAsync(string customerId, CancellationToken ct = default) =>
        throw new InvalidOperationException("Stripe não configurado (defina Stripe:SecretKey).");
}
