using BrlHealth.Api.Services;
using Xunit;

namespace BrlHealth.Tests;

public class PaymentTests
{
    [Fact]
    public void ValidarCartao_QuandoTerminaEm0000_DeveRecusar()
    {
        // Arrange
        var card = "4111 1111 1111 0000";

        // Act
        var result = Payment.ValidateCard(card);

        // Assert
        Assert.Contains("Pagamento recusado pelo emissor. Tente outro cartão.", result.Errors);
    }

    [Fact]
    public void ValidarCartao_QuandoNumeroValido_DeveAprovar()
    {
        // Arrange
        var card = "4111 1111 1111 1234";

        // Act
        var result = Payment.ValidateCard(card);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidarCartao_QuandoNumeroCurto_DeveRecusar()
    {
        // Arrange
        var card = "4111";

        // Act
        var result = Payment.ValidateCard(card);

        // Assert
        Assert.False(result.IsValid);
    }
}

public class AuthTokenTests
{
    [Fact]
    public void Token_QuandoCriadoEParseado_DeveRecuperarOUserId()
    {
        // Arrange
        var token = AuthToken.Create(42);

        // Act
        var ok = AuthToken.TryGetUserId(token, out var userId);

        // Assert
        Assert.True(ok && userId == 42);
    }

    [Fact]
    public void Token_QuandoMalformado_DeveFalhar()
    {
        // Arrange
        var token = "not-a-valid-token";

        // Act
        var ok = AuthToken.TryGetUserId(token, out _);

        // Assert
        Assert.False(ok);
    }
}

public class PasswordHasherTests
{
    [Fact]
    public void Senha_QuandoHashEVerificadaComAMesmaSenha_DeveBater()
    {
        // Arrange
        var hash = PasswordHasher.Hash("123456");

        // Act
        var ok = PasswordHasher.Verify("123456", hash);

        // Assert
        Assert.True(ok);
    }

    [Fact]
    public void Senha_QuandoSenhaErrada_DeveFalhar()
    {
        // Arrange
        var hash = PasswordHasher.Hash("123456");

        // Act
        var ok = PasswordHasher.Verify("senha-errada", hash);

        // Assert
        Assert.False(ok);
    }

    [Fact]
    public void Senha_QuandoHashPlaceholderDoSeed_DeveAceitarASenha()
    {
        // Arrange
        var stored = "$placeholder$123456";

        // Act
        var ok = PasswordHasher.Verify("123456", stored);

        // Assert
        Assert.True(ok);
    }
}
