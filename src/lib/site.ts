/**
 * Constantes do site usadas por SEO (metadata, sitemap, robots, OG).
 * A URL canônica vem de NEXT_PUBLIC_SITE_URL; o fallback é só pra dev/build
 * local — em produção, defina a variável com o domínio real.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://brlhealth.com.br"
).replace(/\/+$/, "");

export const SITE_NAME = "BRL Health";

export const SITE_DESCRIPTION =
  "Ecossistema BRL: treinos adaptativos com o BRL Fit e nutrição contextualizada ao treino com o BRL Nutri. Comece grátis.";
