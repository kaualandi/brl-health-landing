import type { Metadata } from "next";

import { ContactForm } from "@/components/forms/contact-form";
import { ContactInfo } from "@/components/sections/contact/contact-info";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Contato — BRL Health";
const DESCRIPTION =
  "Fala com a BRL Health. Tire dúvidas, envie sugestões ou proponha uma parceria — a gente lê tudo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contato" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/contato",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function ContactPage() {
  return (
    <section
      aria-labelledby="contact-title"
      className="relative overflow-hidden bg-brl-dark pt-32 pb-24 md:pt-40 md:pb-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(150,86,161,0.10) 0%, rgba(13,13,26,0) 70%)",
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <header className="max-w-2xl">
          <h1
            id="contact-title"
            className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl"
          >
            Fala com a gente.
          </h1>
          <p className="mt-5 text-base text-muted-foreground md:text-lg">
            Tem dúvida, sugestão ou só quer dizer oi? A gente lê tudo.
          </p>
        </header>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[45fr_55fr] md:gap-12">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
