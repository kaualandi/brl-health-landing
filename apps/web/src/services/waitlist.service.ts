import { api } from "@/lib/axios";

const STORAGE_KEY = "brl.fit.waitlist";

export type WaitlistSource = "fit" | "newsletter";

/**
 * Entra na lista de espera (POST /waitlist, idempotente no backend). Guarda o
 * e-mail localmente também só pra UX (evitar reenvio na mesma sessão).
 */
export async function joinWaitlist(
  email: string,
  source: WaitlistSource = "fit",
): Promise<void> {
  await api.post("/waitlist", { email, source });

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list: { email: string; source: string }[] = raw
        ? JSON.parse(raw)
        : [];
      if (!list.some((entry) => entry.email === email)) {
        list.push({ email, source });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // localStorage indisponível — segue o jogo, é só conveniência.
    }
  }
}
