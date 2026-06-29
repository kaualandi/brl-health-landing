using System.Text.RegularExpressions;
using BrlHealth.Api.Data;
using BrlHealth.Api.Services;
using BrlHealth.Api.Services.Email;

namespace BrlHealth.Api.Endpoints;

public sealed record LoginRequest(string Email, string Password);
public sealed record RegisterRequest(string Name, string Email, string Password);
public sealed record ForgotRequest(string Email);
public sealed record ResetRequest(string Token, string Password);
public sealed record VerifyRequest(string Code);
public sealed record RefreshRequest(string RefreshToken);

public static class AuthEndpoints
{
    public static void MapAuth(this WebApplication app)
    {
        // POST /auth/login — espelha auth.service.ts:loginUser
        app.MapPost("/auth/login", async (
            LoginRequest body, UsersRepository users,
            JwtTokenService jwt, JwtOptions options, RefreshTokensRepository refreshTokens) =>
        {
            var user = await users.FindByEmailAsync(body.Email);
            if (user is null || !PasswordHasher.Verify(body.Password, user.PasswordHash))
                return Results.Json(new { error = "Credenciais inválidas" }, statusCode: 401);

            // Migração transparente: re-hash de credencial legada (placeholder/PBKDF2) para BCrypt.
            if (PasswordHasher.NeedsUpgrade(user.PasswordHash))
                await users.UpdatePasswordHashAsync(user.Id, PasswordHasher.Hash(body.Password));

            return Results.Ok(await IssueSessionAsync(user.Id, user.Name, user.Email, jwt, options, refreshTokens));
        });

        // POST /auth/register — cria conta + assinatura Free e já abre sessão
        app.MapPost("/auth/register", async (
            RegisterRequest body, UsersRepository users, SubscriptionsRepository subscriptions,
            JwtTokenService jwt, JwtOptions options, RefreshTokensRepository refreshTokens) =>
        {
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                return Results.BadRequest(new { errors = new[] { "E-mail e senha são obrigatórios." } });

            if (await users.EmailExistsAsync(body.Email))
                return Results.BadRequest(new { errors = new[] { "E-mail já cadastrado." } });

            var id = await users.InsertAsync(body.Name, body.Email, PasswordHasher.Hash(body.Password));
            await subscriptions.InsertAsync(id, "free");

            var session = await IssueSessionAsync(id, body.Name, body.Email, jwt, options, refreshTokens);
            return Results.Created($"/users/{id}", session);
        });

        // POST /auth/refresh — rotaciona o refresh token e emite um novo access token
        app.MapPost("/auth/refresh", async (
            RefreshRequest body, UsersRepository users,
            JwtTokenService jwt, JwtOptions options, RefreshTokensRepository refreshTokens) =>
        {
            if (string.IsNullOrWhiteSpace(body.RefreshToken))
                return Unauthorized();

            var row = await refreshTokens.FindActiveAsync(RefreshTokens.Hash(body.RefreshToken));
            if (row is null)
                return Unauthorized();

            var user = await users.FindByIdAsync(row.UserId);
            if (user is null)
                return Unauthorized();

            // Rotação: revoga o token usado antes de emitir o novo par (single-use).
            await refreshTokens.RevokeAsync(row.Id);
            return Results.Ok(await IssueSessionAsync(user.Id, user.Name, user.Email, jwt, options, refreshTokens));
        });

        // POST /auth/logout — revoga o refresh token informado
        app.MapPost("/auth/logout", async (RefreshRequest body, RefreshTokensRepository refreshTokens) =>
        {
            if (!string.IsNullOrWhiteSpace(body.RefreshToken))
            {
                var row = await refreshTokens.FindActiveAsync(RefreshTokens.Hash(body.RefreshToken));
                if (row is not null)
                    await refreshTokens.RevokeAsync(row.Id);
            }

            return Results.Ok(new { message = "Sessão encerrada" });
        });

        // POST /auth/forgot — gera token de reset, envia por e-mail; resposta não revela cadastro
        app.MapPost("/auth/forgot", async (
            ForgotRequest body, UsersRepository users, EmailTokensRepository emailTokens,
            IEmailSender email, IConfiguration config) =>
        {
            var user = await users.FindByEmailAsync(body.Email ?? "");
            if (user is not null)
            {
                var token = EmailTokens.GenerateResetToken();
                await emailTokens.IssueAsync(user.Id, "reset", EmailTokens.Hash(token), DateTime.UtcNow.AddHours(1));

                var baseUrl = config["Cors:Origin"] ?? "http://localhost:3000";
                var link = $"{baseUrl}/redefinir-senha?token={token}";
                await email.SendAsync(user.Email, "Redefinição de senha — BRL Health",
                    $"Recebemos um pedido para redefinir sua senha. Use o link a seguir (expira em 1 hora): {link}");
            }

            return Results.Ok(new { message = "Se houver uma conta, enviamos um link de redefinição." });
        });

        // POST /auth/reset — valida o token, grava a nova senha (BCrypt) e encerra sessões abertas
        app.MapPost("/auth/reset", async (
            ResetRequest body, UsersRepository users,
            EmailTokensRepository emailTokens, RefreshTokensRepository refreshTokens) =>
        {
            if (string.IsNullOrWhiteSpace(body.Token) || string.IsNullOrWhiteSpace(body.Password))
                return Results.BadRequest(new { errors = new[] { "Link inválido ou expirado" } });

            var row = await emailTokens.FindActiveAsync("reset", EmailTokens.Hash(body.Token));
            if (row is null)
                return Results.BadRequest(new { errors = new[] { "Link inválido ou expirado" } });

            await users.UpdatePasswordHashAsync(row.UserId, PasswordHasher.Hash(body.Password));
            await emailTokens.ConsumeAsync(row.Id);
            await refreshTokens.RevokeAllForUserAsync(row.UserId);

            return Results.Ok(new { message = "Senha redefinida" });
        });

        // POST /auth/verify/resend — exige sessão; gera código de 6 dígitos e envia por e-mail
        app.MapPost("/auth/verify/resend", async (
            HttpContext ctx, UsersRepository users, EmailTokensRepository emailTokens, IEmailSender email) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Unauthorized();

            var user = await users.FindByIdAsync(userId);
            if (user is null)
                return Unauthorized();

            var code = EmailTokens.GenerateVerificationCode();
            await emailTokens.IssueAsync(userId, "verify", EmailTokens.Hash(code), DateTime.UtcNow.AddMinutes(15));
            await email.SendAsync(user.Email, "Seu código de verificação — BRL Health",
                $"Seu código de verificação é {code} (expira em 15 minutos).");

            return Results.Ok(new { message = "Enviamos um novo código para o seu e-mail." });
        });

        // POST /auth/verify — valida o código do usuário autenticado e marca o e-mail como verificado
        app.MapPost("/auth/verify", async (
            VerifyRequest body, HttpContext ctx, UsersRepository users, EmailTokensRepository emailTokens) =>
        {
            if (!ctx.TryGetUserId(out var userId))
                return Unauthorized();

            var code = body.Code?.Trim() ?? "";
            if (!Regex.IsMatch(code, @"^\d{6}$"))
                return Results.BadRequest(new { errors = new[] { "Código inválido. Confira os 6 dígitos." } });

            var row = await emailTokens.FindActiveForUserAsync(userId, "verify", EmailTokens.Hash(code));
            if (row is null)
                return Results.BadRequest(new { errors = new[] { "Código inválido ou expirado. Solicite um novo." } });

            await users.SetEmailVerifiedAsync(userId);
            await emailTokens.ConsumeAsync(row.Id);

            return Results.Ok(new { message = "E-mail verificado" });
        });
    }

    /// <summary>Emite o par access token (JWT) + refresh token e monta a resposta de sessão do front.</summary>
    private static async Task<object> IssueSessionAsync(
        long id, string name, string email,
        JwtTokenService jwt, JwtOptions options, RefreshTokensRepository refreshTokens)
    {
        var (accessToken, _) = jwt.CreateAccessToken(id, name, email);

        var refresh = RefreshTokens.Generate();
        await refreshTokens.InsertAsync(
            id, RefreshTokens.Hash(refresh), DateTime.UtcNow.AddDays(options.RefreshTokenDays));

        return new
        {
            user = new { id = id.ToString(), name, email },
            token = accessToken,
            refreshToken = refresh,
        };
    }

    private static IResult Unauthorized() =>
        Results.Json(new { error = "Sessão expirada. Faça login novamente." }, statusCode: 401);
}
