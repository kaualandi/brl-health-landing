using Npgsql;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace BrlHealth.Api.Services;

/// <summary>
/// OpenTelemetry (§7): tracing + métricas com instrumentação de ASP.NET Core,
/// HttpClient e Npgsql. Em dev, sem coletor configurado, usa o <b>console exporter</b>
/// (spans visíveis no stdout) — então dá pra validar localmente. Defina
/// <c>Otel:Endpoint</c> (ou env <c>Otel__Endpoint</c>) para exportar via OTLP a um
/// coletor (Jaeger/Tempo/Grafana, etc.).
/// </summary>
public static class Telemetry
{
    public static IServiceCollection AddBrlTelemetry(this IServiceCollection services, IConfiguration config)
    {
        var otlpEndpoint = config["Otel:Endpoint"];
        var hasOtlp = !string.IsNullOrWhiteSpace(otlpEndpoint);

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(serviceName: "brl-health-api"))
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddNpgsql();

                if (hasOtlp)
                    tracing.AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint!));
                else
                    tracing.AddConsoleExporter();
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation();

                if (hasOtlp)
                    metrics.AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint!));
                else
                    metrics.AddConsoleExporter();
            });

        return services;
    }
}
