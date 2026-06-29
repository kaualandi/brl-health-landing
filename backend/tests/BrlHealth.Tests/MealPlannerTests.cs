using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;
using Xunit;

namespace BrlHealth.Tests;

public class MealPlannerTests
{
    [Fact]
    public void DistribuirPorNumero_QuandoTresRefeicoes_AlmocoDeveTerQuarentaPorCento()
    {
        // Arrange
        var target = 2000;

        // Act
        var meals = MealPlanner.BuildByCount(target, 3);

        // Assert
        Assert.Equal(800, meals[1].Kcal); // Almoço = 40% de 2000
    }

    [Fact]
    public void DistribuirPorNumero_QuandoSeisRefeicoes_DeveProduzirSeisFatias()
    {
        // Arrange
        var target = 2200;

        // Act
        var meals = MealPlanner.BuildByCount(target, 6);

        // Assert
        Assert.Equal(6, meals.Count);
    }

    [Fact]
    public void DistribuirAgendadas_QuandoCafeEAlmoco_DevePonderarPeloPesoEOrdenarPorHorario()
    {
        // Arrange
        var schedule = new List<MealEntry> { new("Almoço", "12:00"), new("Café da manhã", "07:00") };

        // Act
        var meals = MealPlanner.BuildScheduled(schedule, 2000);

        // Assert
        Assert.Equal("Café da manhã", meals[0].Name); // ordenado por horário
        Assert.Equal(1130, meals[1].Kcal);            // Almoço (peso 1.3 de 2.3)
    }

    [Fact]
    public void Agendar_QuandoCafeDaManha_DeveFicarLogoAposAcordar()
    {
        // Arrange
        var meals = new List<MealEntry> { new("Café da manhã", "00:00") };
        var routine = new DailyRoutine("07:00", "23:00");

        // Act
        var scheduled = MealPlanner.AutoSchedule(meals, routine);

        // Assert
        Assert.Equal("07:30", scheduled[0].Time);
    }

    [Fact]
    public void Agendar_QuandoPreTreinoComHorarioDeTreino_DeveFicarUmaHoraAntes()
    {
        // Arrange
        var meals = new List<MealEntry> { new("Pré-treino", "00:00") };
        var routine = new DailyRoutine("07:00", "23:00", "18:00");

        // Act
        var scheduled = MealPlanner.AutoSchedule(meals, routine);

        // Assert
        Assert.Equal("17:00", scheduled[0].Time);
    }
}
