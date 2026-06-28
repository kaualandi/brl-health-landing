import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas / de conversão não precisam ser indexadas.
      disallow: [
        "/nutri",
        "/conta",
        "/checkout",
        "/login",
        "/cadastro",
        "/recuperar-senha",
        "/redefinir-senha",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
