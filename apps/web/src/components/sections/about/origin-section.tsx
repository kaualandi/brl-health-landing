import { QuoteIcon } from "lucide-react";

export function OriginSection() {
  return (
    <section
      aria-labelledby="origin-title"
      className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28"
    >
      <div className="grid gap-10 md:grid-cols-5 md:items-center md:gap-12">
        <div className="md:col-span-3">
          <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
            A origem
          </p>
          <h2
            id="origin-title"
            className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl"
          >
            Uma conversa entre amigos que virou produto.
          </h2>
          <div className="mt-6 flex flex-col gap-5 text-base text-muted-foreground md:text-lg">
            <p>
              Em algum momento de 2024, o grupo de amigos que hoje forma a BRL
              percebeu que tinha um problema em comum: não era falta de
              vontade. Era falta de sistema.
            </p>
            <p>
              Treinavam num app. Contavam calorias em outro. Nenhum dos dois
              sabia o que o outro estava fazendo. O resultado? Frustração,
              abandono e aquela culpa clássica de achar que o problema era a
              preguiça.
            </p>
            <p className="font-medium text-foreground">Spoiler: não era.</p>
          </div>
        </div>

        <aside
          aria-label="Citação de destaque"
          className="relative overflow-hidden rounded-2xl border-l-4 border-brl-purple bg-brl-card p-8 md:col-span-2"
        >
          <QuoteIcon
            aria-hidden
            className="absolute -top-2 -right-2 size-28 text-brl-purple/30"
          />
          <p className="relative font-display text-2xl leading-tight font-extrabold tracking-tight text-foreground md:text-3xl">
            “Não é falta de vontade. Nunca foi.”
          </p>
          <p className="relative mt-6 text-sm text-muted-foreground">
            — A ideia que deu origem à BRL
          </p>
        </aside>
      </div>
    </section>
  );
}
