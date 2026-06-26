import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade — BRL Health",
  description:
    "Como a BRL Health coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      doc={PRIVACY}
      relatedHref="/termos"
      relatedLabel="Termos de Uso"
    />
  );
}
