namespace BrlHealth.Api.Services.Email;

/// <summary>
/// Implementação de dev do <see cref="IEmailSender"/>: registra o e-mail no log
/// (assunto + corpo) em vez de enviar de verdade. Permite exercitar os fluxos de
/// reset de senha e verificação de e-mail ponta a ponta sem provedor externo.
/// </summary>
public sealed class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) => _logger = logger;

    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[email:dev] Para: {To}\n  Assunto: {Subject}\n  Corpo: {Body}", to, subject, body);
        return Task.CompletedTask;
    }
}
