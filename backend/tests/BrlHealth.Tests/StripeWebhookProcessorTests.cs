using BrlHealth.Api.Services.Payments;
using Stripe.Checkout;
using Xunit;

namespace BrlHealth.Tests;

public class StripeWebhookProcessorTests
{
    [Fact]
    public void Ativacao_QuandoSessionTemMetadata_DeveExtrairUserEPlano()
    {
        // Arrange
        var session = new Session
        {
            Metadata = new Dictionary<string, string> { ["userId"] = "42", ["planId"] = "pro" },
        };

        // Act
        var ok = StripeWebhookProcessor.TryGetActivation(session, out var userId, out var planId);

        // Assert
        Assert.True(ok && userId == 42 && planId == "pro");
    }

    [Fact]
    public void Ativacao_QuandoSemMetadata_DeveFalhar()
    {
        // Arrange
        var session = new Session { Metadata = null };

        // Act
        var ok = StripeWebhookProcessor.TryGetActivation(session, out _, out _);

        // Assert
        Assert.False(ok);
    }

    [Fact]
    public void Ativacao_QuandoUserIdNaoNumerico_DeveFalhar()
    {
        // Arrange
        var session = new Session
        {
            Metadata = new Dictionary<string, string> { ["userId"] = "abc", ["planId"] = "pro" },
        };

        // Act
        var ok = StripeWebhookProcessor.TryGetActivation(session, out _, out _);

        // Assert
        Assert.False(ok);
    }
}
