import Link from "next/link";
import type { Metadata } from "next";
import {
  ActivityIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  DumbbellIcon,
  RefreshCwIcon,
  TimerIcon,
  TrendingUpIcon,
  TrophyIcon,
} from "lucide-react";

import { AnimatedSection } from "@/components/animations/animated-section";
import { OpenFitCta } from "@/components/fit/open-fit-cta";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

const TITLE = "BRL Fit — treino que evolui com você";
const DESCRIPTION =
  "Plano de treino gerado pelo seu perfil, 1.500 exercícios em português com GIF, registro com timer (até offline) e progresso. Comece grátis.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/fit" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/fit",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

const FEATURES = [
  {
    icon: ClipboardListIcon,
    title: "Plano gerado pelo seu perfil",
    text: "Objetivo, nível, dias por semana e equipamento viram um plano de treino pronto — em casa ou na academia.",
  },
  {
    icon: DumbbellIcon,
    title: "1.500 exercícios em português",
    text: "Biblioteca com GIF e passo a passo. Não curtiu um exercício? Troque por outro do mesmo grupo muscular.",
  },
  {
    icon: TimerIcon,
    title: "Registro com timer, até offline",
    text: "Marque séries, cargas e descanso durante o treino. Sem sinal, tudo fica salvo e sincroniza depois.",
  },
  {
    icon: TrophyIcon,
    title: "Progresso, recordes e conquistas",
    text: "Histórico de treinos, recordes pessoais e conquistas pra manter o ritmo lá em cima.",
  },
  {
    icon: TrendingUpIcon,
    title: "Progressão automática",
    pro: true,
    text: "O app sugere a próxima carga de cada exercício com base no que você fez — por regra, sem achismo.",
  },
  {
    icon: RefreshCwIcon,
    title: "Treino ajusta a meta do Nutri",
    pro: true,
    text: "Treinou hoje? Suas calorias e macros do BRL Nutri se ajustam ao gasto do treino.",
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
            Já disponível
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
            Treino que <span className="text-brl-orange">evolui</span> com
            você.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            O BRL Fit monta seu plano a partir do seu perfil, guia cada série e
            mostra sua evolução — e conversa com a sua nutrição no BRL Nutri.
          </p>

          <OpenFitCta />
        </div>
      </section>

      {/* O que você tem no Fit */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-brl-orange uppercase">
            O que você tem no Fit
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Tudo pra treinar com método.
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
                  {feature.pro && (
                    <span className="ml-2 rounded-full bg-brl-purple/20 px-2 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-brl-purple uppercase">
                      Pro
                    </span>
                  )}
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
                Treino e comida no mesmo time.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Use o BRL Nutri junto: com um plano alimentar do seu objetivo, o
                treino rende mais.
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
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Dados e GIFs dos exercícios: ExerciseDB.
        </p>
      </section>
    </div>
  );
}
