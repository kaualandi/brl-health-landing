import { DumbbellIcon } from "lucide-react";
import Link from "next/link";

import { ProInvite } from "@/components/plan/pro-invite";
import type { TodayEnergy } from "@/services/nutri-energy.service";

/** "Treinou hoje" — só aparece se houve treino hoje (BRL Fit). */
export function WorkoutTodayCard({ energy }: { energy: TodayEnergy | undefined }) {
  if (!energy || energy.sessions === 0) return null;
  const extra = energy.bonusKcal > 0;
  return (
    <div className="rounded-2xl border border-brl-orange/30 bg-brl-orange/10 p-5">
      <div className="flex items-center gap-4">
      <DumbbellIcon className="size-6 shrink-0 text-brl-orange" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold">
          {extra ? `Treinou hoje: +${energy.bonusKcal} kcal` : `Treinou hoje: ${energy.workoutKcal} kcal gastos`}
        </p>
        <p className="text-sm text-muted-foreground">
          {extra
            ? "Sua meta de hoje já inclui o gasto extra do treino, em carboidrato."
            : energy.locked
              ? "O gasto do treino foi registrado, mas no plano Free ele não muda a meta."
              : "Seu nível de atividade já cobre esse treino — a meta não muda."}{" "}
          <Link href="/fit/app?aba=progresso" className="font-medium text-foreground underline underline-offset-2">
            Ver treino
          </Link>
        </p>
      </div>
      </div>
      {energy.locked ? <ProInvite place="nutri-bonus">Treino ajustando a meta do dia é Pro.</ProInvite> : null}
    </div>
  );
}
