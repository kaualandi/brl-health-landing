"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";

import { FAQ } from "@/lib/faq";
import { cn } from "@/lib/utils";

function FaqEntry({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 rounded-md py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="font-display text-base font-bold text-foreground md:text-lg">
          {q}
        </span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-brl-purple",
          )}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          className="-mt-1 pb-4 text-base leading-relaxed text-muted-foreground"
        >
          {a}
        </div>
      ) : null}
    </div>
  );
}

export function FaqAccordion() {
  return (
    <div className="flex flex-col gap-10">
      {FAQ.map((category) => (
        <section key={category.title}>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-brl-purple uppercase">
            {category.title}
          </h2>
          <div className="rounded-2xl border border-white/5 bg-brl-card px-6">
            {category.items.map((item) => (
              <FaqEntry key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
