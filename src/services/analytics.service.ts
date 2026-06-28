const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Registra um evento de analytics (mock). Hoje só simula a latência e loga em
 * dev; na produção vira uma chamada ao backend de telemetria.
 */
export async function track(
  event: string,
  props?: AnalyticsProps,
): Promise<void> {
  await wait(60);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, props ?? {});
  }
  // TODO: substituir por api.post('/analytics/events', { event, props }) na fase de backend
}

/** Registra a visualização de uma página (atalho sobre `track`). */
export async function pageView(path: string): Promise<void> {
  await track("page_view", { path });
}
