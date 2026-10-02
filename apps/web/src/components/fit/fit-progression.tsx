import { LeafIcon, MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { nextLabel, type ProgressionItem } from "@/lib/fit-progression";

const ICONS = { up: TrendingUpIcon, hold: MinusIcon, down: TrendingDownIcon, deload: LeafIcon, new: MinusIcon };

/** "Na próxima: X kg × Y" com ícone discreto; o texto carrega o significado. */
export function NextHint({ item }: { item: ProgressionItem | undefined }) {
  const text = nextLabel(item);
  if (!item || !text) return null;
  const Icon = ICONS[item.reason];
  return (
    <p className="flex items-start gap-1.5 px-2 pt-1.5 text-xs font-medium text-foreground/80">
      <Icon aria-hidden className="mt-px size-3.5 shrink-0 text-brl-purple" />
      <span className="line-clamp-2">{text}</span>
    </p>
  );
}

export function DeloadBanner({ week }: { week: number }) {
  return (
    <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-brl-orange/30 bg-brl-orange/10 p-3 text-sm">
      <LeafIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-brl-orange" />
      Semana de deload: é a {week}ª semana seguida treinando, então reduzimos carga e séries para você se recuperar.
    </p>
  );
}
