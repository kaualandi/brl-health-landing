using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BrlHealth.Api.Services.Email;

/// <summary>Configuração do Resend (seção <c>Resend</c>). A chave só vem de ambiente/secrets.</summary>
public sealed class ResendOptions
{
    public string ApiKey { get; set; } = "";
    /// <summary>Remetente — endereço do domínio verificado no Resend (envia para qualquer destinatário).</summary>
    public string From { get; set; } = "BRL Health <nao-responda@email.kaualf.com>";
    public string BaseUrl { get; set; } = "https://api.resend.com";
}

/// <summary>
/// Envio de e-mail transacional via <b>Resend</b> (HTTP API), atrás do
/// <see cref="IEmailSender"/>. Usado quando há <c>Resend:ApiKey</c>; sem chave, o
/// app cai no <see cref="ConsoleEmailSender"/>. Combinado com a fila Hangfire
/// (<see cref="IEmailQueue"/>), uma falha transitória do provedor vira retry.
/// </summary>
public sealed class ResendEmailSender : IEmailSender
{
    private readonly HttpClient _http;
    private readonly ResendOptions _options;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(HttpClient http, ResendOptions options, ILogger<ResendEmailSender> logger)
    {
        _http = http;
        _options = options;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        var payload = new { from = _options.From, to = new[] { to }, subject, text = body };

        using var msg = new HttpRequestMessage(HttpMethod.Post, $"{_options.BaseUrl}/emails")
        {
            Content = JsonContent.Create(payload),
        };
        msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        using var resp = await _http.SendAsync(msg, ct);
        var responseBody = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("Resend falhou ({Status}): {Body}", (int)resp.StatusCode, responseBody);
            throw new HttpRequestException($"Resend retornou {(int)resp.StatusCode}");
        }

        _logger.LogInformation("E-mail enviado via Resend para {To} (id {Id})", to, TryGetId(responseBody));
    }

    private static string TryGetId(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.TryGetProperty("id", out var id) ? id.GetString() ?? "?" : "?";
        }
        catch (JsonException)
        {
            return "?";
        }
    }
}
