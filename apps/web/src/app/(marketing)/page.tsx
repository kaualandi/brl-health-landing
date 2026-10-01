import type { Metadata } from "next";

import { Cta } from "@/components/sections/cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Pricing } from "@/components/sections/pricing";
import { Products } from "@/components/sections/products";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const TITLE = "BRL Health — do objetivo à conquista";

export const metadata: Metadata = {
  title: TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/",
    title: TITLE,
    description: SITE_DESCRIPTION,
    // Reaproveita a OG image gerada na raiz (app/opengraph-image.tsx). Como esta
    // rota define seu próprio `openGraph`, a imagem herdada precisa ser reapontada.
    images: ["/opengraph-image"],
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Products />
      <HowItWorks />
      <Pricing />
      <Cta />
    </>
  );
}
