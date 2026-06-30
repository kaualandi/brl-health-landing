"use client";

import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  Loader2Icon,
  SparklesIcon,
  StarIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { useConsultations } from "@/hooks/use-consultations";
import { usePlan } from "@/hooks/use-plan";
import { creditsForTier } from "@/lib/consultations-store";
import {
  agendaDays,
  formatAgendaDate,
  type Nutritionist,
  NUTRITIONISTS,
  nutritionistById,
  recommendedNutritionist,
  slotsForDay,
} from "@/lib/nutritionists";
import {
  ensureConsultationsHydrated,
  scheduleConsultation,
} from "@/services/consultations.service";
import { cn } from "@/lib/utils";
import type { NutriProfile } from "@/types";

function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <StarIcon className="size-3.5 fill-brl-orange text-brl-orange" />
      <span className="font-semibold text-foreground">
        {rating.toFixed(1)}
      </span>
      <span>({reviews})</span>
    </span>
  );
}

function NutriRow({
  nutri,
  recommended,
  selected,
  onSelect,
}: {
  nutri: Nutritionist;
  recommended: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-brl-purple bg-brl-purple/10"
          : "border-white/8 hover:border-white/20",
      )}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white/5 text-2xl"
        aria-hidden
      >
        {nutri.avatar}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold text-foreground">
            {nutri.name}
          </span>
          {recommended ? (
            <span className="rounded-full bg-brl-purple/15 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-brl-purple uppercase">
              Recomendado
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {nutri.focus}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stars rating={nutri.rating} reviews={nutri.reviews} />
          <span className="text-xs text-muted-foreground">
            {nutri.years} anos · {nutri.crn}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "mt-1 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-brl-purple bg-brl-purple" : "border-white/20",
        )}
        aria-hidden
      >
        {selected ? <CheckIcon className="size-3.5 text-white" /> : null}
      </span>
    </button>
  );
}

function ScheduleSheet({
  profile,
  open,
  onOpenChange,
  remaining,
}: {
  profile: NutriProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remaining: number;
}) {
  const toast = useToast();
  const { consultations, add } = useConsultations();
  const recommended = useMemo(
    () => recommendedNutritionist(profile.goal, profile.diet),
    [profile.goal, profile.diet],
  );

  const [step, setStep] = useState<"pick" | "slot">("pick");
  const [nutriId, setNutriId] = useState(recommended.id);
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const days = useMemo(() => agendaDays(5), []);
  const nutri = nutritionistById(nutriId) ?? recommended;

  const takenTimes = useMemo(() => {
    if (!day) return [];
    return consultations
      .filter((c) => c.nutritionistId === nutriId && c.date === day)
      .map((c) => c.time);
  }, [consultations, nutriId, day]);
  const slots = day ? slotsForDay(nutriId, takenTimes) : [];

  function reset() {
    setStep("pick");
    setNutriId(recommended.id);
    setDay(null);
    setTime(null);
    setBooking(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function goToSlots() {
    setDay(null);
    setTime(null);
    setStep("slot");
  }

  async function confirm() {
    if (!day || !time || booking) return;
    setBooking(true);
    try {
      const consultation = await scheduleConsultation({
        nutritionistId: nutriId,
        date: day,
        time,
      });
      add(consultation);
      toast({
        variant: "success",
        title: "Consulta agendada! 🎉",
        description: `${nutri.name} · ${formatAgendaDate(day)} às ${time}.`,
      });
      handleOpenChange(false);
    } catch (error) {
      toast({
        variant: "error",
        title: "Não rolou agendar",
        description:
          error instanceof Error
            ? error.message
            : "Tente de novo em instantes.",
      });
      setBooking(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-white/5 p-6">
          <p className="text-xs font-medium tracking-wide text-brl-purple uppercase">
            {step === "pick" ? "Escolha o profissional" : "Escolha o horário"}
          </p>
          <SheetTitle className="font-display text-2xl font-extrabold tracking-tight">
            Agendar consulta
          </SheetTitle>
          <SheetDescription>
            Consulta por vídeo de ~40 min.{" "}
            {remaining > 0
              ? `Você tem ${remaining} ${remaining === 1 ? "consulta" : "consultas"} no plano.`
              : "Sem consultas disponíveis no seu plano."}
          </SheetDescription>
        </SheetHeader>

        {step === "pick" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
            {NUTRITIONISTS.map((n) => (
              <NutriRow
                key={n.id}
                nutri={n}
                recommended={n.id === recommended.id}
                selected={n.id === nutriId}
                onSelect={() => setNutriId(n.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-brl-card p-4">
              <span className="grid size-10 place-items-center rounded-full bg-white/5 text-xl" aria-hidden>
                {nutri.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold">
                  {nutri.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {nutri.focus}
                </span>
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Dia
              </p>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => {
                  const active = d.iso === day;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => {
                        setDay(d.iso);
                        setTime(null);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "flex w-16 flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "border-brl-purple bg-brl-purple/10 text-foreground"
                          : "border-white/8 text-muted-foreground hover:border-white/20",
                      )}
                    >
                      <span className="text-[0.7rem] uppercase">{d.weekday}</span>
                      <span className="font-display text-lg font-bold tabular-nums text-foreground">
                        {d.day}
                      </span>
                      <span className="text-[0.7rem]">{d.month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {day ? (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Horário
                </p>
                {slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const active = slot === time;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-xl border py-2.5 text-sm font-semibold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            active
                              ? "border-brl-purple bg-brl-purple text-white"
                              : "border-white/8 text-foreground hover:border-white/20",
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-white/8 p-4 text-sm text-muted-foreground">
                    Sem horários livres nesse dia. Tente outro. 🗓️
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-white/5 p-4">
          {step === "slot" ? (
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-white/10 px-4 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronLeftIcon className="size-4" />
              Voltar
            </button>
          ) : null}

          {step === "pick" ? (
            <button
              type="button"
              onClick={goToSlots}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brl-purple text-sm font-semibold text-white transition-colors outline-none hover:bg-brl-purple/90 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Escolher horário
              <ArrowRightIcon className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={confirm}
              disabled={!day || !time || booking}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brl-purple text-sm font-semibold text-white transition-colors outline-none hover:bg-brl-purple/90 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              {booking ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  Confirmar
                </>
              )}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NutriCoach({ profile }: { profile: NutriProfile }) {
  const { user } = useAuth();
  const { tier } = usePlan();
  const { consultations, cancel } = useConsultations();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const credits = creditsForTier(tier);
  const remaining = Math.max(0, credits - consultations.length);
  const canBook = remaining > 0;

  // Carrega as consultas do servidor ao abrir a tela.
  useEffect(() => {
    if (user) void ensureConsultationsHydrated(user);
  }, [user]);

  async function handleCancel(id: string) {
    try {
      await cancel(id);
    } catch (error) {
      toast({
        variant: "error",
        title: "Não consegui cancelar",
        description: error instanceof Error ? error.message : "Tente de novo.",
      });
      return;
    }
    toast({
      variant: "info",
      title: "Consulta cancelada",
      description: "O horário voltou pra sua agenda.",
    });
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Caminho 1 — IA (já ativo) */}
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <SparklesIcon className="size-5" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <CheckIcon className="size-3.5" />
              Ativo
            </span>
          </div>
          <h3 className="mt-1 font-display text-base font-bold">
            Cardápio por IA
          </h3>
          <p className="text-sm text-muted-foreground">
            Seu plano é montado e ajustado automaticamente a partir do seu perfil.
          </p>
        </div>

        {/* Caminho 2 — nutricionista humano */}
        <div className="flex flex-col gap-2 rounded-2xl border border-brl-purple/25 bg-brl-purple/[0.06] p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-brl-purple/15 text-brl-purple">
              <VideoIcon className="size-5" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {canBook
                ? `${remaining} ${remaining === 1 ? "consulta" : "consultas"} no plano`
                : "Plano sem consultas"}
            </span>
          </div>
          <h3 className="mt-1 font-display text-base font-bold">
            Acompanhamento com um nutri
          </h3>
          <p className="text-sm text-muted-foreground">
            Fale por vídeo com um nutricionista de verdade e refine seu plano com
            um profissional.
          </p>
          {canBook ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-brl-purple text-sm font-semibold text-white transition-colors outline-none hover:bg-brl-purple/90 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <CalendarCheckIcon className="size-4" />
              Agendar consulta
            </button>
          ) : (
            <Link
              href="/precos"
              className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-brl-purple/40 text-sm font-semibold text-brl-purple transition-colors outline-none hover:bg-brl-purple/10 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Liberar consultas
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Consultas marcadas */}
      {consultations.length > 0 ? (
        <div className="mt-5 border-t border-white/5 pt-5">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Suas consultas
          </p>
          <ul className="flex flex-col gap-2.5">
            {consultations.map((c) => {
              const nutri = nutritionistById(c.nutritionistId);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-white/8 p-3"
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-xl"
                    aria-hidden
                  >
                    {nutri?.avatar ?? "🧑‍⚕️"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {nutri?.name ?? "Nutricionista"}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarCheckIcon className="size-3.5" />
                        {formatAgendaDate(c.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="size-3.5" />
                        {c.time}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancel(c.id)}
                    aria-label={`Cancelar consulta com ${nutri?.name ?? "nutricionista"}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors outline-none hover:border-destructive/40 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <XIcon className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <ScheduleSheet
        profile={profile}
        open={open}
        onOpenChange={setOpen}
        remaining={remaining}
      />
    </div>
  );
}
