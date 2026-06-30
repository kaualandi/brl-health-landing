using BrlHealth.Api.Data;
using BrlHealth.Api.Services.Payments;
using Stripe;
using Stripe.Checkout;

namespace BrlHealth.Api.Endpoints;

public sealed record StripeCheckoutRequest(string PlanId);

/// <summary>
/// Endpoints do Stripe: config pública (pro Stripe.js), criação de checkout
/// (autenticado) e webhook (chamado pelo Stripe). O webhook é a fonte da verdade
/// do pagamento — só ele ativa o plano, após verificar a assinatura.
/// </summary>
public static class StripeEndpoints
{
    public static void MapStripe(this WebApplication app)
    {
        // GET /billing/stripe/config — chave pública para o Stripe.js do front.
        app.MapGet("/billing/stripe/config", (StripeOptions options) =>
            Results.Ok(new { publishableKey = options.PublishableKey, configured = options.IsConfigured }));

        // POST /billing/stripe/checkout — cria a Checkout Session e devolve a URL.
        app.MapPost("/billing/stripe/checkout", async (
            StripeCheckoutRequest body, HttpContext ctx, IPaymentGateway gateway,
            SubscriptionsRepository subscriptions, UsersRepository users) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();
            if (!gateway.IsConfigured)
                return Results.Json(new { error = "Pagamento não configurado." }, statusCode: 501);

            var plan = await subscriptions.GetPlanAsync(body.PlanId);
            if (plan is null || plan.Rank == 0)
                return Results.BadRequest(new { errors = new[] { "Plano inválido para checkout." } });

            var user = await users.FindByIdAsync(userId);
            if (user is null)
                return Results.Unauthorized();

            var session = await gateway.CreateCheckoutAsync(userId, user.Email, plan);
            return Results.Ok(new { url = session.Url, sessionId = session.SessionId });
        });

        // POST /billing/stripe/portal — abre o Customer Portal do Stripe (gerir/cancelar assinatura).
        app.MapPost("/billing/stripe/portal", async (
            HttpContext ctx, IPaymentGateway gateway, SubscriptionsRepository subscriptions,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("StripePortal");

            if (!ctx.TryGetUserId(out var userId))
                return Results.Unauthorized();
            if (!gateway.IsConfigured)
                return Results.Json(new { error = "Pagamento não configurado." }, statusCode: 501);

            var customerId = await subscriptions.GetStripeCustomerIdAsync(userId);
            if (string.IsNullOrWhiteSpace(customerId))
                return Results.BadRequest(new { errors = new[] { "Nenhuma assinatura paga para gerenciar." } });

            try
            {
                var url = await gateway.CreatePortalSessionAsync(customerId);
                return Results.Ok(new { url });
            }
            catch (StripeException ex)
            {
                logger.LogError(ex, "Falha ao abrir o Customer Portal do Stripe.");
                return Results.Json(new { error = "Não foi possível abrir o portal de assinatura." }, statusCode: 502);
            }
        });

        // POST /billing/stripe/webhook — verifica a assinatura e ativa o plano no pagamento.
        app.MapPost("/billing/stripe/webhook", async (
            HttpContext ctx, StripeOptions options, StripeWebhookProcessor processor,
            SubscriptionsRepository subscriptions, ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("StripeWebhook");
            var json = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
            var signature = ctx.Request.Headers["Stripe-Signature"].ToString();

            try
            {
                var stripeEvent = processor.Construct(json, signature, options.WebhookSecret);

                if (stripeEvent.Type == "checkout.session.completed"
                    && stripeEvent.Data.Object is Session session
                    && StripeWebhookProcessor.TryGetActivation(session, out var uid, out var pid))
                {
                    // Guarda o Customer do Stripe (vem na sessão) para habilitar o portal de assinatura.
                    await subscriptions.ActivatePlanAsync(uid, pid, session.CustomerId);
                    logger.LogInformation("Stripe: plano {Plan} ativado para o usuário {User}.", pid, uid);
                }

                return Results.Ok();
            }
            catch (StripeException ex)
            {
                logger.LogWarning(ex, "Webhook Stripe rejeitado (assinatura inválida).");
                return Results.BadRequest();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Erro ao processar webhook Stripe.");
                return Results.StatusCode(500);
            }
        });
    }
}
