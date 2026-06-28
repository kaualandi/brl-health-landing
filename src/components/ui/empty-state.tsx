import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Estado vazio reutilizável: ícone/emoji + título + descrição + CTA opcional.
 * A entrada suave respeita `prefers-reduced-motion` (via `motion-safe:`).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  /** Emoji (string) ou nó React (ex.: ícone lucide). */
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-foreground/5 bg-brl-card px-6 py-14 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500",
        className,
      )}
    >
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
