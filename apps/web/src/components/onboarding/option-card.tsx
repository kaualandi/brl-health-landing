"use client";

import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type OptionCardProps = {
  emoji: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  /** Layout horizontal (lista) em vez de bloco. */
  compact?: boolean;
};

export function OptionCard({
  emoji,
  label,
  description,
  selected,
  onSelect,
  compact = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-2xl border bg-brl-card p-4 text-left transition-all duration-200 outline-none",
        "hover:border-brl-purple/50 hover:bg-white/[0.03]",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "active:translate-y-px",
        selected
          ? "border-brl-purple/60 bg-brl-purple/10 shadow-[0_0_0_1px_rgba(150,86,161,0.5)]"
          : "border-white/8",
        compact ? "flex-row" : "flex-col items-start sm:min-h-32",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl transition-colors",
          selected && "bg-brl-purple/20",
        )}
      >
        {emoji}
      </span>

      <span className={cn("flex flex-col gap-0.5", compact && "flex-1")}>
        <span className="font-display text-base font-bold text-foreground">
          {label}
        </span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>

      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
          compact ? "ml-auto" : "absolute top-3 right-3",
          selected
            ? "border-brl-purple bg-brl-purple text-white"
            : "border-white/15 text-transparent",
        )}
      >
        <CheckIcon className="size-3" strokeWidth={3} />
      </span>
    </button>
  );
}
