/** Só aceita caminhos internos — evita open redirect via `?next=` (`/\` vale como `//`). */
export function safeNext(next: string | null | undefined, fallback = "/nutri"): string {
  return next && /^\/(?![/\\])/.test(next) ? next : fallback;
}
