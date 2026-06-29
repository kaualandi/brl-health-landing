"use client";

import { useSyncExternalStore } from "react";

import {
  getFavoritesServerSnapshot,
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite,
  type Favorite,
  type FavoriteType,
} from "@/lib/favorites-store";

/** Lista reativa de favoritos. SSR-safe — vazia no primeiro paint. */
export function useFavorites(): { favorites: Favorite[] } {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot,
  );
  return { favorites };
}

/** Estado de um item específico + ação de alternar. */
export function useFavorite(
  type: FavoriteType,
  id: string,
): { isFavorite: boolean; toggle: () => boolean } {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot,
  );
  const isFavorite = favorites.some((f) => f.type === type && f.id === id);
  return {
    isFavorite,
    toggle: () => toggleFavorite(type, id),
  };
}
