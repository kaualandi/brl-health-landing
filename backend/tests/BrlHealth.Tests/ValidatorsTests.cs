using BrlHealth.Api.Endpoints;
using BrlHealth.Api.Validation;
using Xunit;

namespace BrlHealth.Tests;

public class RegisterValidatorTests
{
    [Fact]
    public void Registro_QuandoCamposValidos_DeveSerValido()
    {
        // Arrange
        var req = new RegisterRequest("Fulano", "fulano@brl.com", "senha123");

        // Act
        var result = new RegisterRequestValidator().Validate(req);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Registro_QuandoEmailInvalido_DeveFalhar()
    {
        // Arrange
        var req = new RegisterRequest("Fulano", "isso-nao-e-email", "senha123");

        // Act
        var result = new RegisterRequestValidator().Validate(req);

        // Assert
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Registro_QuandoSenhaCurta_DeveFalhar()
    {
        // Arrange
        var req = new RegisterRequest("Fulano", "fulano@brl.com", "123");

        // Act
        var result = new RegisterRequestValidator().Validate(req);

        // Assert
        Assert.False(result.IsValid);
    }
}

public class LoginValidatorTests
{
    [Fact]
    public void Login_QuandoEmailVazio_DeveFalhar()
    {
        // Arrange
        var req = new LoginRequest("", "senha123");

        // Act
        var result = new LoginRequestValidator().Validate(req);

        // Assert
        Assert.False(result.IsValid);
    }
}

public class ResetValidatorTests
{
    [Fact]
    public void Reset_QuandoSemToken_DeveFalhar()
    {
        // Arrange
        var req = new ResetRequest("", "senhaNova1");

        // Act
        var result = new ResetRequestValidator().Validate(req);

        // Assert
        Assert.False(result.IsValid);
    }
}

public class ConsentValidatorTests
{
    [Fact]
    public void Consentimento_QuandoDocumentoVazio_DeveFalhar()
    {
        // Arrange
        var req = new ConsentRequest("", "2026-06-01");

        // Act
        var result = new ConsentRequestValidator().Validate(req);

        // Assert
        Assert.False(result.IsValid);
    }
}
