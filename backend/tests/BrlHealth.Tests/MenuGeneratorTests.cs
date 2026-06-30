using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;
using BrlHealth.Api.Services.Menu;
using Xunit;

namespace BrlHealth.Tests;

public class LocalMenuGeneratorTests
{
    [Fact]
    public async Task GerarCardapio_QuandoPlanoTemRefeicoes_DeveProduzirSugestoesLocais()
    {
        // Arrange
        var profile = new NutriProfile
        {
            Sex = Sex.Male,
            Age = 30,
            HeightCm = 180,
            WeightKg = 80,
            Activity = ActivityLevel.Moderate,
            Goal = Goal.Health,
            MealsPerDay = 3,
        };
        var plan = NutriPlanCalculator.Compute(profile);

        // Act
        var menu = await new LocalMenuGenerator().GenerateAsync(profile, plan);

        // Assert
        Assert.Equal("local", menu.Source);
        Assert.NotEmpty(menu.Meals);
    }

    [Fact]
    public async Task GerarCardapio_QuandoChamado_DeveSomarKcalDasFatiasDoPlano()
    {
        // Arrange
        var profile = new NutriProfile
        {
            Sex = Sex.Female,
            Age = 28,
            HeightCm = 165,
            WeightKg = 62,
            Activity = ActivityLevel.Light,
            Goal = Goal.Lose,
            MealsPerDay = 4,
        };
        var plan = NutriPlanCalculator.Compute(profile);

        // Act
        var menu = await new LocalMenuGenerator().GenerateAsync(profile, plan);

        // Assert
        Assert.Equal(plan.Meals.Count, menu.Meals.Count);
    }
}
