using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BrlHealth.Api.Endpoints;

/// <summary>
/// Lê o usuário autenticado a partir do principal já validado pelo middleware
/// JwtBearer (claim <c>sub</c>). Token ausente/inválido ⇒ principal sem a claim ⇒
/// o endpoint responde 401.
/// </summary>
public static class HttpAuth
{
    public static bool TryGetUserId(this HttpContext ctx, out long userId)
    {
        userId = 0;
        var sub = ctx.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(sub, out userId);
    }
}
