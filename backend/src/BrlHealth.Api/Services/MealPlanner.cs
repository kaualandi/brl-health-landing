using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services;

/// <summary>
/// Distribuição das refeições do dia — porta de <c>buildMeals</c> (nutri-plan.ts),
/// <c>buildScheduledMeals</c> e <c>autoScheduleMeals</c> (meals.ts). Lógica pura,
/// arredondamento espelha o <c>Math.round</c> do JS.
/// </summary>
public static class MealPlanner
{
    private static int JsRound(double v) => (int)Math.Floor(v + 0.5);
    private static int Round5(double v) => JsRound(v / 5) * 5;

    /// <summary>Repartição das calorias por número de refeições (3 / 4 / 5 / 6).</summary>
    private static readonly Dictionary<int, (string Name, double Ratio)[]> Templates = new()
    {
        [3] = [("Café da manhã", 0.30), ("Almoço", 0.40), ("Jantar", 0.30)],
        [4] = [("Café da manhã", 0.27), ("Almoço", 0.35), ("Lanche da tarde", 0.13), ("Jantar", 0.25)],
        [5] = [("Café da manhã", 0.24), ("Lanche da manhã", 0.10), ("Almoço", 0.31), ("Lanche da tarde", 0.12), ("Jantar", 0.23)],
        [6] = [("Café da manhã", 0.22), ("Lanche da manhã", 0.10), ("Almoço", 0.28), ("Lanche da tarde", 0.12), ("Jantar", 0.21), ("Ceia", 0.07)],
    };

    /// <summary>Peso relativo de cada refeição na distribuição (espelha MEAL_OPTIONS).</summary>
    private static readonly Dictionary<string, double> MealWeight = new()
    {
        ["Café da manhã"] = 1.0,
        ["Lanche da manhã"] = 0.5,
        ["Almoço"] = 1.3,
        ["Lanche da tarde"] = 0.5,
        ["Pré-treino"] = 0.4,
        ["Pós-treino"] = 0.6,
        ["Jantar"] = 1.2,
        ["Ceia"] = 0.4,
    };

    /// <summary>Distribui as calorias por número de refeições, usando o template.</summary>
    public static IReadOnlyList<MealSlice> BuildByCount(int targetCalories, int mealsPerDay)
    {
        var key = Templates.ContainsKey(mealsPerDay) ? mealsPerDay : Math.Clamp(mealsPerDay, 3, 6);
        var template = Templates.TryGetValue(key, out var t) ? t : Templates[3];
        return template
            .Select(m => new MealSlice { Name = m.Name, Kcal = Round5(targetCalories * m.Ratio) })
            .ToList();
    }

    /// <summary>Distribui as calorias entre as refeições escolhidas (por peso), ordenadas por horário.</summary>
    public static IReadOnlyList<MealSlice> BuildScheduled(IReadOnlyList<MealEntry> schedule, int targetCalories)
    {
        var ordered = schedule.OrderBy(m => m.Time, StringComparer.Ordinal).ToList();
        var totalWeight = ordered.Sum(m => MealWeight.GetValueOrDefault(m.Name, 1.0));
        if (totalWeight == 0) totalWeight = 1;

        return ordered
            .Select(m => new MealSlice
            {
                Name = m.Name,
                Time = m.Time,
                Kcal = Round5(targetCalories * MealWeight.GetValueOrDefault(m.Name, 1.0) / totalWeight),
            })
            .ToList();
    }

    /// <summary>
    /// Encaixa os horários das refeições na rotina: café gruda no acordar,
    /// jantar/ceia perto de dormir, pré/pós-treino ao redor do treino, lanches no meio.
    /// </summary>
    public static IReadOnlyList<MealEntry> AutoSchedule(IReadOnlyList<MealEntry> meals, DailyRoutine routine)
    {
        var wake = ToMinutes(routine.WakeTime);
        var sleep = ToMinutes(routine.SleepTime);
        if (sleep <= wake) sleep += 24 * 60; // dorme depois da meia-noite
        var span = sleep - wake;

        var cafe = wake + 30;
        var almoco = wake + JsRound(span * 0.34);
        var jantar = sleep - 150;
        var ceia = sleep - 45;

        int? train = null;
        if (!string.IsNullOrEmpty(routine.TrainTime))
        {
            var t = ToMinutes(routine.TrainTime);
            if (t < wake) t += 24 * 60; // treino noturno
            train = t;
        }

        var anchor = new Dictionary<string, int>
        {
            ["Café da manhã"] = cafe,
            ["Lanche da manhã"] = JsRound((cafe + almoco) / 2.0),
            ["Almoço"] = almoco,
            ["Lanche da tarde"] = JsRound((almoco + jantar) / 2.0),
            ["Jantar"] = jantar,
            ["Ceia"] = ceia,
        };

        var lo = wake + 10;
        var hi = sleep - 10;

        return meals.Select(meal =>
        {
            int? target = meal.Name switch
            {
                "Pré-treino" => train is int t1 ? t1 - 60 : null,
                "Pós-treino" => train is int t2 ? t2 + 45 : null,
                _ => anchor.TryGetValue(meal.Name, out var a) ? a : null,
            };

            if (target is not int minutes) return meal; // sem âncora → preserva o horário atual

            var clamped = Math.Min(Math.Max(minutes, lo), hi);
            return meal with { Time = ToClock(Round5(clamped)) };
        }).ToList();
    }

    private static int ToMinutes(string time)
    {
        var parts = time.Split(':');
        return int.Parse(parts[0]) * 60 + int.Parse(parts[1]);
    }

    private static string ToClock(int minutes)
    {
        var wrapped = ((minutes % 1440) + 1440) % 1440;
        return $"{wrapped / 60:D2}:{wrapped % 60:D2}";
    }
}
