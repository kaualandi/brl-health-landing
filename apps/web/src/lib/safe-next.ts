const BASE = "http://brl.invalid";

/** Só caminhos internos: resolve contra uma base fixa e exige a mesma origem (pega `//`, `/\`, TAB/LF). */
export function safeNext(next: string | null | undefined, fallback = "/nutri"): string {
  if (!next?.startsWith("/")) return fallback;
  const url = new URL(next, BASE);
  return url.origin === BASE ? url.pathname + url.search + url.hash : fallback;
}
