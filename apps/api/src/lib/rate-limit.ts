import { Elysia } from "elysia";

// ponytail: janela fixa em memória por processo; trocar por Redis se rodar mais de uma instância.
export const rateLimit = (name: string, max: number, windowMs = 60_000) => {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return new Elysia({ name: `rate-limit:${name}`, seed: max }).onBeforeHandle(
    { as: "scoped" },
    ({ request, server, set, status }) => {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        server?.requestIP(request)?.address ??
        "unknown";
      const now = Date.now();
      const hit = hits.get(ip);
      if (!hit || hit.resetAt <= now) {
        hits.set(ip, { count: 1, resetAt: now + windowMs });
        return;
      }
      if (++hit.count > max) {
        set.headers["retry-after"] = String(Math.ceil((hit.resetAt - now) / 1000));
        return status(429, { error: "Muitas tentativas. Tente novamente em instantes." });
      }
    },
  );
};
