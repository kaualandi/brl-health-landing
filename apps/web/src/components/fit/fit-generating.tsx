"use client";

import { useEffect, useState } from "react";

const MESSAGES = ["Analisando seu perfil…", "Escolhendo os exercícios…", "Montando a semana…"];

/** Tela "gerando seu plano" (animação respeita prefers-reduced-motion via motion-reduce). */
export function FitGenerating() {
  const [message, setMessage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMessage((m) => (m + 1) % MESSAGES.length), 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center" role="status">
      <div className="relative mb-8">
        <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-full bg-brl-purple/20 motion-reduce:hidden" />
        <span aria-hidden className="flex size-24 items-center justify-center rounded-full bg-brl-purple/15 text-5xl ring-1 ring-brl-purple/30">
          🏋️
        </span>
      </div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Gerando seu plano…</h1>
      <p aria-live="polite" className="mt-3 h-5 text-sm text-muted-foreground md:text-base">
        {MESSAGES[message]}
      </p>
      <div aria-hidden className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-brl-purple motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
