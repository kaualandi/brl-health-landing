const BASE = "http://brl.invalid";
const INTERNAL = /^\/(?![/\\])/;

/** Só caminhos internos: mesma origem e caminho resolvido sem `//`/`/\` (pega TAB/LF, `/.//`, `%2e`). */
export function safeNext(next: string | null | undefined, fallback = "/nutri"): string {
  if (!next || !INTERNAL.test(next)) return fallback;
  try {
    const url = new URL(next, BASE);
    const path = url.pathname + url.search + url.hash;
    return url.origin === BASE && INTERNAL.test(url.pathname) ? path : fallback;
  } catch {
    return fallback;
  }
}
