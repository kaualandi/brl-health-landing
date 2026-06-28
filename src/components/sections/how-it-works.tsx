import { ArrowRightIcon } from "lucide-react";
import { Fragment } from "react";

import { AnimatedSection } from "@/components/animations/animated-section";

type Step = {
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    title: "Registra o treino",
    description: "Você faz o treino no BRL Fit, do jeito que já faz.",
  },
  {
    title: "Calcula o gasto",
    description: "O sistema calcula as calorias e o esforço daquela sessão.",
  },
  {
    title: "Ajusta a meta",
    description: "O BRL Nutri reage: sua meta do dia muda automaticamente.",
  },
  {
    title: "Sugere a refeição",
    description: "A IA fecha o ciclo com a próxima refeição certa pra você.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-it-works-title"
      className="relative border-y border-foreground/5 bg-foreground/5 py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-brl-orange uppercase">
            Como funciona
          </p>
          <h2
            id="how-it-works-title"
            className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl"
          >
            Um ciclo que fecha — sem você precisar pensar.
          </h2>
        </div>

        <AnimatedSection
          as="ol"
          className="mt-14 flex flex-col items-stretch gap-6 lg:flex-row lg:gap-2"
          translateY={60}
          duration={600}
          delay={120}
          ease="outBack"
        >
          {steps.map((step, index) => (
            <Fragment key={step.title}>
              <li className="flex flex-1 flex-col gap-3 rounded-2xl border border-foreground/5 bg-brl-card p-6">
                  <span
                    aria-hidden
                    className="font-display text-5xl font-extrabold text-brl-purple/20 md:text-6xl"
                  >
                    0{index + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              {index < steps.length - 1 ? (
                <div
                  aria-hidden
                  className="flex items-center justify-center self-center text-brl-purple/40"
                >
                  <ArrowRightIcon className="hidden size-6 lg:block" />
                  <ArrowRightIcon className="size-5 rotate-90 lg:hidden" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
