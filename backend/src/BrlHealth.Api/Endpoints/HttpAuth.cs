using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

/// <summary>Lê o usuário autenticado do header <c>Authorization: Bearer &lt;token&gt;</c>.</summary>
public static class HttpAuth
{
    public static bool TryGetUserId(this HttpContext ctx, out long userId)
    {
        var header = ctx.Request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        var token = header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? header[prefix.Length..]
            : header;
        return AuthToken.TryGetUserId(token, out userId);
    }
}
