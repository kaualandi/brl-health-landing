"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FitUnsynced } from "@/components/fit/fit-unsynced";
import { useAuth } from "@/hooks/use-auth";
import { useFitSync } from "@/hooks/use-fit-sync";
import { elapsedSeconds, formatClock, formatVolume, volumeKg, doneCount } from "@/lib/fit-session";
import { getHistory, loadQueue, type SessionSummary } from "@/services/fit-sessions.service";

const fmtDate = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

type Row = { key: string; date: string; name: string; seconds: number; volume: string; pending?: boolean };

const toRow = (s: SessionSummary): Row => ({
  key: s.id,
  date: fmtDate(`${s.date}T12:00:00-03:00`),
  name: s.dayName,
  seconds: s.durationSeconds ?? 0,
  volume: formatVolume(s.volumeKg),
});

/** Histórico mínimo: treinos ainda não enviados (fila local) + os do servidor. */
export function FitHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = useCallback(() => {
    if (!user) return;
    const pending = loadQueue(user.id).map((p) => ({
      key: p.clientId,
      date: fmtDate(p.finishedAt),
      name: p.dayName,
      seconds: elapsedSeconds(p.startedAt, Date.parse(p.finishedAt)),
      volume: formatVolume(volumeKg(p.sets)),
      pending: doneCount(p.sets) > 0,
    }));
    getHistory().then((h) => setRows([...pending, ...h.map(toRow)]), () => setRows(pending));
  }, [user]);
  useEffect(load, [load]);
  useFitSync(load);

  if (!rows) return <p className="py-6 text-sm text-muted-foreground">Carregando histórico…</p>;
  const empty = !rows.length && <p className="py-6 text-sm text-muted-foreground">Conclua seu primeiro treino pra ver seu progresso.</p>;
  return (
    <>
      <FitUnsynced onChange={load} />
      {empty || <List rows={rows} />}
    </>
  );
}

const PAGE = 5;

function List({ rows }: { rows: Row[] }) {
  const [shown, setShown] = useState(PAGE);
  return (
    <section aria-label="Histórico" className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">Histórico</h3>
      <ul className="flex flex-col gap-2">
        {rows.slice(0, shown).map((r) => (
          <li key={r.key} className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-card p-4">
            <span className="w-14 shrink-0 text-xs font-semibold text-brl-purple uppercase">{r.date}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{r.name}</span>
              {r.pending ? <span className="text-xs text-brl-orange">Aguardando sincronizar</span> : null}
            </span>
            <span className="text-right text-xs text-muted-foreground tabular-nums">
              <span className="block">{formatClock(r.seconds)}</span>
              <span className="block font-semibold text-foreground">{r.volume}</span>
            </span>
          </li>
        ))}
      </ul>
      {shown < rows.length ? (
        <Button type="button" variant="outline" className="h-12" onClick={() => setShown((n) => n + PAGE * 2)}>
          Ver mais
        </Button>
      ) : null}
    </section>
  );
}
