using System.Security.Cryptography;
using System.Text;

namespace BrlHealth.Api.Services;

/// <summary>
/// Geração e hash dos tokens enviados por e-mail. Dois formatos:
/// <list type="bullet">
/// <item>reset de senha — token opaco de alta entropia (vai no link);</item>
/// <item>verificação de e-mail — código de 6 dígitos (digitável).</item>
/// </list>
/// Em ambos só o hash SHA-256 é persistido (tabela <c>email_tokens</c>).
/// </summary>
public static class EmailTokens
{
    public static string GenerateResetToken() =>
        Base64Url(RandomNumberGenerator.GetBytes(32));

    public static string GenerateVerificationCode() =>
        RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    public static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
