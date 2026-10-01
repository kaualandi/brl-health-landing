"use client";

import { DropletIcon, MinusIcon } from "lucide-react";
import { useState } from "react";

import { Confetti } from "@/components/ui/confetti";
import { useWater } from "@/hooks/use-nutri-tracking";
import { cn } from "@/lib/utils";

/** Silhueta do copo (clip + contorno). */
const GLASS = "M24 14 L76 14 L70 124 Q69 130 62 130 L38 130 Q31 130 30 124 Z";
/** Ondas (largura 200 = 2 comprimentos de onda; animação desloca -100 e repete). */
const WAVE_FRONT = "M0 0 q25 -6 50 0 t50 0 t50 0 t50 0 V190 H0 Z";
const WAVE_BACK = "M0 2 q25 7 50 0 t50 0 t50 0 t50 0 V190 H0 Z";

const GLASS_BOTTOM = 126;
const GLASS_INNER_H = 110;

const PRESETS = [
  { ml: 250, label: "250 ml" },
  { ml: 500, label: "500 ml" },
  { ml: 1000, label: "1 L" },
];

function formatMl(ml: number): string {
  return ml >= 1000
    ? `${(ml / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L`
    : `${ml} ml`;
}

/** Copo estilo "enchendo", com a superfície ondulando pra dar volume. */
function WaterGlass({ pct }: { pct: number }) {
  const filled = Math.min(1, Math.max(0, pct));
  const surfaceY = GLASS_BOTTOM - filled * GLASS_INNER_H;

  return (
    <svg
      viewBox="0 0 100 140"
      className="h-36 w-24 shrink-0"
      role="img"
      aria-label={`Copo ${Math.round(filled * 100)}% cheio`}
    >
      <defs>
        <clipPath id="waterGlassClip">
          <path d={GLASS} />
        </clipPath>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* interior vazio */}
      <path d={GLASS} fill="rgba(255,255,255,0.04)" />

      <g clipPath="url(#waterGlassClip)">
        <g
          style={{
            transform: `translateY(${surfaceY}px)`,
            transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <g className="water-wave water-wave--back">
            <path d={WAVE_BACK} fill="#0ea5e9" opacity={0.5} />
          </g>
          <g className="water-wave">
            <path d={WAVE_FRONT} fill="url(#waterGrad)" opacity={0.92} />
          </g>
        </g>
      </g>

      {/* contorno + brilho */}
      <path
        d={GLASS}
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d="M34 24 L33 104"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WaterCard({ goalMl }: { goalMl: number }) {
  const { ml, add, remove } = useWater();
  const [fireKey, setFireKey] = useState(0);

  const pct = goalMl > 0 ? ml / goalMl : 0;
  const reached = ml >= goalMl;

  function addAmount(amount: number) {
    const crossedGoal = ml < goalMl && ml + amount >= goalMl;
    add(amount);
    if (crossedGoal) setFireKey((k) => k + 1);
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <Confetti fireKey={fireKey} />
      <div className="mb-4 flex items-baseline justify-between gap-3">
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
          {reached ? "Meta batida! 💧" : `${Math.round(pct * 100)}%`}
        </span>
      </div>

      <div className="flex items-center gap-5">
        <WaterGlass pct={pct} />

        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold tabular-nums text-foreground">
            {formatMl(ml)}
          </p>
          <p className="text-xs text-muted-foreground">
            de {formatMl(goalMl)} de meta
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.ml}
                type="button"
                onClick={() => addAmount(preset.ml)}
                className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-sm font-semibold text-sky-300 transition-colors outline-none hover:bg-sky-400/20 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                +{preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => remove(250)}
              disabled={ml === 0}
              aria-label="Tirar 250 ml"
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
            >
              <MinusIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
