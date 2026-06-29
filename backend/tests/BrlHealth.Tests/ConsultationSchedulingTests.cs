using BrlHealth.Api.Services;
using Xunit;

namespace BrlHealth.Tests;

public class ConsultationSchedulingTests
{
    private static readonly string[] AnaSlots = ["08:00", "09:00", "10:00", "14:00", "15:00"];

    // 2026-06-29 é uma segunda-feira; usado como "hoje" para deixar os testes determinísticos.
    private static readonly DateOnly Today = new(2026, 6, 29);

    private static SchedulingRequest ValidRequest() =>
        new("ana-prado", new DateOnly(2026, 6, 30), "09:00"); // terça, dentro da agenda

    private static SchedulingContext ValidContext() =>
        new(ActiveConsultations: 0, PlanCredits: 1, SlotTaken: false, NutritionistSlots: AnaSlots, Today: Today);

    [Fact]
    public void AgendarConsulta_QuandoTudoValido_DeveRetornarValido()
    {
        // Arrange
        var request = ValidRequest();
        var context = ValidContext();

        // Act
        var result = ConsultationScheduling.Validate(request, context);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void AgendarConsulta_QuandoSemSaldoNoTier_DeveRetornar400()
    {
        // Arrange
        var request = ValidRequest();
        var context = ValidContext() with { ActiveConsultations = 1, PlanCredits = 1 };

        // Act
        var result = ConsultationScheduling.Validate(request, context);

        // Assert
        Assert.Contains("Sem saldo de consultas no seu plano.", result.Errors);
    }

    [Fact]
    public void AgendarConsulta_QuandoSlotOcupado_DeveRetornar400()
    {
        // Arrange
        var request = ValidRequest();
        var context = ValidContext() with { SlotTaken = true };

        // Act
        var result = ConsultationScheduling.Validate(request, context);

        // Assert
        Assert.Contains("Horário já ocupado para este nutricionista.", result.Errors);
    }

    [Fact]
    public void AgendarConsulta_QuandoDataEhDomingo_DeveRetornar400()
    {
        // Arrange
        var request = ValidRequest() with { Date = new DateOnly(2026, 7, 5) }; // domingo
        var context = ValidContext();

        // Act
        var result = ConsultationScheduling.Validate(request, context);

        // Assert
        Assert.Contains("Não há atendimento aos domingos.", result.Errors);
    }

    [Fact]
    public void AgendarConsulta_QuandoHorarioForaDaAgenda_DeveRetornar400()
    {
        // Arrange
        var request = ValidRequest() with { Time = "23:00" };
        var context = ValidContext();

        // Act
        var result = ConsultationScheduling.Validate(request, context);

        // Assert
        Assert.Contains("Horário fora da agenda do profissional.", result.Errors);
    }

    [Fact]
    public void AgendarConsulta_QuandoDataNoPassado_DeveRetornar400()
    {
        // Arrange
        var request = ValidRequest() with { Date = new DateOnly(2026, 6, 1) }; // antes de "hoje"
        var context = ValidContext();

        // Act
        var result = ConsultationScheduling.Validate(request, context);

        // Assert
        Assert.Contains("A data não pode estar no passado.", result.Errors);
    }
}
