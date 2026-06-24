import Link from "next/link";
import type { Metadata } from "next";
import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarCheckIcon,
  DumbbellIcon,
  RefreshCwIcon,
  TrendingUpIcon,
} from "lucide-react";

import { AnimatedSection } from "@/components/animations/animated-section";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "BRL Fit — treinos adaptativos (em breve)",
  description:
    "O BRL Fit está chegando: treinos que se adaptam ao seu progresso e conversam com a sua nutrição. Entre na lista de espera.",
};

const FEATURES = [
  {
    icon: DumbbellIcon,
    title: "Treinos adaptativos",
    text: "Séries e cargas que evoluem com você, ajustadas a cada semana de progresso.",
  },
  {
    icon: RefreshCwIcon,
    title: "Integração com o Nutri",
    text: "Treinou pesado? Suas metas de calorias e macros do dia se ajustam sozinhas.",
  },
  {
    icon: TrendingUpIcon,
    title: "Progressão automática",
    text: "Sobrecarga progressiva no piloto automático — sem planilha, sem achismo.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Rotina que cabe na sua vida",
    text: "De 2 a 6 dias por semana, em casa ou na academia. Você escolhe o ritmo.",
  },
];

export default function FitPage() {
  return (
    <div className="bg-brl-dark">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(50% 40% at 50% 0%, rgba(255,137,6,0.12) 0%, rgba(13,13,26,0) 70%)",
          }}
        />
        <div className="mx-auto w-full max-w-3xl px-4 text-center md:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-brl-orange/30 bg-brl-orange/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brl-orange uppercase">
            <ActivityIcon className="size-3.5" />
            Em breve
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
            O <span className="text-brl-orange">BRL Fit</span> está
            esquentando.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Treinos que se adaptam ao seu progresso e conversam com a sua
            nutrição. Quando treino e comida jogam no mesmo time, o resultado
            vem mais rápido.
          </p>

          <div className="mx-auto mt-9 max-w-md">
            <WaitlistForm source="fit" cta="Entrar na lista" />
            <p className="mt-3 text-xs text-muted-foreground">
              Sem spam. Só um aviso quando liberar — prometido.
            </p>
          </div>
        </div>
      </section>

      {/* O que vem aí */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-brl-orange uppercase">
            O que vem aí
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Não é mais um app de treino.
          </h2>
        </div>

        <AnimatedSection
          className="mt-12 grid gap-5 sm:grid-cols-2"
          translateY={28}
          duration={500}
          delay={80}
        >
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="flex gap-4 rounded-2xl border border-white/5 bg-brl-card p-6 md:p-7"
            >
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brl-orange/15 text-brl-orange"
              >
                <feature.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            </article>
          ))}
        </AnimatedSection>
      </section>

      {/* Enquanto isso */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-6 md:pb-28">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/5 p-8 md:p-12"
          style={{
            background:
              "linear-gradient(135deg, #13131f 0%, rgba(150,86,161,0.22) 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-brl-purple/15 blur-3xl"
          />
          <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                Enquanto o Fit não chega, comece pela comida.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Monte seu plano alimentar personalizado no BRL Nutri agora — e
                já chega na musculação com a nutrição em dia.
              </p>
            </div>
            <Button
              size="lg"
              nativeButton={false}
              className="h-12 shrink-0 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
              render={
                <Link href="/cadastro">
                  Montar meu plano
                  <ArrowRightIcon />
                </Link>
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
