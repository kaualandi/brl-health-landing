"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";

import { AnimatedSection } from "@/components/animations/animated-section";
import {
  BillingToggle,
  resolvePlanPrice,
  type BillingCycle,
} from "@/components/plan/billing-toggle";
import { Button } from "@/components/ui/button";
import { getPlans } from "@/services/plans.service";
import type { Plan } from "@/types";
import { cn } from "@/lib/utils";

function PlanCard({ plan, cycle }: { plan: Plan; cycle: BillingCycle }) {
  const price = resolvePlanPrice(plan, cycle);
  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-6 rounded-2xl border bg-brl-card p-8 transition-colors",
        plan.highlighted
          ? "border-brl-purple/40 shadow-[0_0_0_1px_rgba(150,86,161,0.6)] lg:-translate-y-4 lg:scale-[1.02]"
          : "border-foreground/5",
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brl-purple px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
          Mais popular
        </span>
      ) : null}

      <header className="flex flex-col gap-2">
        <h3 className="font-display text-xl font-bold text-foreground">
          {plan.name}
        </h3>
        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
        <div className="mt-4 flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              {price.amount}
            </span>
            {price.perMonth ? (
              <span className="text-sm text-muted-foreground">/mês</span>
            ) : null}
            {price.strikethrough ? (
              <span className="text-sm text-muted-foreground line-through">
                {price.strikethrough}
              </span>
            ) : null}
          </div>
          {price.annualNote ? (
            <p className="text-xs font-medium text-brl-orange">
              {price.annualNote}
            </p>
          ) : null}
        </div>
      </header>

      <ul className="flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-foreground/90"
          >
            <CheckIcon
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0",
                plan.highlighted ? "text-brl-purple" : "text-brl-orange",
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.note ? (
        <p className="text-xs text-muted-foreground italic">{plan.note}</p>
      ) : null}

      <Button
        size="lg"
        nativeButton={false}
        className={cn(
          "mt-auto h-11 text-sm",
          plan.highlighted
            ? "bg-brl-purple text-white hover:bg-brl-purple/90"
            : "border border-foreground/15 bg-foreground/5 text-foreground hover:bg-foreground/10",
        )}
        variant={plan.highlighted ? "default" : "outline"}
        render={<Link href="/precos">{plan.ctaLabel}</Link>}
      />
    </article>
  );
}

function PlanSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full min-h-120 animate-pulse flex-col gap-4 rounded-2xl border border-foreground/5 bg-brl-card p-8"
    >
      <div className="h-5 w-24 rounded bg-foreground/10" />
      <div className="h-10 w-32 rounded bg-foreground/10" />
      <div className="mt-4 flex flex-col gap-3">
        <div className="h-4 w-full rounded bg-foreground/5" />
        <div className="h-4 w-5/6 rounded bg-foreground/5" />
        <div className="h-4 w-4/6 rounded bg-foreground/5" />
      </div>
    </div>
  );
}

export function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  return (
    <section
      id="planos"
      aria-labelledby="pricing-title"
      className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
          Planos
        </p>
        <h2
          id="pricing-title"
          className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl"
        >
          Escolhe como você quer caminhar.
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Começa grátis. Evolui quando quiser. Cancela quando precisar.
        </p>
      </div>

      {data ? (
        <BillingToggle
          value={cycle}
          onChange={setCycle}
          savingsLabel="2 meses grátis no plano anual"
          className="mt-10"
        />
      ) : null}

      {isLoading ? (
        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PlanSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <p
          role="alert"
          className="mt-14 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive"
        >
          Não consegui carregar os planos agora. Tente novamente em instantes.
        </p>
      ) : null}

      {data ? (
        <AnimatedSection
          className="mt-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
          translateY={0}
          scale={0.8}
          duration={500}
          delay={150}
          ease="outBack"
        >
          {data.map((plan) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} />
          ))}
        </AnimatedSection>
      ) : null}
    </section>
  );
}
