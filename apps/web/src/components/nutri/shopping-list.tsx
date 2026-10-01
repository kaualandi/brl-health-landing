"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useShopping } from "@/hooks/use-shopping";
import { dietLabel } from "@/lib/nutri-options";
import { buildShoppingList } from "@/lib/shopping-list";
import {
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  subscribeNutriProfile,
} from "@/services/nutri.service";
import { cn } from "@/lib/utils";

export function ShoppingList() {
  const router = useRouter();
  const toast = useToast();
  const { checked, toggle, clear } = useShopping();
  const profile = useSyncExternalStore(
    subscribeNutriProfile,
    getNutriProfileSnapshot,
    getNutriProfileServerSnapshot,
  );

  useEffect(() => {
    if (profile === null) router.replace("/cadastro");
  }, [profile, router]);

  const categories = useMemo(
    () => (profile ? buildShoppingList(profile.diet, profile.restrictions) : []),
    [profile],
  );

  if (profile === undefined || profile === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  const checkedSet = new Set(checked);
  const allItems = categories.flatMap((c) => c.items.map((i) => i.name));
  const total = allItems.length;
  const bought = allItems.filter((name) => checkedSet.has(name)).length;
  const pct = total > 0 ? Math.round((bought / total) * 100) : 0;

  function copyList() {
    const text = categories
      .map(
        (category) =>
          `${category.emoji} ${category.title}\n` +
          category.items.map((item) => `- ${item.name}`).join("\n"),
      )
      .join("\n\n");

    if (!navigator.clipboard) {
      toast({ variant: "error", title: "Copiar não disponível aqui" });
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast({ variant: "success", title: "Lista copiada 📋" }),
      () => toast({ variant: "error", title: "Não consegui copiar" }),
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brl-dark pb-20">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 md:px-6">
          <Link
            href="/nutri"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Voltar
          </Link>
          <span className="font-display text-lg font-extrabold tracking-tight">
            <span className="text-brl-purple">BRL</span>
            <span className="text-foreground"> Nutri</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-8 md:px-6 md:pt-10">
        <p className="text-sm text-muted-foreground">🛒 Mercado</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Sua lista de compras
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Montada pra dieta <strong>{dietLabel(profile.diet)}</strong>,
          respeitando suas restrições.
        </p>

        {/* Progresso + ações */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-brl-card p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium tabular-nums">
              <span className="text-brl-purple">{bought}</span> / {total}{" "}
              <span className="text-muted-foreground">no carrinho</span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyList}
                className="h-9 border-white/15 bg-white/5 px-3 text-sm hover:bg-white/10"
              >
                <CopyIcon className="size-3.5" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clear();
                  toast({ title: "Carrinho limpo" });
                }}
                disabled={bought === 0}
                className="h-9 border-white/15 bg-white/5 px-3 text-sm hover:bg-white/10"
              >
                <Trash2Icon className="size-3.5" />
                Limpar
              </Button>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-brl-purple transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {categories.map((category) => (
            <section
              key={category.title}
              className="rounded-2xl border border-white/5 bg-brl-card p-5 md:p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
                <span aria-hidden className="text-lg">
                  {category.emoji}
                </span>
                {category.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {category.items.map((item) => {
                  const isChecked = checkedSet.has(item.name);
                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => toggle(item.name)}
                        aria-pressed={isChecked}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-white/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                            isChecked
                              ? "border-emerald-400 bg-emerald-400 text-brl-dark"
                              : "border-white/20",
                          )}
                        >
                          {isChecked ? <CheckIcon className="size-3.5" /> : null}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            isChecked
                              ? "text-muted-foreground line-through"
                              : "text-foreground/90",
                          )}
                        >
                          {item.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
