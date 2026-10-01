import { config } from "../config";

/** "Hoje" no fuso do app (YYYY-MM-DD) — não UTC, senão 21h–meia-noite cai no dia seguinte no Brasil. */
export const today = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone }).format(now);
