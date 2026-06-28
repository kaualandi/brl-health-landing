/**
 * Fonte única de verdade do tema no client.
 * Mesmo padrão SSR-safe da sessão (`auth-store.ts`): `useSyncExternalStore`
 * sobre o localStorage, sem `setState` em effect e sem mismatch de hidratação.
 *
 * Guardamos a ESCOLHA do usuário ("light" | "dark" | "system"), não o tema
 * resolvido — assim "system" continua reagindo à preferência do SO. O default
 * é "system" e, quando o SO é escuro ou desconhecido, resolve para escuro,
 * preservando o visual atual do produto.
 */

const THEME_STORAGE_KEY = "brl.theme";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedRaw: string | null | undefined;
let cachedChoice: ThemeChoice = "system";

function isThemeChoice(value: string | null): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

/** Preferência do SO. Default escuro quando matchMedia é indisponível. */
function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolve a escolha em um tema concreto. "system" consulta o matchMedia. */
export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  return systemPrefersDark() ? "dark" : "light";
}

/** Snapshot estável da escolha: só recalcula quando o valor bruto muda. */
function readChoice(): ThemeChoice {
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedChoice = isThemeChoice(raw) ? raw : "system";
  }
  return cachedChoice;
}

/** Efeito colateral: alterna a classe `dark` no <html> conforme o resolvido. */
function applyResolvedTheme(): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(readChoice());
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);

  // Mudanças externas (outra aba ou preferência do SO) precisam reaplicar a
  // classe `dark` imediatamente e notificar o React pra re-renderizar.
  const onExternalChange = () => {
    applyResolvedTheme();
    listener();
  };

  let media: MediaQueryList | undefined;
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onExternalChange);
    if (window.matchMedia) {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", onExternalChange);
    }
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onExternalChange);
      media?.removeEventListener("change", onExternalChange);
    }
  };
}

/** Client: escolha atual do usuário (default "system"). */
export function getThemeChoiceSnapshot(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  return readChoice();
}

/** Servidor / primeiro paint: undefined enquanto não lemos o localStorage. */
export function getThemeServerSnapshot(): ThemeChoice | undefined {
  return undefined;
}

/** Client: tema concreto aplicado (light | dark). */
export function getResolvedThemeSnapshot(): ResolvedTheme | undefined {
  if (typeof window === "undefined") return undefined;
  return resolveTheme(readChoice());
}

/** Servidor / primeiro paint do tema resolvido. */
export function getResolvedThemeServerSnapshot(): ResolvedTheme | undefined {
  return undefined;
}

/* --- escrita imperativa --- */

export function setThemeChoice(choice: ThemeChoice): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  cachedRaw = choice;
  cachedChoice = choice;
  applyResolvedTheme();
  emit();
}
