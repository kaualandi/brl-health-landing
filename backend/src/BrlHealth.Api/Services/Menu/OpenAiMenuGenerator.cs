using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BrlHealth.Api.Domain;

namespace BrlHealth.Api.Services.Menu;

/// <summary>Configuração da IA de cardápio (seção <c>OpenAI</c>). Chave só via ambiente/secrets.</summary>
public sealed class OpenAiOptions
{
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gpt-4o-mini";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
}

/// <summary>
/// Geração de cardápio por LLM (OpenAI/ChatGPT) atrás do <see cref="IMenuGenerator"/>.
/// Monta o prompt a partir do plano (alvos de kcal/macros) e pede JSON. Qualquer
/// falha (rede, parsing, sem chave) cai no <see cref="LocalMenuGenerator"/> — o
/// endpoint nunca quebra por causa da IA.
/// </summary>
public sealed class OpenAiMenuGenerator : IMenuGenerator
{
    private readonly HttpClient _http;
    private readonly OpenAiOptions _options;
    private readonly LocalMenuGenerator _fallback;
    private readonly ILogger<OpenAiMenuGenerator> _logger;

    public OpenAiMenuGenerator(
        HttpClient http, OpenAiOptions options, LocalMenuGenerator fallback, ILogger<OpenAiMenuGenerator> logger)
    {
        _http = http;
        _options = options;
        _fallback = fallback;
        _logger = logger;
    }

    public async Task<GeneratedMenu> GenerateAsync(NutriProfile profile, NutriPlan plan, CancellationToken ct = default)
    {
        try
        {
            var request = new
            {
                model = _options.Model,
                response_format = new { type = "json_object" },
                messages = new object[]
                {
                    new { role = "system", content = "Você é um nutricionista. Responda exclusivamente com JSON válido." },
                    new { role = "user", content = BuildPrompt(profile, plan) },
                },
            };

            using var msg = new HttpRequestMessage(HttpMethod.Post, $"{_options.BaseUrl}/chat/completions")
            {
                Content = JsonContent.Create(request),
            };
            msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            using var resp = await _http.SendAsync(msg, ct);
            resp.EnsureSuccessStatusCode();

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var content = doc.RootElement
                .GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

            var meals = ParseMeals(content);
            return meals.Count > 0
                ? new GeneratedMenu("openai", meals)
                : await _fallback.GenerateAsync(profile, plan, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao gerar cardápio por IA; usando fallback local.");
            return await _fallback.GenerateAsync(profile, plan, ct);
        }
    }

    private static string BuildPrompt(NutriProfile profile, NutriPlan plan) =>
        $"Monte um cardápio de 1 dia com {profile.MealsPerDay} refeições para o objetivo '{profile.Goal}'. " +
        $"Alvos diários: {plan.TargetCalories} kcal, {plan.Protein}g de proteína, {plan.Carbs}g de carboidrato, " +
        $"{plan.Fat}g de gordura. Responda em JSON no formato " +
        "{\"meals\":[{\"name\":\"...\",\"suggestion\":\"...\",\"kcal\":000,\"time\":\"HH:MM\"}]}.";

    private static List<GeneratedMeal> ParseMeals(string json)
    {
        var result = new List<GeneratedMeal>();
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("meals", out var meals) || meals.ValueKind != JsonValueKind.Array)
            return result;

        foreach (var m in meals.EnumerateArray())
        {
            var name = m.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var suggestion = m.TryGetProperty("suggestion", out var s) ? s.GetString() ?? "" : "";
            var kcal = m.TryGetProperty("kcal", out var k) && k.TryGetInt32(out var kv) ? kv : 0;
            var time = m.TryGetProperty("time", out var t) ? t.GetString() : null;
            result.Add(new GeneratedMeal(name, suggestion, kcal, time));
        }

        return result;
    }
}
