using System.Text;

namespace BrlHealth.Api.Services;

/// <summary>
/// Token de sessão opaco e simples (mirror dos mocks). Carrega o id do usuário.
/// Não é assinado nem expira — autenticação real (JWT + refresh token) é pós-AV2
/// (dívida DT-03). Um token malformado falha o parse → o endpoint responde 401.
/// </summary>
public static class AuthToken
{
    public static string Create(long userId)
    {
        var raw = $"v1:{userId}:{Guid.NewGuid():N}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    public static bool TryGetUserId(string? token, out long userId)
    {
        userId = 0;
        if (string.IsNullOrWhiteSpace(token))
            return false;

        try
        {
            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = raw.Split(':');
            return parts.Length >= 2 && parts[0] == "v1" && long.TryParse(parts[1], out userId);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
