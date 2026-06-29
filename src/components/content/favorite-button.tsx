"use client";

import { BookmarkIcon } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { useFavorite } from "@/hooks/use-favorites";
import type { FavoriteType } from "@/lib/favorites-store";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  type,
  id,
  className,
}: {
  type: FavoriteType;
  id: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorite(type, id);
  const toast = useToast();

  function handleClick() {
    const nowFavorite = toggle();
    toast({
      title: nowFavorite ? "Salvo nos favoritos" : "Removido dos favoritos",
      variant: nowFavorite ? "success" : "info",
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isFavorite
          ? "border-brl-purple/40 bg-brl-purple/15 text-brl-purple"
          : "border-foreground/10 bg-foreground/5 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <BookmarkIcon
        className={cn("size-3.5", isFavorite && "fill-current")}
        aria-hidden
      />
      <span>{isFavorite ? "Salvo" : "Salvar"}</span>
    </button>
  );
}
