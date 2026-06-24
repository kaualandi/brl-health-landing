"use client";

import Link from "next/link";
import { ArrowRightIcon, SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/lib/plan-store";

type Pitch = {
  eyebrow: string;
  title: string;
  text: string;
  price: string;
  cta: string;
  gradient: string;
  border: string;
  glow: string;
  accentText: string;
};

/** Pra cada tier atual, o próximo passo natural. `family` é o topo → sem pitch. */
const PITCH: Partial<Record<PlanTier, Pitch>> = {
  free: {
    eyebrow: "Dá pra ir além",
    title: "Treino e nutrição jogando junto",
    text: "No BRL Pro os apps se integram, a IA monta seu dia e o histórico fica ilimitado. Prefere com a galera? Tem o Family também.",
    price: "R$ 29,90/mês",
    cta: "Conhecer o Pro",
    gradient: "from-brl-purple/20",
    border: "border-brl-purple/25",
    glow: "bg-brl-purple/15",
    accentText: "text-brl-purple",
  },
  pro: {
    eyebrow: "Leve pra todo mundo",
    title: "Toda a família no mesmo ritmo",
    text: "Até 4 pessoas no BRL Family, com dashboard familiar e metas compartilhadas. Sai só R$ 12,47 por pessoa.",
    price: "R$ 49,90/mês",
    cta: "Ver o Family",
    gradient: "from-brl-orange/20",
    border: "border-brl-orange/25",
    glow: "bg-brl-orange/15",
    accentText: "text-brl-orange",
  },
};

export function UpgradeNudge({ className }: { className?: string }) {
  const { state, tier, nudgeDismissed, dismissNudge } = usePlan();

  // Espera a sessão resolver; respeita quem já dispensou; topo não tem upsell.
  if (state === undefined || nudgeDismissed) return null;
  const pitch = PITCH[tier];
  if (!pitch) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-brl-card bg-linear-to-br to-transparent p-6 md:p-7",
        pitch.gradient,
        pitch.border,
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl",
          pitch.glow,
        )}
      />
      <button
        type="button"
        onClick={() => dismissNudge(tier)}
        aria-label="Dispensar"
        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <XIcon className="size-4" />
      </button>

      <div className="relative">
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase",
            pitch.accentText,
          )}
        >
          <SparklesIcon className="size-3.5" />
          {pitch.eyebrow}
        </p>
        <h3 className="mt-2 max-w-md font-display text-lg font-bold text-foreground md:text-xl">
          {pitch.title}
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          {pitch.text}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button
            nativeButton={false}
            className="bg-foreground text-background hover:bg-foreground/90"
            render={
              <Link href="/precos">
                {pitch.cta}
                <ArrowRightIcon />
              </Link>
            }
          />
          <span className="text-sm text-muted-foreground">
            a partir de{" "}
            <span className="font-semibold text-foreground">{pitch.price}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
