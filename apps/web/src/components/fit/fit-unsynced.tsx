"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFitSync } from "@/hooks/use-fit-sync";
import { doneCount, formatVolume, volumeKg } from "@/lib/fit-session";
import { discardFailed, loadFailed, retryFailed } from "@/services/fit-sessions.service";

/** Treinos que o servidor recusou: nada se perde sem o usuário decidir (tentar de novo ou descartar). */
export function FitUnsynced({ onChange }: { onChange?: () => void }) {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const [items, setItems] = useState(() => (uid ? loadFailed(uid) : []));
  const [confirming, setConfirming] = useState<string | null>(null);
  const refresh = useCallback(() => {
    setItems(loadFailed(uid));
    onChange?.();
  }, [uid, onChange]);
  useFitSync(refresh);
  if (!items.length) return null;

  const retry = (id: string) => void retryFailed(uid, id).then(refresh);
  const discard = (id: string) => {
    discardFailed(uid, id);
    setConfirming(null);
    refresh();
  };
  return (
    <section role="alert" aria-label="Treinos não sincronizados" className="mb-4 flex flex-col gap-3 rounded-2xl border border-brl-orange/40 bg-brl-orange/10 p-4">
      <h3 className="text-sm font-bold">
        {items.length} {items.length === 1 ? "treino não sincronizado" : "treinos não sincronizados"}
      </h3>
      {items.map(({ payload: p, error }) => (
        <div key={p.clientId} className="flex flex-col gap-2 text-sm">
          <p>
            {doneCount(p.sets)} {doneCount(p.sets) === 1 ? "série" : "séries"} · {formatVolume(volumeKg(p.sets))} — <span className="text-muted-foreground">{error}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => retry(p.clientId)}>
              Tentar de novo
            </Button>
            {confirming === p.clientId ? (
              <>
                <span className="text-xs">Descartar mesmo? Não dá pra desfazer.</span>
                <Button type="button" variant="destructive" size="sm" onClick={() => discard(p.clientId)}>
                  Sim, descartar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                  Não
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(p.clientId)}>
                Descartar
              </Button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
