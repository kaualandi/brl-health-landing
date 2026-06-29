using System.Security.Cryptography;
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

public class JwtTokenServiceTests
{
    private static JwtOptions Options(string secret) => new()
    {
        Secret = secret,
        Issuer = "brl-health",
        Audience = "brl-health-app",
        AccessTokenMinutes = 15,
    };

    [Fact]
    public void CriarToken_QuandoValidadoComAMesmaChave_DeveRecuperarOUserId()
    {
        // Arrange
        var jwt = new JwtTokenService(Options("test-secret-com-pelo-menos-32-bytes-aqui!!"));
        var (token, _) = jwt.CreateAccessToken(42, "Demo", "demo@brl.com");

        // Act
        var ok = jwt.TryGetUserId(token, out var userId);

        // Assert
        Assert.True(ok && userId == 42);
    }

    [Fact]
    public void ValidarToken_QuandoChaveDiferente_DeveFalhar()
    {
        // Arrange
        var issuer = new JwtTokenService(Options("test-secret-com-pelo-menos-32-bytes-aqui!!"));
        var attacker = new JwtTokenService(Options("OUTRO-secret-com-pelo-menos-32-bytes-aaa!!"));
        var (token, _) = issuer.CreateAccessToken(42, "Demo", "demo@brl.com");

        // Act
        var ok = attacker.TryGetUserId(token, out _);

        // Assert
        Assert.False(ok);
    }

    [Fact]
    public void ValidarToken_QuandoMalformado_DeveFalhar()
    {
        // Arrange
        var jwt = new JwtTokenService(Options("test-secret-com-pelo-menos-32-bytes-aqui!!"));

        // Act
        var ok = jwt.TryGetUserId("not-a-jwt", out _);

        // Assert
        Assert.False(ok);
    }

    [Fact]
    public void CriarServico_QuandoSegredoCurto_DeveLancar()
    {
        // Arrange
        var options = Options("curto");

        // Act
        var ex = Record.Exception(() => new JwtTokenService(options));

        // Assert
        Assert.IsType<InvalidOperationException>(ex);
    }
}

public class RefreshTokensTests
{
    [Fact]
    public void Hash_QuandoMesmoToken_DeveSerDeterministico()
    {
        // Arrange
        var token = RefreshTokens.Generate();

        // Act
        var a = RefreshTokens.Hash(token);
        var b = RefreshTokens.Hash(token);

        // Assert
        Assert.Equal(a, b);
    }

    [Fact]
    public void Gerar_QuandoChamadoDuasVezes_DeveProduzirTokensDiferentes()
    {
        // Arrange
        var first = RefreshTokens.Generate();

        // Act
        var second = RefreshTokens.Generate();

        // Assert
        Assert.NotEqual(first, second);
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
    public void Senha_QuandoHashAtualEhBcrypt_NaoDevePrecisarMigrar()
    {
        // Arrange
        var hash = PasswordHasher.Hash("123456");

        // Act
        var precisa = PasswordHasher.NeedsUpgrade(hash);

        // Assert
        Assert.False(precisa);
    }

    [Fact]
    public void Senha_QuandoHashPlaceholderDoSeed_DeveAceitarASenhaEPedirMigracao()
    {
        // Arrange
        var stored = "$placeholder$123456";

        // Act
        var ok = PasswordHasher.Verify("123456", stored);

        // Assert
        Assert.True(ok && PasswordHasher.NeedsUpgrade(stored));
    }

    [Fact]
    public void Senha_QuandoHashLegadoPbkdf2_DeveContinuarValidando()
    {
        // Arrange
        var legacy = LegacyPbkdf2("123456");

        // Act
        var ok = PasswordHasher.Verify("123456", legacy);

        // Assert
        Assert.True(ok && PasswordHasher.NeedsUpgrade(legacy));
    }

    // Reproduz o formato de hash PBKDF2 anterior à migração para BCrypt (pbkdf2$iter$salt$key).
    private static string LegacyPbkdf2(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var key = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"pbkdf2$100000${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }
}
