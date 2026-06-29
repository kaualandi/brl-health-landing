namespace BrlHealth.Api.Services.Email;

/// <summary>
/// Abstração de envio de e-mail transacional. Em dev usamos
/// <see cref="ConsoleEmailSender"/> (loga no console); em produção (§7) o mesmo
/// contrato recebe um provedor real (MailKit/SES, SendGrid…) sem tocar nos endpoints.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}
