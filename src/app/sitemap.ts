import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/nutri-content";
import { SITE_URL } from "@/lib/site";

// Data fixa pra manter o sitemap determinístico entre builds.
const LAST_MODIFIED = "2026-06-26";

type StaticRoute = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

// Apenas rotas públicas — o app logado (/nutri, /conta, checkout) fica de fora.
const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/precos", priority: 0.8, changeFrequency: "monthly" },
  { path: "/conteudos", priority: 0.7, changeFrequency: "weekly" },
  { path: "/fit", priority: 0.6, changeFrequency: "monthly" },
  { path: "/sobre", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contato", priority: 0.4, changeFrequency: "yearly" },
  { path: "/termos", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacidade", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const articleEntries = ARTICLES.map((article) => ({
    url: `${SITE_URL}/conteudos/${article.id}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...articleEntries];
}
