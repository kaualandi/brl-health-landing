"use client";

import { PauseIcon, PlayIcon, SkipForwardIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatClock, restLeft, type Rest } from "@/lib/fit-session";

const ALERTS_KEY = "brl.fit.alerts";

/** "Agora" em ms, atualizado a cada `ms`. */
export function useNow(ms = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => void ctx.close();
  } catch {
    // sem áudio disponível: segue sem som
  }
}

/** Som + vibração curtos, ligados por padrão e desligáveis; vibração respeita "reduzir movimento". */
export function useAlerts() {
  const [on, setOn] = useState(() => typeof window === "undefined" || window.localStorage.getItem(ALERTS_KEY) !== "off");
  const toggle = () => {
    window.localStorage.setItem(ALERTS_KEY, on ? "off" : "on");
    setOn(!on);
  };
  const fire = useCallback(() => {
    if (!on) return;
    beep();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(200);
  }, [on]);
  return { on, toggle, fire };
}

type Props = {
  rest: Rest | null;
  done: boolean;
  now: number;
  alerts: { on: boolean; toggle: () => void };
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
};

/** Barra fixa do descanso: contagem regressiva visível, pausar/pular; aria-live avisa o fim. */
export function RestBar({ rest, done, now, alerts, onPause, onResume, onSkip }: Props) {
  const left = rest ? restLeft(rest, now) : 0;
  const paused = rest?.endsAt === null;
  const pct = rest ? Math.round((left / rest.total) * 100) : 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-background/95 backdrop-blur-xl">
      <p role="status" aria-live="polite" className="sr-only">
        {done ? "Descanso terminado. Hora da próxima série." : ""}
      </p>
      {rest ? (
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Descanso{paused ? " (pausado)" : ""}</p>
            <p className="font-display text-3xl leading-none font-extrabold tabular-nums">{formatClock(left)}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full bg-brl-purple transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Button type="button" variant="outline" size="icon-lg" onClick={paused ? onResume : onPause} aria-label={paused ? "Retomar descanso" : "Pausar descanso"}>
            {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
          </Button>
          <Button type="button" variant="outline" className="h-9" onClick={onSkip}>
            <SkipForwardIcon aria-hidden /> Pular
          </Button>
          <Button type="button" variant="ghost" size="icon-lg" onClick={alerts.toggle} aria-pressed={alerts.on} aria-label="Som e vibração ao fim do descanso">
            {alerts.on ? <Volume2Icon aria-hidden /> : <VolumeXIcon aria-hidden />}
          </Button>
        </div>
      ) : done ? (
        <p className="px-4 py-3 text-center text-sm font-semibold text-brl-orange">Descanso terminado — próxima série!</p>
      ) : null}
    </div>
  );
}
