import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BRL Health — treino e nutrição",
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0d1a",
    theme_color: "#9656a1",
    categories: ["health", "fitness", "lifestyle", "medical"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      {
        name: "Calculadora grátis",
        short_name: "Calculadora",
        description: "Calcule calorias, macros e IMC sem cadastro.",
        url: "/calculadora",
      },
      {
        name: "Conteúdos",
        short_name: "Conteúdos",
        description: "Artigos sobre nutrição, treino e hábitos.",
        url: "/conteudos",
      },
      {
        name: "Meu plano",
        short_name: "Nutri",
        description: "Abra o app BRL Nutri.",
        url: "/nutri",
      },
    ],
  };
}
