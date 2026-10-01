import type { Metadata } from "next";

import { CalculatorForm } from "@/components/calculator/calculator-form";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Calculadora de calorias, TDEE e IMC grátis — BRL Health";
const DESCRIPTION =
  "Calcule grátis suas calorias diárias, TDEE, macros, IMC e meta de água — sem precisar criar conta. Estimativa por Mifflin-St Jeor.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/calculadora" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/calculadora",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function CalculatorPage() {
  return (
    <div className="bg-brl-dark pt-28 pb-24 md:pt-32 md:pb-28">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <header className="mb-10 max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
            Grátis · sem cadastro
          </p>
          <h1 className="mt-1.5 font-display text-4xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-5xl">
            Calculadora de calorias e IMC
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubra suas calorias diárias, macros, IMC e meta de água em
            segundos. Sem login — é só preencher.
          </p>
        </header>

        <CalculatorForm />
      </div>
    </div>
  );
}
