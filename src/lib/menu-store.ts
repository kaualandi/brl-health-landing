/**
 * Trocas de alimentos do cardápio. Guarda, por posição da refeição, quantas
 * vezes o usuário trocou (offset aplicado na escolha determinística).
 * Persistente — é a customização do cardápio, não reseta por dia.
 */

const KEY = "brl.nutri.menuSwaps";

type Overrides = Record<string, number>;
type Listener = () => void;
const listeners = new Set<Listener>();

const EMPTY: Overrides = {};
let cachedRaw: string | null | undefined;
let cachedValue: Overrides = EMPTY;

function read(): Overrides {
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as Overrides) : EMPTY;
      cachedValue = value && typeof value === "object" ? value : EMPTY;
    } catch {
      cachedValue = EMPTY;
    }
  }
  return cachedValue;
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeMenu(listener: Listener): () => void {
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

export function getMenuSnapshot(): Overrides {
  if (typeof window === "undefined") return EMPTY;
  return read();
}

export function getMenuServerSnapshot(): Overrides {
  return EMPTY;
}

/** Avança a escolha do item (próxima alternativa). */
export function swapMenuItem(key: string): void {
  if (typeof window === "undefined") return;
  const current = read();
  const next = { ...current, [key]: (current[key] ?? 0) + 1 };
  const raw = JSON.stringify(next);
  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedValue = next;
  emit();
}
