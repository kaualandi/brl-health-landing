"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, LibraryIcon, Loader2Icon, TrendingUpIcon, ZapIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ExerciseLibrary } from "@/components/fit/exercise-library";
import { FitToday } from "@/components/fit/fit-today";
import { GenerateButton, PlanTab, ProgressTab } from "@/components/fit/fit-tab-panels";
import { UserMenu } from "@/components/layout/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { useFitPlan } from "@/hooks/use-fit-plan";
import { useFitSync } from "@/hooks/use-fit-sync";
import { useFitProfile } from "@/hooks/use-fit-profile";
import { FIT_TABS, nextTabIndex, parseFitTab, weekdayInSaoPaulo, type FitTab } from "@/lib/fit-week";
import { cn } from "@/lib/utils";

const TABS: { id: FitTab; label: string; icon: typeof ZapIcon }[] = [
  { id: "hoje", label: "Hoje", icon: ZapIcon },
  { id: "plano", label: "Plano", icon: CalendarIcon },
  { id: "progresso", label: "Progresso", icon: TrendingUpIcon },
  { id: "biblioteca", label: "Biblioteca", icon: LibraryIcon },
];

function FitBar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight" aria-label="BRL Health — página inicial">
          <span className="text-brl-purple">BRL</span>
          <span className="text-foreground"> Fit</span>
        </Link>
        {user ? <UserMenu user={user} /> : null}
      </div>
    </header>
  );
}

function FitTabs({ active, onChange }: { active: FitTab; onChange: (tab: FitTab) => void }) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const next = nextTabIndex(e.key, FIT_TABS.indexOf(active), FIT_TABS.length);
    if (next === null) return;
    e.preventDefault();
    onChange(FIT_TABS[next]);
    document.getElementById(`fit-tab-${FIT_TABS[next]}`)?.focus();
  }
  return (
    <div className="sticky top-16 z-30 border-b border-foreground/5 bg-background/70 backdrop-blur-xl">
      <div role="tablist" onKeyDown={onKeyDown} aria-label="Seções do BRL Fit" className="mx-auto flex w-full max-w-5xl overflow-x-auto px-2 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              id={`fit-tab-${id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              aria-controls="fit-panel"
              onClick={() => onChange(id)}
              className={cn(
                "relative flex shrink-0 items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:px-5",
                isActive ? "text-brl-purple" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
              {isActive ? <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brl-purple" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NoPlan() {
  return (
    <section className="flex flex-col items-center gap-4 pt-16 text-center">
      <span aria-hidden className="text-6xl">
        🏋️
      </span>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Seu plano ainda não foi gerado</h2>
      <p className="max-w-sm text-sm text-muted-foreground">Com base no seu perfil, montamos a semana de treino em segundos.</p>
      <GenerateButton label="Gerar meu plano" />
    </section>
  );
}

function Loader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2Icon className="size-6 animate-spin text-brl-purple" aria-label="Carregando" />
    </div>
  );
}

function useTab() {
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseFitTab(useSearchParams().get("aba"));
  const change = (next: FitTab) => {
    router.replace(next === "hoje" ? pathname : `${pathname}?aba=${next}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };
  return { tab, change };
}

export function FitApp() {
  const profile = useFitProfile();
  const plan = useFitPlan();
  const router = useRouter();
  const { tab, change } = useTab();
  useFitSync();
  const [weekday] = useState(() => weekdayInSaoPaulo());

  useEffect(() => {
    if (profile === null) router.replace("/fit/comecar");
  }, [profile, router]);

  if (!profile || plan === undefined) return <Loader />;

  return (
    <div className="min-h-dvh bg-background pb-20">
      <FitBar />
      <FitTabs active={tab} onChange={change} />
      <main id="fit-panel" role="tabpanel" aria-labelledby={`fit-tab-${tab}`} className="mx-auto w-full max-w-5xl px-4 md:px-6">
        {tab === "progresso" ? <ProgressTab /> : null}
        {tab === "biblioteca" ? <ExerciseLibrary embedded /> : null}
        {tab === "hoje" ? plan ? <FitToday plan={plan} weekday={weekday} /> : <NoPlan /> : null}
        {tab === "plano" ? plan ? <PlanTab plan={plan} /> : <NoPlan /> : null}
      </main>
    </div>
  );
}
