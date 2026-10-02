import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { doneCount, formatClock, formatVolume, volumeKg, type SessionSet } from "@/lib/fit-session";

type Props = {
  sets: SessionSet[];
  seconds: number;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

/** Resumo antes de concluir; avisa quando sobram séries sem marcar. */
export function WorkoutSummary({ sets, seconds, busy, onBack, onConfirm }: Props) {
  const done = doneCount(sets);
  const missing = sets.length - done;
  const stats = [
    ["Duração", formatClock(seconds)],
    ["Séries", `${done}/${sets.length}`],
    ["Volume", formatVolume(volumeKg(sets))],
  ];
  return (
    <section aria-label="Resumo do treino" className="flex flex-col gap-5 pt-8">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Concluir treino</h2>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-foreground/10 bg-card p-3 text-center">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-1 font-display text-xl font-extrabold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {missing > 0 ? (
        <p role="alert" className="rounded-xl border border-brl-orange/40 bg-brl-orange/10 p-3 text-sm">
          {missing === 1 ? "Falta 1 série" : `Faltam ${missing} séries`} sem marcar. Elas não entram no volume. Quer concluir mesmo assim?
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="h-12 sm:flex-1" onClick={onConfirm} disabled={busy || done === 0}>
          {busy ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
          {missing > 0 ? "Concluir mesmo assim" : "Concluir treino"}
        </Button>
        <Button type="button" variant="outline" className="h-12" onClick={onBack} disabled={busy}>
          Voltar ao treino
        </Button>
      </div>
      {done === 0 ? <p className="text-sm text-muted-foreground">Marque ao menos uma série pra registrar o treino.</p> : null}
    </section>
  );
}
