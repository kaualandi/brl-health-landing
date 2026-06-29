using BrlHealth.Api.Domain;
using BrlHealth.Api.Services;
using Xunit;

namespace BrlHealth.Tests;

public class NutriPlanCalculatorTests
{
    // Perfil base: homem, 30 anos, 180 cm, 80 kg, atividade moderada, perder gordura.
    private static NutriProfile BaseProfile() => new()
    {
        Sex = Sex.Male,
        Age = 30,
        HeightCm = 180,
        WeightKg = 80,
        Activity = ActivityLevel.Moderate,
        Goal = Goal.Lose,
        MealsPerDay = 3,
    };

    [Fact]
    public void CalcularPlano_QuandoSexoMasculino_DeveSomarCincoNaFormulaDeBmr()
    {
        // Arrange
        var profile = BaseProfile();

        // Act
        var plan = NutriPlanCalculator.Compute(profile);

        // Assert
        Assert.Equal(1780, plan.Bmr);
    }

    [Fact]
    public void CalcularPlano_QuandoSexoFeminino_DeveSubtrairCentoSessentaEUmNoBmr()
    {
        // Arrange
        var profile = BaseProfile() with { Sex = Sex.Female };

        // Act
        var plan = NutriPlanCalculator.Compute(profile);

        // Assert
        Assert.Equal(1614, plan.Bmr);
    }

    [Fact]
    public void CalcularPlano_QuandoObjetivoPerderGordura_DeveAplicarDeficitCalorico()
    {
        // Arrange
        var profile = BaseProfile();

        // Act
        var plan = NutriPlanCalculator.Compute(profile);

        // Assert
        Assert.Equal(2260, plan.TargetCalories);
    }

    [Fact]
    public void CalcularPlano_QuandoImcAcimaDeTrinta_DeveClassificarComoObesidade()
    {
        // Arrange
        var profile = BaseProfile() with { WeightKg = 110, HeightCm = 170 };

        // Act
        var plan = NutriPlanCalculator.Compute(profile);

        // Assert
        Assert.Equal("Obesidade", plan.BmiLabel);
    }

    [Fact]
    public void CalcularPlano_QuandoImcNaFaixaNormal_DeveClassificarComoPesoSaudavel()
    {
        // Arrange
        var profile = BaseProfile();

        // Act
        var plan = NutriPlanCalculator.Compute(profile);

        // Assert
        Assert.Equal("Peso saudável", plan.BmiLabel);
    }

    [Fact]
    public void CalcularPlano_DeveDefinirMetaDeAguaDeTrintaECincoMlPorKg()
    {
        // Arrange
        var profile = BaseProfile();

        // Act
        var plan = NutriPlanCalculator.Compute(profile);

        // Assert
        Assert.Equal(2800, plan.WaterMl);
    }
}
