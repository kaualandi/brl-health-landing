/**
 * Itens marcados (comprados) da lista de compras. Persistente — não reseta
 * por dia. Mesmo padrão SSR-safe dos outros stores.
 */

const KEY = "brl.nutri.shopping";

type Listener = () => void;
const listeners = new Set<Listener>();

const EMPTY: string[] = [];
let cachedRaw: string | null | undefined;
let cachedList: string[] = EMPTY;

function read(): string[] {
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as string[]) : EMPTY;
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

function write(list: string[]) {
  const raw = JSON.stringify(list);
  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedList = list;
  emit();
}

export function subscribeShopping(listener: Listener): () => void {
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

export function getShoppingSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY;
  return read();
}

export function getShoppingServerSnapshot(): string[] {
  return EMPTY;
}

export function toggleShoppingItem(name: string): void {
  if (typeof window === "undefined") return;
  const current = read();
  const next = current.includes(name)
    ? current.filter((item) => item !== name)
    : [...current, name];
  write(next);
}

export function clearShopping(): void {
  if (typeof window === "undefined") return;
  write([]);
}
