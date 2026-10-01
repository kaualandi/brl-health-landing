import Link from "next/link";

import type { LegalDoc } from "@/lib/legal";

export function LegalPage({
  doc,
  relatedHref,
  relatedLabel,
}: {
  doc: LegalDoc;
  relatedHref: string;
  relatedLabel: string;
}) {
  return (
    <article className="bg-brl-dark pt-28 pb-24 md:pt-32 md:pb-28">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
        <header>
          <h1 className="font-display text-4xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: {doc.updatedAt}
          </p>
          <p className="mt-5 text-lg text-muted-foreground">{doc.intro}</p>
        </header>

        <div className="mt-10 flex flex-col gap-8">
          {doc.sections.map((section, index) => (
            <section key={index}>
              <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className="mb-4 text-base leading-relaxed text-foreground/85 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-2 flex flex-col gap-2.5">
                  {section.bullets.map((bullet, bIndex) => (
                    <li
                      key={bIndex}
                      className="flex gap-3 text-base leading-relaxed text-foreground/85"
                    >
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brl-purple"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-white/5 pt-6 text-sm text-muted-foreground">
          Veja também a{" "}
          <Link
            href={relatedHref}
            className="font-medium text-brl-purple hover:underline"
          >
            {relatedLabel}
          </Link>{" "}
          ou fale com a gente pela{" "}
          <Link
            href="/contato"
            className="font-medium text-brl-purple hover:underline"
          >
            página de contato
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
