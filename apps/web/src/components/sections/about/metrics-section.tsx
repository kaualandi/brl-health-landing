import { AnimatedCounter } from "@/components/animations/animated-counter";

type Metric = {
  value: number | string;
  numeric: boolean;
  label: string;
};

const metrics: Metric[] = [
  { value: 2, numeric: true, label: "Apps no ecossistema" },
  { value: 1, numeric: true, label: "Objetivo: sua saúde" },
  { value: "∞", numeric: false, label: "Possibilidades de evolução" },
];

export function MetricsSection() {
  return (
    <section
      aria-labelledby="metrics-title"
      className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28"
    >
      <h2 id="metrics-title" className="sr-only">
        Números da BRL
      </h2>
      <dl className="grid gap-10 rounded-2xl border border-foreground/5 bg-brl-card/60 p-10 md:grid-cols-3 md:gap-6 md:p-12">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col items-center text-center"
          >
            <dt className="order-2 mt-3 text-sm text-brl-muted md:text-base">
              {metric.label}
            </dt>
            <dd className="order-1 font-display text-6xl font-extrabold tracking-tight text-brl-purple md:text-7xl">
              {metric.numeric ? (
                <AnimatedCounter to={metric.value as number} />
              ) : (
                metric.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
