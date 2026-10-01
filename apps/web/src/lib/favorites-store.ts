/**
 * Favoritos do usuário (mock, localStorage): artigos e receitas salvos.
 * Mesmo padrão SSR-safe (useSyncExternalStore) dos outros stores, com snapshot
 * de array cacheado por conteúdo bruto pra manter a referência estável.
 *
 * Endpoint previsto: GET/POST/DELETE /me/favorites — a troca pelo backend real
 * só substitui a leitura/escrita, mantendo a mesma API.
 */

const FAVORITES_KEY = "brl.favorites";

export type FavoriteType = "article" | "recipe";

export interface Favorite {
  type: FavoriteType;
  id: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

const EMPTY: Favorite[] = [];
let cachedRaw: string | null | undefined;
let cachedList: Favorite[] = EMPTY;

/** Snapshot estável: só recalcula quando o conteúdo bruto muda. */
function read(): Favorite[] {
  const raw = window.localStorage.getItem(FAVORITES_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as Favorite[]) : EMPTY;
      cachedList = Array.isArray(value) ? value : EMPTY;
    } catch {
      cachedList = EMPTY;
    }
  }
  return cachedList;
}

function emit() {
  for (const listener of listeners) listener();
}

function write(list: Favorite[]) {
  const raw = JSON.stringify(list);
  window.localStorage.setItem(FAVORITES_KEY, raw);
  cachedRaw = raw;
  cachedList = list;
  emit();
}

export function subscribeFavorites(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

/** Client: lista atual de favoritos. */
export function getFavoritesSnapshot(): Favorite[] {
  if (typeof window === "undefined") return EMPTY;
  return read();
}

/** Servidor / primeiro paint: lista estável vazia (sem mismatch de hidratação). */
export function getFavoritesServerSnapshot(): Favorite[] {
  return EMPTY;
}

/** Está favoritado? (via snapshot, seguro no client). */
export function isFavorite(type: FavoriteType, id: string): boolean {
  return getFavoritesSnapshot().some((f) => f.type === type && f.id === id);
}

/** Alterna o favorito. Retorna `true` se passou a estar favoritado. */
export function toggleFavorite(type: FavoriteType, id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = read();
  const exists = current.some((f) => f.type === type && f.id === id);
  if (exists) {
    write(current.filter((f) => !(f.type === type && f.id === id)));
    return false;
  }
  write([...current, { type, id }]);
  return true;
}
