namespace BrlHealth.Api.Services.Email;

/// <summary>
/// Enfileira o envio de e-mail para processamento em background, tirando a latência
/// (e a falha) do provedor do caminho da requisição. A implementação
/// (<see cref="HangfireEmailQueue"/>) agenda a chamada ao <see cref="IEmailSender"/>
/// num worker, com retry automático.
/// </summary>
public interface IEmailQueue
{
    void Enqueue(string to, string subject, string body);
}
