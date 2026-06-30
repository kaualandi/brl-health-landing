using BrlHealth.Api.Data;
using Stripe;
using Stripe.Checkout;

namespace BrlHealth.Api.Services.Payments;

/// <summary>
/// Gateway Stripe (Stripe.net). Cria uma <b>Checkout Session</b> de assinatura
/// mensal com preço inline (a partir do <c>monthly_price</c> do plano), carregando
/// <c>userId</c>/<c>planId</c> em metadata — o webhook usa isso para ativar o plano.
/// A chave vai por <see cref="RequestOptions"/> (sem estado global).
/// </summary>
public sealed class StripePaymentGateway : IPaymentGateway
{
    private readonly StripeOptions _options;

    public StripePaymentGateway(StripeOptions options) => _options = options;

    public bool IsConfigured => _options.IsConfigured;

    public async Task<CheckoutSession> CreateCheckoutAsync(
        long userId, string userEmail, PlanRow plan, CancellationToken ct = default)
    {
        var createOptions = new SessionCreateOptions
        {
            Mode = "subscription",
            CustomerEmail = userEmail,
            SuccessUrl = _options.SuccessUrl,
            CancelUrl = _options.CancelUrl,
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = _options.Currency,
                        UnitAmount = (long)(plan.MonthlyPrice * 100m),
                        Recurring = new SessionLineItemPriceDataRecurringOptions { Interval = "month" },
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"BRL Health — plano {plan.Id}",
                        },
                    },
                },
            ],
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = userId.ToString(),
                ["planId"] = plan.Id,
            },
        };

        var session = await new SessionService().CreateAsync(
            createOptions, new RequestOptions { ApiKey = _options.SecretKey }, ct);

        return new CheckoutSession(session.Url, session.Id);
    }

    public async Task<string> CreatePortalSessionAsync(string customerId, CancellationToken ct = default)
    {
        var createOptions = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = _options.PortalReturnUrl,
        };

        var session = await new Stripe.BillingPortal.SessionService().CreateAsync(
            createOptions, new RequestOptions { ApiKey = _options.SecretKey }, ct);

        return session.Url;
    }
}
