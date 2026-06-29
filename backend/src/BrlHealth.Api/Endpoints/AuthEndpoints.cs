using BrlHealth.Api.Data;
using BrlHealth.Api.Services;

namespace BrlHealth.Api.Endpoints;

public sealed record LoginRequest(string Email, string Password);
public sealed record RegisterRequest(string Name, string Email, string Password);
public sealed record ForgotRequest(string Email);
public sealed record ResetRequest(string Token, string Password);
public sealed record VerifyRequest(string Code);

public static class AuthEndpoints
{
    public static void MapAuth(this WebApplication app)
    {
        // POST /auth/login — espelha auth.service.ts:loginUser
        app.MapPost("/auth/login", async (LoginRequest body, UsersRepository users) =>
        {
            var user = await users.FindByEmailAsync(body.Email);
            if (user is null || !PasswordHasher.Verify(body.Password, user.PasswordHash))
                return Results.Json(new { error = "Credenciais inválidas" }, statusCode: 401);

            return Results.Ok(AuthResponse(user.Id, user.Name, user.Email));
        });

        // POST /auth/register — cria conta + assinatura Free
        app.MapPost("/auth/register", async (
            RegisterRequest body, UsersRepository users, SubscriptionsRepository subscriptions) =>
        {
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                return Results.BadRequest(new { errors = new[] { "E-mail e senha são obrigatórios." } });

            if (await users.EmailExistsAsync(body.Email))
                return Results.BadRequest(new { errors = new[] { "E-mail já cadastrado." } });

            var id = await users.InsertAsync(body.Name, body.Email, PasswordHasher.Hash(body.Password));
            await subscriptions.InsertAsync(id, "free");

            return Results.Created($"/users/{id}", AuthResponse(id, body.Name, body.Email));
        });

        // POST /auth/forgot — não revela se o e-mail existe (privacidade)
        app.MapPost("/auth/forgot", (ForgotRequest _) =>
            Results.Ok(new { message = "Se houver uma conta, enviamos um link de redefinição." }));

        // POST /auth/reset
        app.MapPost("/auth/reset", (ResetRequest body) =>
            string.IsNullOrWhiteSpace(body.Token)
                ? Results.BadRequest(new { errors = new[] { "Link inválido ou expirado" } })
                : Results.Ok(new { message = "Senha redefinida" }));

        // POST /auth/verify/resend
        app.MapPost("/auth/verify/resend", (ForgotRequest _) =>
            Results.Ok(new { message = "Enviamos um novo código para o seu e-mail." }));

        // POST /auth/verify — código de 6 dígitos; marca o e-mail do usuário autenticado
        app.MapPost("/auth/verify", async (VerifyRequest body, HttpContext ctx, UsersRepository users) =>
        {
            if (!System.Text.RegularExpressions.Regex.IsMatch(body.Code.Trim(), @"^\d{6}$"))
                return Results.BadRequest(new { errors = new[] { "Código inválido. Confira os 6 dígitos." } });

            if (ctx.TryGetUserId(out var userId))
                await users.SetEmailVerifiedAsync(userId);

            return Results.Ok(new { message = "E-mail verificado" });
        });
    }

    private static object AuthResponse(long id, string name, string email) => new
    {
        user = new { id = id.ToString(), name, email },
        token = AuthToken.Create(id),
    };
}
