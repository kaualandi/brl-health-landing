import { api } from "@/lib/axios";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Registra um evento de analytics (POST /analytics/events). Fire-and-forget:
 * nunca quebra a UX — engole qualquer erro de rede e só loga em dev.
 */
export async function track(
  event: string,
  props?: AnalyticsProps,
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, props ?? {});
  }

  try {
    await api.post("/analytics/events", { event, props });
  } catch {
    // Telemetria é best-effort — falha silenciosa.
  }
}

/** Registra a visualização de uma página (atalho sobre `track`). */
export async function pageView(path: string): Promise<void> {
  await track("page_view", { path });
}
