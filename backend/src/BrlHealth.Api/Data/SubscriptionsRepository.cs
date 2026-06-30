using Dapper;

namespace BrlHealth.Api.Data;

public sealed record PlanRow(string Id, int Rank, decimal MonthlyPrice, int Credits);

/// <summary>Assinatura atual do usuário, já com o rank do plano (saída de JOIN subscriptions × plans).</summary>
public sealed record SubscriptionRow(string PlanId, int Rank, bool HasPendingCharge);

/// <summary>
/// Repositório Dapper de planos e assinaturas. Queries 100% parametrizadas.
/// </summary>
public sealed class SubscriptionsRepository
{
    private readonly IDbConnectionFactory _factory;

    public SubscriptionsRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<PlanRow?> GetPlanAsync(string planId)
    {
        using var conn = _factory.Create();
        const string sql =
            "SELECT id AS Id, rank AS Rank, monthly_price AS MonthlyPrice, credits AS Credits FROM plans WHERE id = @PlanId";
        return await conn.QuerySingleOrDefaultAsync<PlanRow>(sql, new { PlanId = planId });
    }

    public async Task<SubscriptionRow?> GetSubscriptionAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT p.id                 AS PlanId,
                     p.rank               AS Rank,
                     s.has_pending_charge AS HasPendingCharge
              FROM subscriptions s
              INNER JOIN plans p ON p.id = s.plan_id
              WHERE s.user_id = @UserId";
        return await conn.QuerySingleOrDefaultAsync<SubscriptionRow>(sql, new { UserId = userId });
    }

    public async Task UpdatePlanAsync(long userId, string planId)
    {
        using var conn = _factory.Create();
        const string sql =
            "UPDATE subscriptions SET plan_id = @PlanId WHERE user_id = @UserId";
        await conn.ExecuteAsync(sql, new { UserId = userId, PlanId = planId });
    }

    /// <summary>Cria a assinatura inicial do usuário (usado no registro).</summary>
    public async Task InsertAsync(long userId, string planId)
    {
        using var conn = _factory.Create();
        const string sql =
            @"INSERT INTO subscriptions (user_id, plan_id, status, has_pending_charge)
              VALUES (@UserId, @PlanId, 'active', FALSE)
              ON CONFLICT (user_id) DO NOTHING";
        await conn.ExecuteAsync(sql, new { UserId = userId, PlanId = planId });
    }

    /// <summary>Ativa um plano pago após o pagamento (checkout): troca o plano, zera a pendência
    /// e guarda o id do Customer no Stripe (quando vier do webhook) para o portal de assinatura.</summary>
    public async Task ActivatePlanAsync(long userId, string planId, string? stripeCustomerId = null)
    {
        using var conn = _factory.Create();
        const string sql =
            @"UPDATE subscriptions
              SET plan_id = @PlanId, status = 'active', has_pending_charge = FALSE,
                  stripe_customer_id = COALESCE(@StripeCustomerId, stripe_customer_id)
              WHERE user_id = @UserId";
        await conn.ExecuteAsync(
            sql, new { UserId = userId, PlanId = planId, StripeCustomerId = stripeCustomerId });
    }

    /// <summary>Id do Customer no Stripe do usuário (null se nunca pagou via Stripe).</summary>
    public async Task<string?> GetStripeCustomerIdAsync(long userId)
    {
        using var conn = _factory.Create();
        const string sql = "SELECT stripe_customer_id FROM subscriptions WHERE user_id = @UserId";
        return await conn.QuerySingleOrDefaultAsync<string?>(sql, new { UserId = userId });
    }

    public async Task<PlanRow[]> GetAllPlansAsync()
    {
        using var conn = _factory.Create();
        const string sql =
            "SELECT id AS Id, rank AS Rank, monthly_price AS MonthlyPrice, credits AS Credits FROM plans ORDER BY rank";
        return (await conn.QueryAsync<PlanRow>(sql)).ToArray();
    }
}
