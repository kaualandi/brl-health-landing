using Stripe;
using Stripe.Checkout;

namespace BrlHealth.Api.Services.Payments;

/// <summary>
/// Processa webhooks do Stripe. <see cref="Construct"/> verifica a assinatura
/// (HMAC com o webhook secret) — payload adulterado lança <see cref="StripeException"/>.
/// <see cref="TryGetActivation"/> é pura (testável sem rede): extrai o par
/// (userId, planId) de um <c>checkout.session.completed</c> para ativar a assinatura.
/// </summary>
public sealed class StripeWebhookProcessor
{
    public Event Construct(string json, string signatureHeader, string webhookSecret) =>
        EventUtility.ConstructEvent(json, signatureHeader, webhookSecret);

    public static bool TryGetActivation(Session? session, out long userId, out string planId)
    {
        userId = 0;
        planId = "";

        if (session?.Metadata is null)
            return false;
        if (!session.Metadata.TryGetValue("planId", out var pid) || string.IsNullOrWhiteSpace(pid))
            return false;
        if (!session.Metadata.TryGetValue("userId", out var uid) || !long.TryParse(uid, out userId))
            return false;

        planId = pid;
        return true;
    }
}
