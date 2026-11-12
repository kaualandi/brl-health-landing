"use client";

import { DumbbellIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Option } from "@/lib/exercises";
import { useExerciseFilters } from "@/hooks/use-exercises";
import { cn } from "@/lib/utils";

/** GIF com dimensões fixas (aspect-square) pra não pular o layout; sem GIF (ou 404) vira placeholder. */
export function ExerciseGif({ src, name, eager, className }: { src: string; name: string; eager?: boolean; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const img = useRef<HTMLImageElement>(null);
  // Erro antes da hidratação não dispara onError: confere o estado da imagem ao montar.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailedSrc(src);
  }, [src]);
  const box = cn("aspect-square w-full overflow-hidden rounded-xl", className);
  if (failedSrc === src || !src)
    return (
      <div
        role="img"
        aria-label={`Ainda estamos gravando a demonstração de ${name}`}
        className={cn(box, "@container flex flex-col items-center justify-center gap-3 bg-brl-purple/10 p-4 text-center")}
      >
        <DumbbellIcon aria-hidden className="size-1/3 max-h-14 max-w-14 text-brl-purple" />
        {/* Texto só cabe nos tamanhos maiores; miniaturas ficam só com o ícone. */}
        <div aria-hidden className="hidden @[10rem]:block">
          <p className="text-sm font-semibold text-foreground @[18rem]:text-base">Ainda estamos gravando este exercício</p>
          <p className="mt-1 text-xs text-muted-foreground @[18rem]:text-sm">Enquanto isso, siga o passo a passo.</p>
        </div>
      </div>
    );
  return (
    <div className={cn(box, "bg-white")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado e origem da API */}
      <img
        ref={img}
        src={src}
        alt={`Demonstração do exercício ${name}`}
        width={360}
        height={360}
        loading={eager ? "eager" : "lazy"}
        onError={() => setFailedSrc(src)}
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
