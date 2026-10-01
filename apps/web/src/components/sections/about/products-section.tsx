import { DumbbellIcon, UtensilsIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AboutProductCardProps = {
  title: string;
  description: string;
  Icon: LucideIcon;
  accent: "orange" | "green";
};

const accentStyles = {
  orange: {
    border: "before:bg-brl-orange",
    icon: "text-brl-orange",
  },
  green: {
    border: "before:bg-brl-green",
    icon: "text-emerald-400",
  },
} as const;

function AboutProductCard({
  title,
  description,
  Icon,
  accent,
}: AboutProductCardProps) {
  const styles = accentStyles[accent];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-foreground/5 bg-brl-card p-8",
        "before:absolute before:inset-x-0 before:top-0 before:h-1",
        styles.border,
      )}
    >
      <Icon aria-hidden className={cn("size-10", styles.icon)} />
      <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
        {title}
      </h3>
      <p className="mt-3 text-base text-muted-foreground md:text-lg">
        {description}
      </p>
    </article>
  );
}

export function ProductsSection() {
  return (
    <section
      aria-labelledby="about-products-title"
      className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="about-products-title"
          className="font-display text-3xl font-extrabold tracking-tight md:text-5xl"
        >
          Dois apps. Uma conta. Um objetivo.
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          A BRL Ltda. é a holding por trás de dois produtos
          <br />
          que nasceram pra trabalhar juntos.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <AboutProductCard
          title="BRL Fit"
          description="Treinos adaptativos que aprendem o seu ritmo. Do iniciante ao avançado, com IA que ajusta o plano conforme você evolui."
          Icon={DumbbellIcon}
          accent="orange"
        />
        <AboutProductCard
          title="BRL Nutri"
          description="Nutrição que respira junto com o seu treino. Sem planilha, sem sofrimento — só o que faz sentido pro seu objetivo do dia."
          Icon={UtensilsIcon}
          accent="green"
        />
      </div>
    </section>
  );
}
