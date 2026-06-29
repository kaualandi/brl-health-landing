namespace BrlHealth.Api.Services;

public sealed record SchedulingRequest(string NutritionistId, DateOnly Date, string Time);

/// <summary>Fatos buscados no banco, usados pelas validações (mantém a regra pura).</summary>
public sealed record SchedulingContext(
    int ActiveConsultations,
    int PlanCredits,
    bool SlotTaken,
    IReadOnlyCollection<string> NutritionistSlots,
    DateOnly Today);

/// <summary>
/// Regra de negócio do agendamento de consulta — 5 validações antes do INSERT.
/// Cada falha vira um <c>400 Bad Request</c> com mensagem específica no endpoint.
/// Função pura: não toca no banco, então é testável sem infraestrutura.
/// </summary>
public static class ConsultationScheduling
{
    public static ValidationResult Validate(SchedulingRequest request, SchedulingContext context)
    {
        var errors = new List<string>();

        // 1. Saldo de consultas no tier (Free 1 / Pro 4 / Family 8).
        if (context.ActiveConsultations >= context.PlanCredits)
            errors.Add("Sem saldo de consultas no seu plano.");

        // 2. Slot livre — não pode haver outra consulta no mesmo horário.
        if (context.SlotTaken)
            errors.Add("Horário já ocupado para este nutricionista.");

        // 3. Não há atendimento aos domingos.
        if (request.Date.DayOfWeek == DayOfWeek.Sunday)
            errors.Add("Não há atendimento aos domingos.");

        // 4. Horário precisa estar dentro da agenda do profissional.
        if (!context.NutritionistSlots.Contains(request.Time))
            errors.Add("Horário fora da agenda do profissional.");

        // 5. Data não pode estar no passado.
        if (request.Date < context.Today)
            errors.Add("A data não pode estar no passado.");

        return errors.Count == 0 ? ValidationResult.Ok() : ValidationResult.Fail(errors);
    }
}
