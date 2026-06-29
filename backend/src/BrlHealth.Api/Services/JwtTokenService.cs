using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace BrlHealth.Api.Services;

/// <summary>Configuração do JWT (seção <c>Jwt</c>). O segredo vem da config/ambiente — nunca do código.</summary>
public sealed class JwtOptions
{
    public string Secret { get; set; } = "";
    public string Issuer { get; set; } = "brl-health";
    public string Audience { get; set; } = "brl-health-app";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 30;
}

/// <summary>
/// Emissão e validação do <b>access token</b> JWT (HS256). Substitui o token opaco
/// da fase mock (dívida DT-03). Claims: <c>sub</c> (id do usuário), <c>name</c>,
/// <c>email</c> e <c>jti</c>; expira em <see cref="JwtOptions.AccessTokenMinutes"/>.
/// A rotação de credencial fica a cargo do refresh token (ver <see cref="RefreshTokens"/>).
/// </summary>
public sealed class JwtTokenService
{
    private readonly JwtOptions _options;
    private readonly SymmetricSecurityKey _key;

    public JwtTokenService(JwtOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Secret) || Encoding.UTF8.GetByteCount(options.Secret) < 32)
            throw new InvalidOperationException(
                "Jwt:Secret ausente ou curto (HS256 exige >= 256 bits). Defina via config/ambiente.");

        _options = options;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Secret));
    }

    /// <summary>Cria o access token assinado e devolve também o instante de expiração.</summary>
    public (string Token, DateTime ExpiresAt) CreateAccessToken(long userId, string name, string email)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, name),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    /// <summary>Parâmetros usados tanto pelo middleware JwtBearer quanto pela validação em teste.</summary>
    public TokenValidationParameters ValidationParameters => new()
    {
        ValidateIssuer = true,
        ValidIssuer = _options.Issuer,
        ValidateAudience = true,
        ValidAudience = _options.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = _key,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
    };

    /// <summary>Valida o token e extrai o id do usuário (<c>sub</c>). Usado nos testes sem o middleware.</summary>
    public bool TryGetUserId(string token, out long userId)
    {
        userId = 0;
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        try
        {
            var principal = handler.ValidateToken(token, ValidationParameters, out _);
            var sub = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            return long.TryParse(sub, out userId);
        }
        catch (Exception)
        {
            return false;
        }
    }
}
