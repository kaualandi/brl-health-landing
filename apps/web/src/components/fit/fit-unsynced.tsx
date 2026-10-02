"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFitSync } from "@/hooks/use-fit-sync";
import { doneCount, formatVolume, volumeKg } from "@/lib/fit-session";
import { discardFailed, loadFailed, retryFailed, type FailedSession } from "@/services/fit-sessions.service";

type ItemProps = { item: FailedSession; onRetry: () => void; onDiscard: () => void };

function DiscardConfirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <>
      <span className="text-xs">Descartar mesmo? Não dá pra desfazer.</span>
      <Button type="button" variant="destructive" size="sm" onClick={onYes}>
        Sim, descartar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onNo}>
        Não
      </Button>
    </>
  );
}

function FailedItem({ item, onRetry, onDiscard }: ItemProps) {
  const [confirming, setConfirming] = useState(false);
  const n = doneCount(item.payload.sets);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>
        {item.payload.dayName} · {n} {n === 1 ? "série" : "séries"} · {formatVolume(volumeKg(item.payload.sets))} —{" "}
        <span className="text-muted-foreground">{item.error}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
        {confirming ? (
          <DiscardConfirm onYes={onDiscard} onNo={() => setConfirming(false)} />
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
            Descartar
          </Button>
        )}
      </div>
    </div>
  );
}

/** Treinos que o servidor recusou: nada se perde sem o usuário decidir (tentar de novo ou descartar). */
export function FitUnsynced({ onChange }: { onChange?: () => void }) {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const [items, setItems] = useState(() => (uid ? loadFailed(uid) : []));
  const refresh = useCallback(() => {
    setItems(loadFailed(uid));
    onChange?.();
  }, [uid, onChange]);
  useFitSync(refresh);
  if (!items.length) return null;
  const title = items.length === 1 ? "treino não sincronizado" : "treinos não sincronizados";
  return (
    <section role="alert" aria-label="Treinos não sincronizados" className="mb-4 flex flex-col gap-3 rounded-2xl border border-brl-orange/40 bg-brl-orange/10 p-4">
      <h3 className="text-sm font-bold">
        {items.length} {title}
      </h3>
      {items.map((it) => (
        <FailedItem
          key={it.payload.clientId}
          item={it}
          onRetry={() => void retryFailed(uid, it.payload.clientId).then(refresh)}
          onDiscard={() => {
            discardFailed(uid, it.payload.clientId);
            refresh();
          }}
        />
      ))}
    </section>
  );
}
