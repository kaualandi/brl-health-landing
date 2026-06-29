using System.Security.Cryptography;
using System.Text;

namespace BrlHealth.Api.Services;

/// <summary>
/// Refresh token <b>opaco</b> de alta entropia (256 bits, base64url). No banco
/// guardamos apenas o hash SHA-256 — o valor em claro só existe no cliente —, então
/// um vazamento da tabela não permite reuso. A rotação (revogar o antigo + emitir
/// novo a cada <c>/auth/refresh</c>) fica no endpoint.
/// </summary>
public static class RefreshTokens
{
    /// <summary>Gera um novo refresh token em claro (entregue ao cliente).</summary>
    public static string Generate() =>
        Base64Url(RandomNumberGenerator.GetBytes(32));

    /// <summary>Hash determinístico (SHA-256, hex) usado como chave de busca no banco.</summary>
    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
