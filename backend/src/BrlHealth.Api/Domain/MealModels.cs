namespace BrlHealth.Api.Domain;

/// <summary>Uma fatia do cardápio do dia (nome, kcal e horário quando agendado).</summary>
public sealed record MealSlice
{
    public string Name { get; init; } = "";
    public int Kcal { get; init; }
    public string? Time { get; init; }
}

/// <summary>Refeição escolhida pelo usuário, com horário (HH:MM).</summary>
public sealed record MealEntry(string Name, string Time);

/// <summary>Rotina do dia — base para distribuir os horários das refeições.</summary>
public sealed record DailyRoutine(string WakeTime, string SleepTime, string? TrainTime = null);
