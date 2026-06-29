using System.Threading.RateLimiting;

namespace BrlHealth.Api.Endpoints;

/// <summary>
/// Rate limiting por IP. Um teto global de defesa em profundidade e uma política
/// estrita <see cref="AuthPolicy"/> aplicada a <c>/auth/*</c> para mitigar
/// brute-force em login/registro/reset (dívida DT-02). Excedido ⇒ <c>429</c> com
/// corpo JSON e header <c>Retry-After</c>.
/// </summary>
public static class RateLimiting
{
    public const string AuthPolicy = "auth";

    public static IServiceCollection AddBrlRateLimiter(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Teto global por IP (defesa em profundidade).
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetFixedWindowLimiter(ClientIp(ctx), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                }));

            // Política estrita para os endpoints de autenticação.
            options.AddPolicy(AuthPolicy, ctx =>
                RateLimitPartition.GetFixedWindowLimiter(ClientIp(ctx), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                }));

            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.Headers.RetryAfter = "60";
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { error = "Muitas requisições. Tente novamente em instantes." }, token);
            };
        });

    private static string ClientIp(HttpContext ctx) =>
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
