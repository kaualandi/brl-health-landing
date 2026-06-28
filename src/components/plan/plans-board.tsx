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
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { getPlans } from "@/services/plans.service";
import { cn } from "@/lib/utils";
import type { Plan, PlanId } from "@/types";

const RANK: Record<PlanId, number> = { free: 0, pro: 1, family: 2 };

function PlanCard({
  plan,
  cycle,
  currentTier,
  isAuthenticated,
}: {
  plan: Plan;
  cycle: BillingCycle;
  currentTier: PlanId;
  isAuthenticated: boolean;
}) {
  const isCurrent = isAuthenticated && currentTier === plan.id;
  const isUpgrade = RANK[plan.id] > RANK[currentTier];
  const price = resolvePlanPrice(plan, cycle);

  function renderCta() {
    if (isCurrent) {
      return (
        <Button
          disabled
          size="lg"
          className="mt-auto h-11 w-full cursor-default border border-foreground/15 bg-foreground/5 text-sm text-foreground disabled:opacity-100"
        >
          {plan.id === "free"
            ? "Você está aqui, mas pode melhorar 💪"
            : "Seu plano atual ✓"}
        </Button>
      );
    }

    if (plan.id === "free") {
      if (isAuthenticated) {
        return (
          <Button
            disabled
            size="lg"
            className="mt-auto h-11 w-full cursor-default border border-foreground/10 bg-transparent text-sm text-muted-foreground disabled:opacity-100"
          >
            Incluído no seu plano
          </Button>
        );
      }
      return (
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          className="mt-auto h-11 w-full border border-foreground/15 bg-foreground/5 text-sm hover:bg-foreground/10"
          render={<Link href="/cadastro">Começar grátis</Link>}
        />
      );
    }

    return (
      <Button
        size="lg"
        nativeButton={false}
        className={cn(
          "mt-auto h-11 w-full text-sm",
          plan.highlighted
            ? "bg-brl-purple text-white hover:bg-brl-purple/90"
            : "border border-foreground/15 bg-foreground/5 text-foreground hover:bg-foreground/10",
        )}
        render={
          <Link href={`/checkout?plano=${plan.id}`}>
            {isUpgrade ? `Assinar ${plan.name}` : `Mudar pro ${plan.name}`}
          </Link>
        }
      />
    );
  }

  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-6 rounded-2xl border bg-brl-card p-8 transition-colors",
        isCurrent
          ? "border-emerald-400/40 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]"
          : plan.highlighted
            ? "border-brl-purple/40 shadow-[0_0_0_1px_rgba(150,86,161,0.6)]"
            : "border-foreground/5",
      )}
    >
      {isCurrent ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold tracking-wide text-brl-dark uppercase">
          Seu plano
        </span>
      ) : plan.highlighted ? (
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

      {renderCta()}
    </article>
  );
}

export function PlansBoard() {
  const { isAuthenticated } = useAuth();
  const { tier } = usePlan();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  if (isLoading) {
    return (
      <div className="mt-14 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="h-120 animate-pulse rounded-2xl border border-foreground/5 bg-brl-card"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p
        role="alert"
        className="mt-14 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive"
      >
        Não consegui carregar os planos agora. Tente novamente em instantes.
      </p>
    );
  }

  return (
    <>
      <BillingToggle
        value={cycle}
        onChange={setCycle}
        savingsLabel="2 meses grátis no plano anual"
        className="mt-12"
      />
      <AnimatedSection
        className="mt-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
        translateY={0}
        scale={0.85}
        duration={500}
        delay={120}
        ease="outBack"
      >
        {data.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            currentTier={tier}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </AnimatedSection>
    </>
  );
}
