using Hangfire;

namespace BrlHealth.Api.Services.Email;

/// <summary>
/// Enfileira o envio via Hangfire: agenda a chamada a <see cref="IEmailSender.SendAsync"/>
/// num worker em background (com retry automático). O <see cref="IEmailSender"/> é
/// resolvido do DI na hora de executar — então o provedor real (§7) entra sem
/// tocar nos endpoints.
/// </summary>
public sealed class HangfireEmailQueue : IEmailQueue
{
    private readonly IBackgroundJobClient _jobs;

    public HangfireEmailQueue(IBackgroundJobClient jobs) => _jobs = jobs;

    public void Enqueue(string to, string subject, string body) =>
        _jobs.Enqueue<IEmailSender>(sender => sender.SendAsync(to, subject, body, CancellationToken.None));
}
