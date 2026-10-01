import { FormatRegistry } from "elysia/type-system";

/** "date" estrito YYYY-MM-DD: o padrão só checa o formato e aceitaria 2026-02-31 (vira 500 no banco). */
FormatRegistry.Set("date", (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m || +m[1] < 1) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
});
