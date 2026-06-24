"use client";

import { DropletIcon, MinusIcon, PlusIcon } from "lucide-react";

import { useWater } from "@/hooks/use-nutri-tracking";
import { cn } from "@/lib/utils";

const GLASS_ML = 250;

export function WaterCard({ goalMl }: { goalMl: number }) {
  const { glasses, add, remove } = useWater();
  const goalGlasses = Math.max(1, Math.round(goalMl / GLASS_ML));
  const consumedMl = glasses * GLASS_ML;
  const reached = glasses >= goalGlasses;
  // Mostra no máximo a meta + eventuais copos extras.
  const pips = Math.max(goalGlasses, glasses);

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <DropletIcon className="size-4 text-sky-400" />
          Água de hoje
        </h3>
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            reached ? "text-sky-400" : "text-muted-foreground",
          )}
        >
          {reached ? "Meta batida! 💧" : `${glasses}/${goalGlasses} copos`}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: pips }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "h-7 w-5 rounded-t-md rounded-b-full border transition-colors",
              i < glasses
                ? "border-sky-400/50 bg-sky-400/30"
                : "border-white/10 bg-white/[0.03]",
            )}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-bold tabular-nums text-foreground">
            {consumedMl >= 1000
              ? `${(consumedMl / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L`
              : `${consumedMl} ml`}
          </p>
          <p className="text-xs text-muted-foreground">
            meta de {(goalMl / 1000).toFixed(1)} L · copos de {GLASS_ML} ml
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={glasses === 0}
            aria-label="Tirar um copo"
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
          >
            <MinusIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={add}
            aria-label="Adicionar um copo"
            className="flex h-10 items-center gap-1.5 rounded-full bg-sky-500 px-4 text-sm font-semibold text-white transition-colors outline-none hover:bg-sky-500/90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PlusIcon className="size-4" />
            Copo
          </button>
        </div>
      </div>
    </div>
  );
}
