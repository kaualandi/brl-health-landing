import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de Uso — BRL Health",
  description:
    "Os termos que regem o uso da plataforma BRL Health, incluindo BRL Nutri e BRL Fit.",
};

export default function TermsPage() {
  return (
    <LegalPage
      doc={TERMS}
      relatedHref="/privacidade"
      relatedLabel="Política de Privacidade"
    />
  );
}
