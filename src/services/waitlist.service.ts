const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "brl.fit.waitlist";

export type WaitlistSource = "fit" | "newsletter";

/**
 * Entra na lista de espera (mock). Guarda o e-mail localmente só pra UX
 * (evitar duplicar) e simula a latência da rede.
 */
export async function joinWaitlist(
  email: string,
  source: WaitlistSource = "fit",
): Promise<void> {
  await wait(900);

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
  // TODO: substituir por api.post('/waitlist', { email, source }) na fase de backend
}
