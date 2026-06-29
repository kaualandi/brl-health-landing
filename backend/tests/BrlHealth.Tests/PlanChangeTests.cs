using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;
using Xunit;

namespace BrlHealth.Tests;

public class PlanChangeTests
{
    // Contexto base: assinante Free fazendo upgrade para Pro, sem cobrança pendente.
    private static PlanChangeContext UpgradeContext() =>
        new(Current: PlanId.Free, TargetExists: true, CurrentRank: 0, TargetRank: 1, HasPendingCharge: false);

    [Fact]
    public void MudarPlano_QuandoUpgradeComCartaoValido_DevePermitir()
    {
        // Arrange
        var request = new PlanChangeRequest(PlanId.Pro, "4111111111111111");
        var context = UpgradeContext();

        // Act
        var result = PlanChange.Validate(request, context);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void MudarPlano_QuandoCartaoTerminaEm0000_DeveRecusar()
    {
        // Arrange
        var request = new PlanChangeRequest(PlanId.Pro, "4111 1111 1111 0000");
        var context = UpgradeContext();

        // Act
        var result = PlanChange.Validate(request, context);

        // Assert
        Assert.Contains("Pagamento recusado pelo emissor. Tente outro cartão.", result.Errors);
    }

    [Fact]
    public void MudarPlano_QuandoAlvoIgualAoAtual_DeveRecusar()
    {
        // Arrange
        var request = new PlanChangeRequest(PlanId.Free, null);
        var context = UpgradeContext() with { TargetRank = 0 };

        // Act
        var result = PlanChange.Validate(request, context);

        // Assert
        Assert.Contains("Você já está neste plano.", result.Errors);
    }

    [Fact]
    public void MudarPlano_QuandoHaCobrancaPendente_DeveRecusar()
    {
        // Arrange
        var request = new PlanChangeRequest(PlanId.Pro, "4111111111111111");
        var context = UpgradeContext() with { HasPendingCharge = true };

        // Act
        var result = PlanChange.Validate(request, context);

        // Assert
        Assert.Contains("Há uma cobrança pendente. Regularize antes de mudar de plano.", result.Errors);
    }
}
