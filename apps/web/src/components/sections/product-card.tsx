"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCardAnimation } from "@/hooks/use-card-animation";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  title: string;
  tagline: string;
  accent: "orange" | "green";
  features: string[];
  cta: { href: string; label: string };
};

const accentStyles = {
  orange: {
    border: "before:bg-brl-orange",
    title: "text-brl-orange",
    check: "text-brl-orange",
    glow: "from-brl-orange/10",
  },
  green: {
    border: "before:bg-brl-green",
    title: "text-emerald-400",
    check: "text-emerald-400",
    glow: "from-emerald-500/10",
  },
} as const;

export function ProductCard({
  title,
  tagline,
  accent,
  features,
  cta,
}: ProductCardProps) {
  const styles = accentStyles[accent];
  const hoverAnim = useCardAnimation();

  return (
    <article
      onMouseEnter={hoverAnim.onMouseEnter}
      onMouseLeave={hoverAnim.onMouseLeave}
      className={cn(
        "relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-foreground/5 bg-brl-card p-8 transition-colors",
        "before:absolute before:inset-x-0 before:top-0 before:h-1",
        styles.border,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-linear-to-br to-transparent blur-3xl",
          styles.glow,
        )}
      />
      <div className="relative">
        <h3
          className={cn(
            "font-display text-3xl font-extrabold tracking-tight",
            styles.title,
          )}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {tagline}
        </p>
      </div>

      <ul className="relative flex flex-col gap-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm md:text-base"
          >
            <CheckIcon
              aria-hidden
              className={cn("mt-0.5 size-4 shrink-0", styles.check)}
            />
            <span className="text-foreground/90">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto">
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          className="h-11 w-full border-foreground/15 bg-foreground/5 text-sm hover:bg-foreground/10 md:w-auto"
          render={<Link href={cta.href}>{cta.label}</Link>}
        />
      </div>
    </article>
  );
}
