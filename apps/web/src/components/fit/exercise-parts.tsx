import type { Option } from "@/lib/exercises";
import { useExerciseFilters } from "@/hooks/use-exercises";
import { cn } from "@/lib/utils";

/** GIF com dimensões fixas (aspect-square) pra não pular o layout. */
export function ExerciseGif({ src, name, eager, className }: { src: string; name: string; eager?: boolean; className?: string }) {
  return (
    <div className={cn("aspect-square w-full overflow-hidden rounded-xl bg-white", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado e origem da API */}
      <img
        src={src}
        alt={`Demonstração do exercício ${name}`}
        width={360}
        height={360}
        loading={eager ? "eager" : "lazy"}
        className="size-full object-contain"
      />
    </div>
  );
}

export function Chips({ items, tone = "purple" }: { items: Option[]; tone?: "purple" | "orange" }) {
  return (
    <>
      {items.map((o) => (
        <span
          key={o.value}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            tone === "purple" ? "bg-brl-purple/20 text-foreground" : "bg-brl-orange/15 text-orange-700 dark:text-brl-orange",
          )}
        >
          {o.label}
        </span>
      ))}
    </>
  );
}

export function Attribution() {
  const { data } = useExerciseFilters();
  return <p className="pb-4 text-center text-xs text-muted-foreground">{data?.attribution ?? "Dados e GIFs: ExerciseDB"}</p>;
}
